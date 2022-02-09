import { expect } from 'chai';
import * as config from '../../src/config';
import { parseReleaseRef } from '../../src/parse';
import * as request from 'supertest';
import { app } from '../../src/app';

const manifestSchema = 'application/vnd.docker.distribution.manifest.v2+json';
const apiVersion = 'registry/2.0';
const userAgent = 'docker/20.10.7';
const releaseRef = parseReleaseRef(config.test.repo);
const application = releaseRef?.application.slug;

const releases = Array.from(
	new Set([
		undefined,
		'latest',
		'current',
		'default',
		'pinned',
		releaseRef?.version != null ? releaseRef?.version : undefined,
	]),
);
const services = Array.from(
	new Set([
		undefined,
		releaseRef?.service != null ? releaseRef?.service : undefined,
	]),
);

const basicAuth = Buffer.from(
	`${config.api.username}:${config.api.token}`,
).toString('base64');

releases.forEach((release) => {
	services.forEach((service) => {
		const repo = [application, release, release != null ? service : undefined]
			.filter(Boolean)
			.join('/');

		let authToken = '';
		// const identityToken = '';
		// https://docs.docker.com/registry/spec/api/#api-version-check
		describe('GET /v2/', function () {
			it('responds with unauthorized', async function () {
				const response = await request(app)
					.get('/v2/')
					.set('User-Agent', userAgent)
					.set('Accept', 'application/json');
				// console.debug(response.headers);
				// console.debug(response.body);
				expect(response.status).equals(401);
				expect(response.headers['content-type']).to.match(/application\/json/);
				expect(response.headers['docker-distribution-api-version']).to.match(
					/registry\/2.0/,
				);
				expect(response.headers['www-authenticate']).to.match(/127.0.0.1/);
			});
		});

		// https://docs.docker.com/registry/spec/auth/scope/
		describe('GET /auth/v1/token', function () {
			it('responds with token', async function () {
				const response = await request(app)
					.get('/auth/v1/token')
					.query({
						account: config.api.username,
						scope: `repository:${repo}:pull`,
						service: `${config.registry.url.replace(/(^\w+:|^)\/\//, '')}`,
					})
					.set('Authorization', `Basic ${basicAuth}`)
					.set('Accept', 'application/json');
				// console.debug(response.headers);
				// console.debug(response.body);
				expect(response.status).equals(200);
				expect(response.headers['content-type']).to.match(/application\/json/);
				expect(response.body['token']).to.exist;
				authToken = response.body['token'];
			});
		});

		// https://docs.docker.com/registry/spec/api/#pulling-an-image
		describe(`HEAD /v2/${repo}/manifests/latest`, function () {
			it('responds with manifest', async function () {
				const response = await request(app)
					.head(`/v2/${repo}/manifests/latest`)
					.set('Authorization', `Bearer ${authToken}`)
					.set('User-Agent', userAgent)
					.set('Accept', manifestSchema);
				// console.debug(response.headers);
				// console.debug(response.body);
				expect(response.status).equals(200);
				expect(response.headers['docker-content-digest']).to.exist;
				expect(response.headers['docker-distribution-api-version']).equals(
					apiVersion,
				);
				expect(response.headers['content-type']).equals(manifestSchema);
			});
		});
	});
});
