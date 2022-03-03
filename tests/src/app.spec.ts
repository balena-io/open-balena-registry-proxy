import 'dotenv/config';
import { expect } from 'chai';
import * as request from 'supertest';
import { optionalVar } from '../../src/config';
import { app } from '../../src/app';
import * as authorization from 'auth-header';

const manifestSchema = 'application/vnd.docker.distribution.manifest.v2+json';
const apiVersion = 'registry/2.0';
const userAgent = 'docker/20.10.7';

const TEST_USER = optionalVar('TEST_USER');
const TEST_TOKEN = optionalVar('TEST_TOKEN');
const TEST_APP_SLUG = optionalVar(
	'TEST_APP_SLUG',
	'balenablocks/dashboard/0.0.0',
);

const [testOrg, testApp, testVersion, testService] =
	TEST_APP_SLUG.split('/').filter(Boolean);

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

let authenticate;

// https://docs.docker.com/registry/spec/api/#api-version-check
describe('GET /v2/', function () {
	it('responds with unauthorized', async function () {
		const response = await request(app)
			.get('/v2/')
			.set('User-Agent', userAgent)
			.set('Accept', 'application/json');
		expect(response.status).equals(401);
		expect(response.headers['docker-distribution-api-version']).equals(
			apiVersion,
		);
		expect(response.headers['www-authenticate']).to.exist;
		authenticate = authorization.parse(response.headers['www-authenticate']);
	});
});

repoSlugs.forEach((slug) => {
	let authToken;

	// https://docs.docker.com/registry/spec/auth/scope/
	describe('GET /auth/v1/token', function () {
		it('should return an authorization token', async function () {
			const response = await require('axios').get(authenticate.params.realm, {
				params: {
					account: TEST_USER,
					scope: `repository:${slug}:pull`,
					service: authenticate.params.service,
				},
				auth: {
					username: TEST_USER,
					password: TEST_TOKEN,
				},
			});

			expect(response.status).equals(200);
			expect(response.data['token']).to.exist;
			authToken = response.data['token'];
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
			expect(response.status).equals(200);
			expect(response.headers['docker-content-digest']).to.exist;
			expect(response.headers['docker-distribution-api-version']).equals(
				apiVersion,
			);
			expect(response.headers['content-type']).equals(manifestSchema);
		});
	});
});
