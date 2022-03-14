import 'dotenv/config';
import * as Docker from 'dockerode';
import { expect } from 'chai';
import app from '../../src/app';
import { REGISTRY_URL } from '../../src/config';
import * as access from '../fixtures/access.json';

// const options = {
// 	...(TEST_USER &&
// 		TEST_TOKEN && {
// 			authconfig: {
// 				username: TEST_USER,
// 				password: TEST_TOKEN,
// 			},
// 		}),
// };

const options = {};

const PROXY_PORT = 5000;

const docker = new Docker();

let proxy: any;

before(function (done) {
	proxy = app(REGISTRY_URL).listen(PROXY_PORT, () => {
		console.log(`Proxy started on port ${PROXY_PORT}`);
		done();
	});
});

after(function (done) {
	proxy.close(done);
});

// https://docs.docker.com/registry/spec/api/#pulling-an-image
access.forEach((item) => {
	const path = [`localhost:${PROXY_PORT}`, item.alias].join('/');

	describe(`docker pull ${path}`, function () {
		it('should pull the specified manifest via the proxy', function (done) {
			this.timeout(24000);

			docker.pull(path, options, function (err: any, stream: any) {
				if (err) {
					console.error(err);
					return done(err);
				}
				docker.modem.followProgress(stream, onFinished, onProgress);

				function onFinished(error: any, output: any) {
					if (error) {
						console.error(err);
						return done(error);
					}
					expect(output).to.be.a('array');
					done();
				}

				function onProgress(event: any) {
					expect(event).to.be.ok;
					console.debug(event);
				}
			});
		});
	});
});
