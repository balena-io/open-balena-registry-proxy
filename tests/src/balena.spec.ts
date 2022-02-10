import { expect } from 'chai';
import * as config from '../../src/config';
import { lookupReleaseImage } from '../../src/balena';

const [testOrg, testApp, testVersion, testService] = config.test.repo
	.split('/')
	.filter(Boolean);

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

repoSlugs.forEach((slug) => {
	describe(`lookupReleaseImage ${slug}`, function () {
		it('should return a resolved image path', async function () {
			const image = await lookupReleaseImage(slug);
			console.debug(image);
			expect(image?.registry).equals(new URL(config.registry.url).hostname);
			expect(image?.repo).to.match(/v2\/[a-f0-9]+/);
			expect(image?.digest).to.match(/sha256:[a-f0-9]+/);
		});
	});
});
