import express from 'express';
import * as authorization from 'auth-header';
import jsonwebtoken from 'jsonwebtoken';
import _ from 'lodash';
import { ERROR_DENIED } from '../../src/errors';
import access from '../fixtures/access.json';

// listen on /v2 for version, manifest, and blobs requests
// if JWT is not included, return 401 with www-authentication header
// if JWT is included verify that name in the url matches the scope name and return OK

/*
 * Group 1: version
 * Optional:
 * - Group 2: repository name
 * - Group 3: request method
 * - Group 4: tag
 */
const URL_REGEX = /^\/([\w\d]*)\/(?:([\s\S]+)\/(manifests|blobs)\/([\s\S]+))?$/;

// create express server
const app = express();

app.use('/v2/', (req, res) => {
	function needsAuth() {
		const realm = 'http://127.0.0.1/auth/v1/token';
		const service = req.headers.host!;
		res.set(
			'WWW-Authenticate',
			authorization.format('Bearer', undefined, { realm, service }),
		);
		res.status(401).send();
	}

	if (!req.headers['authorization']) {
		needsAuth();
		return;
	}

	const auth = authorization.parse(req.headers['authorization']);

	if (auth.params.error || !auth.token || auth.scheme !== 'Bearer') {
		// bail out if the auth header is not in the expected bearer format
		return res.status(403).json(ERROR_DENIED);
	}

	// https://docs.docker.com/registry/spec/auth/jwt/
	const jwt = jsonwebtoken.decode(auth.token as string);

	if (jwt == null) {
		throw new Error('Invalid JWT');
	}

	const matches = req.originalUrl.match(URL_REGEX);

	if (matches == null || matches.length < 4) {
		// the url could not be parsed
		return res.status(403).json(ERROR_DENIED);
	}

	const found = _.find(access, {
		type: 'repository',
		name: matches[2],
	});

	if (found != null) {
		return res.status(200).send();
	}

	return res.status(403).json(ERROR_DENIED);
});

export default app;
