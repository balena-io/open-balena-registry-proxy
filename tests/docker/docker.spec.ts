import * as Docker from 'dockerode';
import { expect } from 'chai';
import { app } from '../../src/app';
import { TEST_REPO, TEST_USER, TEST_TOKEN } from '../../src/config';

const options = {
	...(TEST_USER &&
		TEST_TOKEN && {
			authconfig: {
				username: TEST_USER,
				password: TEST_TOKEN,
			},
		}),
};

const PORT = 5000;

const docker = new Docker();

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

let server: any;

before(function (done) {
	server = app.listen(PORT, () => {
		console.log(`Server started on port ${PORT}`);
		done();
	});
});

repoSlugs.forEach((slug) => {
	const path = [`localhost:${PORT}`, slug].join('/');

	describe(`docker pull ${path}`, function () {
		it('should pull the specified manifest via the proxy', function (done) {
			this.timeout(4000);

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

after(function (done) {
	server.close(done);

	repoSlugs.forEach((slug) => {
		const path = [`localhost:${PORT}`, slug].join('/');
		const image = docker.getImage(path);

		// remove the image if it exists
		image.remove({ force: true }, function (err, output) {
			if (err) {
				console.error(err);
			} else {
				console.log(output);
			}
		});
	});
});
