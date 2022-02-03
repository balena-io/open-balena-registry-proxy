import { getSdk, Image } from 'balena-sdk';
import * as memoizee from 'memoizee';
import * as config from './config';
import { ReleaseRef, ExtendedImage } from './parse';

const sdk = getSdk({
	apiUrl: config.api.url,
});

export const lookupReleaseImage = memoizee(
	async (release: ReleaseRef): Promise<ExtendedImage | undefined> => {
		try {
			if (config.api.token) {
				await sdk.auth.loginWithToken(config.api.token);
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
																		slug: release.fleet.slug,
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
																			slug: release.fleet.slug,
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

			return {
				...image,
				// path is the repository location without the registry host prefix
				path: image?.is_stored_at__image_location.split('/').slice(1).join('/'),
			} as ExtendedImage;
		} catch (err) {
			console.error(err);
		}
	},
	{
		promise: true,
		primitive: true,
		maxAge: config.server.cacheMaxAge * 1000,
	},
);
