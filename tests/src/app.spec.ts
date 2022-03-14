import 'dotenv/config';
import { expect } from 'chai';
import * as request from 'supertest';
import app from '../../src/app';
import registry from '../test-lib/registry';
import * as access from '../fixtures/access.json';
import { generateToken } from '../test-lib/token';

let mockRegistry: any;
const mockRegistryPort = 5000;

const REGISTRY_URL = `http://127.0.0.1:${mockRegistryPort}`;

before(function (done) {
	mockRegistry = registry.listen(mockRegistryPort, () => {
		console.log(`Mock registry started on port ${mockRegistryPort}`);
		done();
	});
});

after(function (done) {
	mockRegistry.close(done);
});

describe('GET /ping', function () {
	it('responds with Ok', function (done) {
		request(app(REGISTRY_URL))
			.get('/ping')
			.send()
			.expect(200)
			.expect('pong', done);
	});
});

// https://docs.docker.com/registry/spec/api/#api-version-check
describe('GET /v2/', function () {
	it('responds with unauthorized', async function () {
		const response = await request(app(REGISTRY_URL)).get('/v2/');
		expect(response.status).equals(401);
		expect(response.headers['www-authenticate']).to.exist;
	});
});

// https://docs.docker.com/registry/spec/api/#pulling-an-image
access.forEach((item) => {
	describe(`get latest manifest with valid jwt`, function () {
		it('should respond with OK', function (done) {
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/blobs/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(200, done);
		});
	});

	describe(`get sha256 digest with valid jwt`, function () {
		it('should respond with OK', function (done) {
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/blobs/sha256:d3adc0de`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(200, done);
		});
	});

	describe(`get latest manifest with invalid jwt (missing alias)`, function () {
		it('should respond with with 403', function (done) {
			delete item['alias'];
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403, done);
		});
	});

	describe(`get latest manifest with invalid jwt (missing name)`, function () {
		it('should respond with with 403', function (done) {
			delete item['name'];
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403, done);
		});
	});

	describe(`get latest manifest with invalid jwt (missing access)`, function () {
		it('should respond with with 403', function (done) {
			delete item['access'];
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403, done);
		});
	});

	describe(`get invalid path (missing tag) with valid jwt`, function () {
		it('should respond with with 403', function (done) {
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403, done);
		});
	});

	describe(`get invalid path (missing method) with valid jwt`, function () {
		it('should respond with with 403', function (done) {
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403, done);
		});
	});

	describe(`get invalid path (missing version) with valid jwt`, function () {
		it('should respond with with 404', function (done) {
			const jwt = generateToken('', '', [item]);
			request(app(REGISTRY_URL))
				.get(`/${item.alias}/manifests`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(404, done);
		});
	});
});
