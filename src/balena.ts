import { getSdk } from "balena-sdk";

const balena = getSdk({
	apiUrl: process.env.BALENA_API_URL || "https://api.balena-cloud.com/",
});

export const getImageLocation = async (repository: string, tag: string) => {
	const fleet = repository.split("/").slice(0, 2).join("/");
	const service = repository.split("/")[2] || "main";
	const version = tag === "latest" ? await getTargetRelease(repository) || tag : tag
	console.debug(`fleet: ${fleet}, service: ${service}, version: ${version}`)
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
													raw_version: version,
													belongs_to__application: {
														$any: {
															$alias: "bta",
															$expr: {
																bta: {
																	slug: fleet,
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
									service_name: service,
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

	return images[0].is_stored_at__image_location;
};

export const getTargetRelease = async (repository: string) => {
	const fleet = repository.split("/").slice(0, 2).join("/");
	const applications = await balena.pine
		.get({
			resource: "application",
			options: {
				$select: "id",
				$expand: { should_be_running__release: { $select: "raw_version" } },
				$filter: {
					slug: fleet,
				},
			},
		})
		.then((applications) => {
			// console.debug(applications);
			return applications;
		})
		.catch((err) => {
			console.error(err);
			return undefined;
		});

	if (!applications || applications.length !== 1) {
		return undefined;
	}

	return applications[0].should_be_running__release[0]?.raw_version;
};
