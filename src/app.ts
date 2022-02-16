import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import * as sdk from './balena';
import { parseImageReq, parseScopeReq } from './parser';
import * as authorization from 'auth-header';
import { errors, registryError } from './errors';
import { TRUST_PROXY, API_URL, REGISTRY_URL } from './config';

function resolveRepo(
	req: express.Request & { resolvedPath: string },
	res: express.Response,
	next: express.NextFunction,
) {
	const url = new URL(API_URL + req.originalUrl);
	const imageReq = parseImageReq(url.pathname);

	if (!imageReq?.name) {
		// this doesn't look like an manifest or digest request
		return next();
	}

	sdk
		.lookupReleaseImage(imageReq.name)
		.then((resolved) => {
			if (!resolved?.repo || !resolved?.digest) {
				console.error('Failed to resolve a release matching this request');
				return res.status(404).json(registryError(errors.NAME_UNKNOWN));
			}

			if (imageReq.method === 'manifests') {
				url.pathname = [
					'',
					imageReq.version,
					resolved.repo,
					imageReq.method,
					resolved.digest,
				].join('/');
			} else {
				url.pathname = [
					'',
					imageReq.version,
					resolved.repo,
					imageReq.method,
					imageReq.tag,
				].join('/');
			}

			req.resolvedPath = url.pathname + url.search;
			return next();
		})
		.catch((err) => {
			console.error(err);
			return res.status(401).json(registryError(errors.DENIED));
		});
}

function resolveScope(
	req: express.Request & { resolvedPath: string },
	res: express.Response,
	next: express.NextFunction,
) {
	const url = new URL(API_URL + req.originalUrl);
	const scopeReq = parseScopeReq(url.searchParams.get('scope') || '');

	if (!scopeReq?.name) {
		console.error('Failed to parse auth request!');
		return res.status(401).json(registryError(errors.UNSUPPORTED));
	}

	sdk
		.lookupReleaseImage(scopeReq.name)
		.then((release) => {
			if (!release?.digest) {
				console.error('Failed to resolve a release matching this request');
				return res.status(401).json(registryError(errors.NAME_UNKNOWN));
			}

			// update the scope with the repository path retrieved from the api
			url.searchParams.set(
				'scope',
				[scopeReq.type, release.repo, scopeReq.action].join(':'),
			);

			req.resolvedPath = url.pathname + url.search;
			return next();
		})
		.catch((err) => {
			console.error(err);
			return res.status(401).json(registryError(errors.DENIED));
		});
}

const registryProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: REGISTRY_URL,
	changeOrigin: true,
	onProxyReq(proxyReq, req: express.Request & { resolvedPath: string }) {
		if (req.resolvedPath) {
			console.debug(`<== ${proxyReq.path}`);
			proxyReq.path = req.resolvedPath;
			console.debug(`==> ${proxyReq.path}`);
		}
	},
	onProxyRes(proxyRes, req: express.Request, res: express.Response) {
		if (proxyRes.headers['www-authenticate']) {
			const auth = authorization.parse(proxyRes.headers['www-authenticate']);

			if (auth.params.error) {
				console.error(auth.params.error);
				return res.status(401).json(errors.UNAUTHORIZED);
			}

			auth.params.realm = (auth.params.realm as string).replace(
				/(.)+\/auth\/v1\/token/,
				`${req.protocol}://${req.headers.host}/auth/v1/token`,
			);

			console.debug(`<== ${proxyRes.headers['www-authenticate']}`);
			proxyRes.headers['www-authenticate'] = authorization.format(auth as any);
			console.debug(`==> ${proxyRes.headers['www-authenticate']}`);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: API_URL,
	changeOrigin: true,
	onProxyReq(proxyReq, req: express.Request & { resolvedPath: string }) {
		if (req.resolvedPath) {
			console.debug(`<== ${proxyReq.path}`);
			proxyReq.path = req.resolvedPath;
			console.debug(`==> ${proxyReq.path}`);
		}
	},
});

// create express server
export const app = express();
app.set('trust proxy', TRUST_PROXY);

// proxied endpoints
app.use('/v2/', resolveRepo, registryProxy);
app.use('/auth/v1/token', resolveScope, authProxy);

app.get('/ping', (_req, res) => {
	res.status(200).send('pong');
});
