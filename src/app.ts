import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import { getImageLocation } from './balena';
import { config } from './config';
import { imageRefParser, scopeRefParser, repoRefParser } from './parse';

const registryProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${config.registryUrl}`,
	changeOrigin: true,
	async pathRewrite(path, _req) {
		const url = new URL(`${config.registryUrl}${path}`);

		// pathname should be in the format
		// /v2/org/fleet/service/release/method/tag
		const imageRequest = imageRefParser(url.pathname);

		if (
			!imageRequest ||
			!imageRequest.version ||
			!imageRequest.repository ||
			!imageRequest.tag ||
			!imageRequest.method
		) {
			// this may be an API version check or other command, just forward it
			// https://docs.docker.com/registry/spec/api/#api-version-check
			return path;
		}

		const imageLocation = await getImageLocation(imageRequest.repository);

		if (!imageLocation) {
			console.error(
				`Failed to find a matching release: ${imageRequest.repository.slug}`,
			);
			// TODO: should we bail out here somehow and respond 404?
			return path;
		}

		// remove the registry host prefix
		const imagePath = imageLocation.split('/').slice(1).join('/');

		// update the path with the repository path retrieved from the api
		url.pathname = url.pathname.replace(
			imageRequest.repository.slug,
			imagePath,
		);

		// if we are getting the manifest list the tag should always be "latest"
		if (imageRequest.method === 'manifests') {
			url.pathname = url.pathname.replace(imageRequest.tag, 'latest');
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
			].replace(`${config.apiUrl}`, `http://${req.headers.host}`);
			console.log(`[onProxyRes] ${proxyRes.headers['www-authenticate']}`);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${config.apiUrl}`,
	changeOrigin: true,
	async pathRewrite(path, _req) {
		const url = new URL(`${config.apiUrl}${path}`);

		const scopeRequest = scopeRefParser(url.searchParams.get('scope') || '');

		if (
			!scopeRequest ||
			!scopeRequest.name ||
			!scopeRequest.type ||
			!scopeRequest.action
		) {
			// console.error('Forwarding unhandled auth request!');
			return path;
		}

		const repoRef = repoRefParser(scopeRequest?.name);

		if (!repoRef) {
			console.error(`Forwarding unhandled auth request!: ${scopeRequest.name}`);
			return path;
		}

		const imageLocation = await getImageLocation(repoRef);

		if (!imageLocation) {
			console.error(`Failed to find a matching release: ${scopeRequest.name}`);
			// TODO: should we bail out here somehow and respond 404?
			return path;
		}

		// remove the registry host prefix
		const imagePath = imageLocation.split('/').slice(1).join('/');

		// update the scope with the repository path retrieved from the api
		url.searchParams.set(
			'scope',
			[scopeRequest.type, imagePath, scopeRequest.action].join(':'),
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
