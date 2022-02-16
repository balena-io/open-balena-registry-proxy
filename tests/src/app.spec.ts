import { expect } from 'chai';
import * as request from 'supertest';
import {
	TEST_REPO,
	TEST_USER,
	TEST_TOKEN,
	REGISTRY_URL,
} from '../../src/config';
import { app } from '../../src/app';

const manifestSchema = 'application/vnd.docker.distribution.manifest.v2+json';
const apiVersion = 'registry/2.0';
const userAgent = 'docker/20.10.7';

const basicAuth = Buffer.from(`${TEST_USER}:${TEST_TOKEN}`).toString('base64');

const [testOrg, testApp, testVersion, testService] =
	TEST_REPO.split('/').filter(Boolean);

const repoSlugs: string[] = [];
const repoVersion = [undefined, 'latest', testVersion];
const repoServices = [undefined, testService];

repoVersion.forEach((version) => {
	repoServices.forEach((service) => {
		const slug = [
			testOrg,
			testApp,
			version,
			version != null ? service : undefined,
		]
			.filter(Boolean)
			.join('/');
		if (repoSlugs.includes(slug)) {
			return;
		}
		repoSlugs.push(slug);
	});
});

describe('GET /ping', function () {
	it('responds with Ok', function (done) {
		request(app).get('/ping').send().expect(200).expect('pong', done);
	});
});

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

repoSlugs.forEach((slug) => {
	let authToken = '';

	// https://docs.docker.com/registry/spec/auth/scope/
	describe('GET /auth/v1/token', function () {
		it('should return an authorization token', async function () {
			const response = await request(app)
				.get('/auth/v1/token')
				.query({
					account: TEST_USER,
					scope: `repository:${slug}:pull`,
					service: REGISTRY_URL,
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

	const path = ['', 'v2', slug, 'manifests', 'foobar'].join('/');

	// https://docs.docker.com/registry/spec/api/#pulling-an-image
	describe(`HEAD ${path}`, function () {
		it('should return an image manifest', async function () {
			const response = await request(app)
				.head(path)
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
