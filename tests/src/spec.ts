import * as Docker from 'dockerode';
import { expect } from 'chai';
import { app } from '../../src/app';
import { config, auth, test } from '../../src/config';
import { repoRefParser } from '../../src/parse';

const docker = new Docker();

const repo = repoRefParser(test.repository);
const baseRef = `localhost:${config.listenPort}/${repo?.fleet}`;

const releases = Array.from(
	new Set([
		undefined,
		'latest',
		'current',
		'default',
		'pinned',
		repo?.release != null ? repo?.release : undefined,
	]),
);
const services = Array.from(
	new Set([undefined, repo?.service != null ? repo?.service : undefined]),
);

const options = {
	...(auth.apiUsername &&
		auth.apiToken && {
			authconfig: {
				username: auth.apiUsername,
				password: auth.apiToken,
			},
		}),
};

describe('#image', () => {
	const server = app.listen(config.listenPort);

	releases.forEach((release) => {
		services.forEach((service) => {
			const ref = [baseRef, release, release != null ? service : undefined]
				.filter(Boolean)
				.join('/');

			describe('#pull', function () {
				it(ref, function (done) {
					this.timeout(4000);

					// remove the image if it exists
					// const image = docker.getImage(ref);
					// image.remove({ force: true }, function (_err, output) {
					// 	console.log(output);
					// });

					docker.pull(ref, options, function (err: any, stream: any) {
						if (err) {
							return done(err);
						}
						docker.modem.followProgress(stream, onFinished, onProgress);

						function onFinished(error: any, output: any) {
							if (error) {
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
	});

	after(function (done) {
		server.close(done);
	});
});
