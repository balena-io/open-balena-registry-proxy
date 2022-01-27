import { getSdk } from "balena-sdk";
import * as memoizee from "memoizee";

const sdk = getSdk({
	apiUrl: process.env.BALENA_API_URL || "https://api.balena-cloud.com/",
});

export const getImageLocation = memoizee(async (repository: string) => {
	try {
		const repoRef = repository.split("/");
		const org = repoRef.shift();
		const fleet = repoRef.shift();
		const release = repoRef.shift() || undefined;
		const service = repoRef.shift() || undefined;

		if (!org || !fleet) {
			return undefined;
		}

		const fleetSlug = [org, fleet].join('/');

		console.debug(`fleetSlug: ${fleetSlug}, service: ${service}, release: ${release}`);

		const [image] = await sdk.pine
			.get({
				resource: "image",
				options: {
					$top: 1,
					$select: "is_stored_at__image_location",
					$filter: {
						release_image: {
							$any: {
								$alias: "ri",
								$expr: {
									ri: {
										is_part_of__release: {
											$any: {
												$alias: "ipor",
												$expr: {
													ipor: {
														status: "success" as const,
														belongs_to__application: {
															$any: {
																$alias: "bta",
																$expr: {
																	bta: {
																		slug: fleetSlug,
																	},
																},
															},
														},
														...(release == null ? {
															should_be_running_on__application: {
																$any: {
																	$alias: 'sbroa',
																	$expr: {
																		sbroa: {
																			slug: fleetSlug,
																		}
																	},
																}
															}
														}: { commit: release,})
													},
												},
											},
										},
									},
								},
							},
						},
						status: "success",
						...( service != null && { is_a_build_of__service: {
							$any: {
								$alias: "iabos",
								$expr: {
									iabos: {
										service_name: service,
									},
								},
							},
						}}),
					},
					$orderby: { id: 'asc' },
				},
			});

		return image?.is_stored_at__image_location;
	} catch (err) {
		console.error(err);
	}
}, {
	promise: true,
	primitive: true,
	maxAge: 10 * 60 * 1000
});
