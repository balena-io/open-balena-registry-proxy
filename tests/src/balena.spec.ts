import { expect } from 'chai';
import { REGISTRY_URL, TEST_REPO, TEST_TOKEN } from '../../src/config';
import { resolveImageLocation } from '../../src/balena';

const [testOrg, testApp, testVersion, testService] =
	TEST_REPO.split('/').filter(Boolean);

const credentials = 'Bearer ' + TEST_TOKEN;

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
	describe(`resolveImageLocation ${slug}`, function () {
		it('should return a resolved image path', async function () {
			const image = await resolveImageLocation(slug, credentials);
			console.debug(image);
			expect(image?.registry).equals(new URL(REGISTRY_URL).hostname);
			expect(image?.repo).to.match(/v2\/[a-f0-9]+/);
			expect(image?.digest).to.match(/sha256:[a-f0-9]+/);
		});
	});
});
