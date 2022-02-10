import { expect } from 'chai';
import { parseRelease, parseImageReq, parseScopeReq } from '../../src/parser';
import * as config from '../../src/config';

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
		describe(`parseRelease: ${slug}`, function () {
			const release = parseRelease(slug);
			it('should return a parsed release object', function () {
				expect(release?.application.name).equals(testApp);
				expect(release?.application.org).equals(testOrg);
				expect(release?.application.slug).equals([testOrg, testApp].join('/'));
				expect(release?.version).equals(version);
				expect(release?.service).equals(service);
			});
		});
		repoSlugs.push(slug);
	});
});

const registryVersions = ['v2'];
const registryMethods = ['manifests', 'blobs'];
const registryTags = ['latest', 'foobar', '0.0.0'];

repoSlugs.forEach((slug) => {
	registryVersions.forEach((version) => {
		registryMethods.forEach((method) => {
			registryTags.forEach((tag) => {
				const req = ['', version, slug, method, tag].join('/');
				describe(`parseImageReq: ${req}`, function () {
					const imageReq = parseImageReq(req);
					it('should return a parsed image request object', function () {
						expect(imageReq?.version).equals(version);
						expect(imageReq?.name).equals(slug);
						expect(imageReq?.method).equals(method);
						expect(imageReq?.tag).equals(tag);
					});
				});
			});
		});
	});
});

const scopeTypes = ['repository', 'registry'];
const scopeActions = ['pull', 'push'];

repoSlugs.forEach((slug) => {
	scopeTypes.forEach((type) => {
		scopeActions.forEach((action) => {
			const req = [type, slug, action].join(':');
			describe(`parseScopeReq: ${req}`, function () {
				const scopeReq = parseScopeReq(req);
				it('should return a parsed scope request object', function () {
					expect(scopeReq?.type).equals(type);
					expect(scopeReq?.name).equals(slug);
					expect(scopeReq?.action).equals(action);
				});
			});
		});
	});
});
