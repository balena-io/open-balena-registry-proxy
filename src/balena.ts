import { getSdk } from "balena-sdk";

const balena = getSdk({
	apiUrl: process.env.BALENA_API_URL || "https://api.balena-cloud.com/",
});

export const getImageLocation = async (repository: string) => {
	
	const repoRef = repository.split("/");
	const org = repoRef.shift();
	const fleet = repoRef.shift();
	const service = repoRef.shift() || "main";
	let release = repoRef.shift() || undefined;

	if (!org || !fleet) {
		return undefined;
	}

	const fleetSlug = [org, fleet].join('/');

	if (!release || ["latest", "current"].includes(release)) {
		release = await getTargetRelease(repository)
	}

	if (!release) {
		return undefined;
	}

	// console.debug(`fleetSlug: ${fleetSlug}, service: ${service}, release: ${release}`);

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
					is_a_build_of__service: {}
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
													commit: release,
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

	const repoRef = repository.split("/");
	const org = repoRef.shift();
	const fleet = repoRef.shift();

	if (!org || !fleet) {
		return undefined;
	}

	const fleetSlug = [org, fleet].join('/');

	const applications = await balena.pine
		.get({
			resource: "application",
			options: {
				$select: "id",
				$expand: { should_be_running__release: { $select: "commit" } },
				$filter: {
					slug: fleetSlug,
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

	return applications[0].should_be_running__release[0]?.commit;
};
