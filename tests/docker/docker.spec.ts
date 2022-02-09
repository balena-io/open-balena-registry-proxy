import * as Docker from 'dockerode';
import { expect } from 'chai';
import { app } from '../../src/app';
import * as config from '../../src/config';
import { parseRelease } from '../../src/parser';

const docker = new Docker();

const testRelease = parseRelease(config.test.repo);
const baseImage = `localhost:${config.server.port}/${testRelease?.application.slug}`;

const releases = Array.from(
	new Set([
		undefined,
		'latest',
		'current',
		'default',
		'pinned',
		testRelease?.version != null ? testRelease?.version : undefined,
	]),
);
const services = Array.from(
	new Set([
		undefined,
		testRelease?.service != null ? testRelease?.service : undefined,
	]),
);

const options = {
	...(config.api.username &&
		config.api.token && {
			authconfig: {
				username: config.api.username,
				password: config.api.token,
			},
		}),
};

describe('#image', () => {
	const server = app.listen(config.server.port);

	releases.forEach((release) => {
		services.forEach((service) => {
			const ref = [baseImage, release, release != null ? service : undefined]
				.filter(Boolean)
				.join('/');

			describe('#pull', function () {
				it(ref, function (done) {
					this.timeout(4000);

					// remove the image if it exists
					const image = docker.getImage(ref);
					image.remove({ force: true }, function (err, output) {
						if (err) {
							console.error(err);
						} else {
							console.log(output);
						}
					});

					docker.pull(ref, options, function (err: any, stream: any) {
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
	});

	after(function (done) {
		server.close(done);
	});
});
