import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import { lookupReleaseImage } from './balena';
import { auth, config } from './config';
import { parseImageRequest, parseScopeRequest } from './parse';

const registryProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${config.registryUrl}`,
	changeOrigin: true,
	async pathRewrite(path, _req) {
		const url = new URL(`${config.registryUrl}${path}`);

		const imageReq = parseImageRequest(url.pathname);

		if (!imageReq?.release) {
			// this doesn't look like an image request, just forward it
			return path;
		}

		const releaseRef = await lookupReleaseImage(imageReq.release);

		if (!releaseRef?.content_hash) {
			console.error('Forwarding unhandled image request!');
			// TODO: should we bail out here and respond 404?
			return path;
		}

		// replace the repository with the release image path
		url.pathname = url.pathname.replace(imageReq.repository, releaseRef.path);

		// replace the tag with the content hash
		if (imageReq.method === 'manifests') {
			url.pathname = url.pathname.replace(
				imageReq.tag,
				releaseRef.content_hash,
			);
		}

		// remove the host prefix from the url parser href so we are left with the path and params
		const newPath = url.href.replace(url.origin, '');

		console.log(`[pathRewrite] ${newPath}`);
		return newPath;
	},
	async onProxyRes(proxyRes, req, _res) {
		// replace www-authenticate bearer realm to direct auth requests to the proxy
		if (proxyRes.headers['www-authenticate']) {
			proxyRes.headers['www-authenticate'] = proxyRes.headers[
				'www-authenticate'
			].replace(`${auth.apiUrl}`, `http://${req.headers.host}`);
			console.log(`[onProxyRes] ${proxyRes.headers['www-authenticate']}`);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${auth.apiUrl}`,
	changeOrigin: true,
	async pathRewrite(path, _req) {
		const url = new URL(`${auth.apiUrl}${path}`);

		const scopeRequest = parseScopeRequest(url.searchParams.get('scope') || '');

		if (!scopeRequest?.release) {
			console.error('Forwarding unhandled auth request!');
			// TODO: should we bail out here and respond 401?
			return path;
		}

		const releaseRef = await lookupReleaseImage(scopeRequest.release);

		if (!releaseRef?.path) {
			console.error('Forwarding unhandled auth request!');
			// TODO: should we bail out here and respond 401?
			return path;
		}

		// update the scope with the repository path retrieved from the api
		url.searchParams.set(
			'scope',
			[scopeRequest.type, releaseRef.path, scopeRequest.action].join(':'),
		);

		// remove the host prefix from the url parser href so we are left with the path and params
		const newPath = url.href.replace(url.origin, '');

		console.log(`[pathRewrite] ${newPath}`);
		return newPath;
	},
});

// create express server
export const app = express();

// proxied endpoints
app.use('/v2', registryProxy);
app.use('/auth', authProxy);
