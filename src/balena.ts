import { getSdk, Image } from 'balena-sdk';
import * as memoizee from 'memoizee';
import { config, auth } from './config';
import { Repository } from './parse';

const sdk = getSdk({
	apiUrl: auth.apiUrl,
});

export const getImageLocation = memoizee(
	async (repoRef: Repository) => {
		try {
			if (auth.apiToken) {
				await sdk.auth.loginWithToken(auth.apiToken);
			}

			if (!repoRef?.fleet) {
				return undefined;
			}

			if (
				repoRef.release == null ||
				[`latest`, `current`, `default`, `pinned`].includes(repoRef.release)
			) {
				repoRef.release = undefined;
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
																		slug: repoRef.fleet,
																	},
																},
															},
														},
														...(repoRef.release == null && {
															should_be_running_on__application: {
																$any: {
																	$alias: 'sbroa',
																	$expr: {
																		sbroa: {
																			slug: repoRef.fleet,
																		},
																	},
																},
															},
														}),
													},
													...(repoRef.release != null && {
														$or: [
															{ ipor: { commit: repoRef.release } },
															{
																ipor: {
																	semver: repoRef.release,
																	is_final: true,
																},
															},
															{
																ipor: {
																	raw_version: repoRef.release,
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
						...(repoRef.service != null && {
							is_a_build_of__service: {
								$any: {
									$alias: 'iabos',
									$expr: {
										iabos: {
											service_name: repoRef.service,
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

			// TODO: do we need to return 'is_stored_at__image_location@content_hash' ?
			// eg. https://github.com/balena-os/balena-yocto-scripts/blob/master/automation/include/balena-api.inc#L755
			return image?.is_stored_at__image_location;
		} catch (err) {
			console.error(err);
		}
	},
	{
		promise: true,
		primitive: true,
		maxAge: config.cacheMaxAge * 1000,
	},
);
