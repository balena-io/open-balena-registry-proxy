import 'dotenv/config';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import registry from '../test-lib/registry.js';
import access from '../fixtures/access.json' with { type: 'json' };
import { generateToken } from '../test-lib/token.js';
import type http from 'http';

let mockRegistry: http.Server;
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
	it('responds with Ok', async function () {
		await request(app(REGISTRY_URL))
			.get('/ping')
			.send()
			.expect(200)
			.expect('pong');
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
		it('should respond with OK', async function () {
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(200);
		});
	});

	describe(`get sha256 digest with valid jwt`, function () {
		it('should respond with OK', async function () {
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/blobs/sha256:d3adc0de`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(200);
		});
	});

	describe(`get latest manifest with invalid jwt (missing alias)`, function () {
		it('should respond with with 403', async function () {
			// @ts-expect-error deleting a required property
			delete item['alias'];
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403);
		});
	});

	describe(`get latest manifest with invalid jwt (missing name)`, function () {
		it('should respond with with 403', async function () {
			// @ts-expect-error deleting a required property
			delete item['name'];
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403);
		});
	});

	describe(`get latest manifest with invalid jwt (missing actions)`, function () {
		it('should respond with with 403', async function () {
			// @ts-expect-error deleting a required property
			delete item['actions'];
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests/latest`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403);
		});
	});

	describe(`get invalid path (missing tag) with valid jwt`, function () {
		it('should respond with with 403', async function () {
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}/manifests`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403);
		});
	});

	describe(`get invalid path (missing method) with valid jwt`, function () {
		it('should respond with with 403', async function () {
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/v2/${item.alias}`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(403);
		});
	});

	describe(`get invalid path (missing version) with valid jwt`, function () {
		it('should respond with with 404', async function () {
			const jwt = generateToken([item]);
			await request(app(REGISTRY_URL))
				.get(`/${item.alias}/manifests`)
				.set('Authorization', `Bearer ${jwt}`)
				.send()
				.expect(404);
		});
	});
});
