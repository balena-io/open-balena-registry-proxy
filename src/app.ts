import express from 'express';
import * as proxy from 'http-proxy-middleware';
import * as authorization from 'auth-header';
import jsonwebtoken from 'jsonwebtoken';
import _ from 'lodash';
import { ERROR_DENIED } from './errors';
import { TRUST_PROXY, REGISTRY_URL } from './config';

/*
 * Group 1: version
 * Optional:
 * - Group 2: repository name
 * - Group 3: request method
 * - Group 4: tag
 */
const URL_REGEX = /^\/([\w\d]*)\/(?:([\s\S]+)\/(manifests|blobs)\/([\s\S]+))?$/;

interface Access {
	name: string;
	type: string;
	actions: string[];
	alias?: string;
}

function rewriteRepository(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction,
) {
	const matches = req.originalUrl.match(URL_REGEX);

	if (matches == null) {
		// the url could not be parsed
		return res.status(403).json(ERROR_DENIED);
	}

	if (matches[4] == null) {
		// just a version request, forward it
		next();
		return;
	}

	const version = matches[1];
	const repository = matches[2];
	const method = matches[3];
	const tag = matches[4];

	if (!req.headers['authorization']) {
		// we need the authorization header with a JWT to go any further
		next();
		return;
	}

	const auth = authorization.parse(req.headers['authorization']);

	if (auth.params.error || !auth.token || auth.scheme !== 'Bearer') {
		// bail out if the auth header is not in the expected bearer format
		return res.status(403).json(ERROR_DENIED);
	}

	// https://docs.docker.com/registry/spec/auth/jwt/
	const jwt = jsonwebtoken.decode(auth.token as string) as { access: Access[] };

	// API should have added an 'alias' field to the access list of the JWT
	const access = _.find(jwt.access, {
		type: 'repository',
		alias: repository,
	});

	if (access?.name == null) {
		// bail out if we could not match this request to an alias in the JWT
		return res.status(403).json(ERROR_DENIED);
	}

	// rewrite the request and replace the alias with the real repo path
	res.locals.path = [
		'',
		version,
		access.name,
		method,
		method === 'manifests' ? 'latest' : tag,
	].join('/');

	next();
}

function registryProxyMiddleware(target: string) {
	return proxy.createProxyMiddleware({
		logLevel: 'debug',
		target,
		changeOrigin: true,
		onProxyReq(proxyReq, _req: express.Request, res: express.Response) {
			if (res.locals.path) {
				console.debug(`<== ${proxyReq.path}`);
				proxyReq.path = res.locals.path;
				console.debug(`==> ${proxyReq.path}`);
			}
		},
	});
}

function registryProxy(
	target: string = REGISTRY_URL,
	trustProxy: string | number | boolean = TRUST_PROXY,
) {
	// create express server
	const app = express();
	app.set('trust proxy', trustProxy);

	// proxy endpoint
	app.use('/v2/', rewriteRepository, registryProxyMiddleware(target));

	app.use((_req, res, next) => {
		res.set('X-Frame-Options', 'DENY');
		res.set('X-Content-Type-Options', 'nosniff');
		next();
	});

	// ping endpoint
	app.use('/ping', (_req, res) => {
		res.status(200).send('pong');
	});

	// return express server
	return app;
}

export default registryProxy;
