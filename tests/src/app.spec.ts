import { expect } from 'chai';
import { config, test } from '../../src/config';
import { parseReleaseRef } from '../../src/parse';
import * as request from 'supertest';
import { app } from '../..';

const releaseRef = parseReleaseRef(test.repository);
const fleet = releaseRef?.fleet.slug;

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

releases.forEach((release) => {
	services.forEach((service) => {
		const repo = [fleet, release, release != null ? service : undefined]
			.filter(Boolean)
			.join('/');

		let token = '';
		// https://docs.docker.com/registry/spec/api/#api-version-check
		describe('GET /v2/', function () {
			it('responds with www-authenticate', async function () {
				const response = await request(app)
					.get('/v2/')
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
		describe('GET /auth/v1/token/', function () {
			it('responds with token', async function () {
				const response = await request(app)
					.get('/auth/v1/token/')
					.query({
						scope: `repository:${repo}:pull`,
						service: `${config.registryUrl.replace(/(^\w+:|^)\/\//, '')}`,
					})
					.set('Accept', 'application/json');
				// console.debug(response.headers);
				// console.debug(response.body);
				expect(response.status).equals(200);
				expect(response.headers['content-type']).to.match(/application\/json/);
				expect(response.body['token']).to.exist;
				token = response.body['token'];
			});
		});

		// https://docs.docker.com/registry/spec/api/#pulling-an-image
		describe(`HEAD /v2/${repo}/manifests/latest`, function () {
			it('responds with manifest', async function () {
				const response = await request(app)
					.head(`/v2/${repo}/manifests/latest`)
					.set('Authorization', `Bearer ${token}`)
					.set(
						'Accept',
						'application/vnd.docker.distribution.manifest.v2+json',
					);
				// console.debug(response.headers);
				// console.debug(response.body);
				expect(response.status).equals(200);
				expect(response.headers['docker-content-digest']).to.exist;
				expect(response.headers['docker-distribution-api-version']).to.match(
					/registry\/2.0/,
				);
				expect(response.headers['content-type']).to.match(
					/application\/vnd.docker.distribution.manifest.v2\+json/,
				);
			});
		});
	});
});
