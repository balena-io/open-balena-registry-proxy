import * as Docker from 'dockerode';
import { expect } from 'chai';
import { app } from '../../src/app';
import { config } from '../../src/config';

const docker = new Docker();
const baseRef = `localhost:${config.listenPort}/balenablocks/dashboard`;

const releases = [undefined, 'latest', 'current', 'default', 'pinned', '0.0.0'];
const services = [undefined, 'dashboard'];

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

					docker.pull(ref, function (err: any, stream: any) {
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
