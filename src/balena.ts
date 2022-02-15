import { getSdk, Image } from 'balena-sdk';
import * as memoizee from 'memoizee';
import { API_URL, API_TOKEN, RESOLVE_IMAGE_ID_CACHE_TIMEOUT } from './config';
import { parseRelease } from './parser';
import { ResolvedImage } from './types';

const sdk = getSdk({
	apiUrl: API_URL,
});

export const lookupReleaseImage = memoizee(
	async (rel: string): Promise<ResolvedImage | undefined> => {
		try {
			const release = parseRelease(rel);

			if (!release) {
				return undefined;
			}

			if (API_TOKEN) {
				await sdk.auth.loginWithToken(API_TOKEN);
			}

			if (
				release.version == null ||
				[`latest`, `current`, `default`, `pinned`].includes(release.version)
			) {
				release.version = undefined;
			}

			const [image] = await sdk.pine.get<Image>({
				resource: 'image',
				options: {
					$top: 1,
					$select: ['is_stored_at__image_location', 'content_hash'],
					$filter: {
						release_image: {
							$any: {
								$alias: 'ri',
								$expr: {
									ri: {
										is_part_of__release: {
											$any: {
												$alias: 'ipor',
												$expr: {
													ipor: {
														status: 'success' as const,
														belongs_to__application: {
															$any: {
																$alias: 'bta',
																$expr: {
																	bta: {
																		slug: release.application.slug,
																	},
																},
															},
														},
														...(release.version == null && {
															should_be_running_on__application: {
																$any: {
																	$alias: 'sbroa',
																	$expr: {
																		sbroa: {
																			slug: release.application.slug,
																		},
																	},
																},
															},
														}),
													},
													...(release.version != null && {
														$or: [
															{ ipor: { commit: release.version } },
															{
																ipor: {
																	semver: release.version,
																	is_final: true,
																},
															},
															{
																ipor: {
																	raw_version: release.version,
																	is_final: false,
																},
															},
														],
													}),
												},
											},
										},
									},
								},
							},
						},
						status: 'success',
						...(release.service != null && {
							is_a_build_of__service: {
								$any: {
									$alias: 'iabos',
									$expr: {
										iabos: {
											service_name: release.service,
										},
									},
								},
							},
						}),
					},
					$orderby: [
						'release_image/is_part_of__release/revision desc',
						'id asc',
					],
				},
			});

			const location = image?.is_stored_at__image_location.split('/');

			return location.length > 1
				? ({
						registry: location.shift(),
						repo: location.join('/'),
						digest: image?.content_hash,
				  } as ResolvedImage)
				: undefined;
		} catch (err) {
			// console.error(err);
		}
	},
	{
		promise: true,
		primitive: true,
		maxAge: RESOLVE_IMAGE_ID_CACHE_TIMEOUT,
	},
);
