import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import { lookupReleaseImage } from './balena';
import * as config from './config';
import { parseImageRequest, parseScopeRequest } from './parse';

function resolveRepo(
	req: express.Request & { resolvedPath: string },
	res: express.Response,
	next: express.NextFunction,
) {
	const url = new URL(config.api.url + req.originalUrl);
	const imageReq = parseImageRequest(url.pathname);

	if (!imageReq?.release) {
		// this doesn't look like an manifest or digest request
		return next();
	}

	lookupReleaseImage(imageReq.release)
		.then((releaseRef) => {
			if (!releaseRef?.content_hash) {
				console.error('Failed to resolve a release matching this request');
				return res.sendStatus(404);
			}

			if (imageReq.method === 'manifests') {
				url.pathname = [
					'',
					imageReq.version,
					releaseRef.path,
					imageReq.method,
					releaseRef.content_hash,
				].join('/');
			} else {
				url.pathname = [
					'',
					imageReq.version,
					releaseRef.path,
					imageReq.method,
					imageReq.tag,
				].join('/');
			}

			req.resolvedPath = url.pathname + url.search;
			return next();
		})
		.catch((err) => {
			console.error(err);
			res.sendStatus(500);
		});
}

function resolveScope(
	req: express.Request & { resolvedPath: string },
	res: express.Response,
	next: express.NextFunction,
) {
	const url = new URL(config.api.url + req.originalUrl);
	const scopeRequest = parseScopeRequest(url.searchParams.get('scope') || '');

	if (!scopeRequest?.release) {
		console.error('Failed to parse auth request!');
		return res.sendStatus(401);
	}

	lookupReleaseImage(scopeRequest.release)
		.then((releaseRef) => {
			if (!releaseRef?.content_hash) {
				console.error('Failed to resolve a release matching this request');
				return res.sendStatus(401);
			}

			// update the scope with the repository path retrieved from the api
			url.searchParams.set(
				'scope',
				[scopeRequest.type, releaseRef.path, scopeRequest.action].join(':'),
			);

			req.resolvedPath = url.pathname + url.search;
			return next();
		})
		.catch((err) => {
			console.error(err);
			res.sendStatus(500);
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
	onProxyRes(proxyRes, req, _res) {
		// TODO: catch error="insufficient_scope" errors
		// replace www-authenticate bearer realm to direct auth requests to the proxy
		// const json = JSON.parse(proxyRes.headers['www-authenticate']);
		// console.debug(json);
		if (proxyRes.headers['www-authenticate']) {
			console.debug(`<== ${proxyRes.headers['www-authenticate']}`);
			proxyRes.headers['www-authenticate'] = proxyRes.headers[
				'www-authenticate'
			].replace(`${config.api.url}`, `http://${req.headers.host}`);
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
