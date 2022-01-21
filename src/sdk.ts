import { getSdk } from "balena-sdk";

// Creates a new SDK instance using the default or the provided options
const balena = getSdk({
	apiUrl: process.env.BALENA_API_URL || "https://api.balena-cloud.com/",
});

export const getImageLocation = async (
	fleetSlug: string,
	serviceName: string,
	rawVersion: string
) => {
	const images = await balena.pine
		.get({
			resource: "image",
			options: {
				$select: [
					"is_stored_at__image_location",
					"status",
					"is_a_build_of__service",
				],
				$expand: {
					is_a_build_of__service: {},
				},
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
													raw_version: rawVersion,
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
												},
											},
										},
									},
								},
							},
						},
					},
					status: "success",
					is_a_build_of__service: {
						$any: {
							$alias: "iabos",
							$expr: {
								iabos: {
									service_name: serviceName,
								},
							},
						},
					},
				},
			},
		})
		.then((images) => {
			// console.debug(images);
			return images;
		})
		.catch((err) => {
			console.error(err);
			return undefined;
		});

	if (!images || images.length !== 1) {
		return undefined;
	}

	const location = images[0].is_stored_at__image_location;

	console.debug(`image location: ${location}`);

	return location;
};