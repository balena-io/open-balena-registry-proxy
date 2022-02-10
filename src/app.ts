import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import * as sdk from './balena';
import * as config from './config';
import { parseImageReq, parseScopeReq } from './parser';
import * as authorization from 'auth-header';

function resolveRepo(
	req: express.Request & { resolvedPath: string },
	res: express.Response,
	next: express.NextFunction,
) {
	const url = new URL(config.api.url + req.originalUrl);
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
				return res.sendStatus(404);
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
			return res.sendStatus(500);
		});
}

function resolveScope(
	req: express.Request & { resolvedPath: string },
	res: express.Response,
	next: express.NextFunction,
) {
	const url = new URL(config.api.url + req.originalUrl);
	const scopeReq = parseScopeReq(url.searchParams.get('scope') || '');

	if (!scopeReq?.name) {
		console.error('Failed to parse auth request!');
		return res.sendStatus(401);
	}

	sdk
		.lookupReleaseImage(scopeReq.name)
		.then((release) => {
			if (!release?.digest) {
				console.error('Failed to resolve a release matching this request');
				return res.sendStatus(401);
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
			return res.sendStatus(500);
		});
}

const registryProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: config.registry.url,
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
				return res.sendStatus(401);
			}

			auth.params.realm = (auth.params.realm as string).replace(
				config.api.url,
				`http://${req.headers.host}`,
			);

			console.debug(`<== ${proxyRes.headers['www-authenticate']}`);
			proxyRes.headers['www-authenticate'] = authorization.format(auth as any);
			console.debug(`==> ${proxyRes.headers['www-authenticate']}`);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: config.api.url,
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

// proxied endpoints
app.use('/v2/', resolveRepo, registryProxy);
app.use('/auth/v1/token', resolveScope, authProxy);
