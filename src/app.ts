import * as express from 'express';
import * as proxy from 'http-proxy-middleware';
import { getImageLocation } from './balena';
import { config } from './config';

const registryProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${config.useHttps ? 'https' : 'http'}://${config.registryHost}`,
	changeOrigin: true,
	async pathRewrite(path, _req) {
		const url = new URL(
			`${config.useHttps ? 'https' : 'http'}://${config.registryHost}${path}`,
		);

		// pathname should be in the format
		// /v2/org/fleet/service/release/method/tag
		const imageRef = url.pathname.split('/');
		imageRef.shift(); // drop the preceding empty element

		const version = imageRef.shift(); // should always be v2 for balenaCloud
		const tag = imageRef.pop(); // we can't use the tag as each release has a unique repo
		const method = imageRef.pop(); // 'manifests' or 'blobs'
		const repository = imageRef.join('/'); // whatever is left should be the 2-4 depth repository path

		if (!version || !repository || !tag || !method) {
			// this may be an API version check or other command, just forward it
			// https://docs.docker.com/registry/spec/api/#api-version-check
			return path;
		}

		const imageLocation = await getImageLocation(repository);

		if (!imageLocation) {
			console.error(`Failed find a matching release: ${repository}`);
			// TODO: should we bail out here somehow and respond 404?
			return path;
		}

		// remove the registry host prefix
		const imagePath = imageLocation.split('/').slice(1).join('/');

		// update the path with the repository path retrieved from the api
		url.pathname = url.pathname.replace(repository, imagePath);

		// if we are getting the manifest list the tag should always be "latest"
		if (method === 'manifests') {
			url.pathname = url.pathname.replace(tag, 'latest');
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
			].replace(
				`${config.useHttps ? 'https' : 'http'}://${config.authHost}`,
				`http://${req.headers.host}`,
			);
			console.log(`[onProxyRes] ${proxyRes.headers['www-authenticate']}`);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${config.useHttps ? 'https' : 'http'}://${config.authHost}`,
	changeOrigin: true,
	async pathRewrite(path, _req) {
		const url = new URL(
			`${config.useHttps ? 'https' : 'http'}://${config.authHost}${path}`,
		);

		// parse the scope parameter from the auth request
		// https://docs.docker.com/registry/spec/auth/token/
		const scope = url.searchParams.get('scope') || undefined;

		if (!scope) {
			console.error('Forwarding unhandled auth request!');
			return path;
		}

		const scopeRef = scope.split(':');

		const resourceType = scopeRef.shift(); // eg. 'repository'
		const resourceName = scopeRef.shift(); // eg. 'org/fleet/service/release'
		const resourceAction = scopeRef.shift(); // eg. 'pull'

		if (!resourceName) {
			console.error('Forwarding unhandled auth request!');
			return path;
		}

		const imageLocation = await getImageLocation(resourceName);

		if (!imageLocation) {
			console.error(`Failed find a matching release: ${resourceName}`);
			return path;
		}

		// remove the registry host prefix
		const imagePath = imageLocation.split('/').slice(1).join('/');

		// update the scope with the repository path retrieved from the api
		url.searchParams.set(
			'scope',
			[resourceType, imagePath, resourceAction].join(':'),
		);

		// remove the host prefix from the url parser href so we are left with the path and params
		const newPath = url.href.replace(url.origin, '');

		console.log(`[pathRewrite] ${newPath}`);
		return newPath;
	},
});

// create express server
export const app = express();

// info endpoint
app.get('/info', (_req, res, _next) => {
	res.send('Pull images from balenaCloud container registry with fleet slugs!');
});

// proxied endpoints
app.use('/v2', registryProxy);
app.use('/auth', authProxy);
