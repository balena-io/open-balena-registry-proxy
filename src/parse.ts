// repo ref should be in the format org/fleet/release?/service?
export type Repository = {
	slug: string;
	fleet: string;
	release?: string;
	service?: string;
};

// image ref should be in the format /version/repository/method/tag
export type ImageRequest = {
	version: string;
	tag?: string;
	method?: string;
	repository?: Repository;
};

// scope ref should be in the format type:name:action
// https://docs.docker.com/registry/spec/auth/token/
export type ScopeRequest = {
	type: string;
	name: string;
	action: string;
};

export const imageRefParser: (slug: string) => ImageRequest | undefined = (
	slug,
) => {
	const arr = slug.split('/').filter(Boolean);
	const version = arr.shift();
	return version != null
		? {
				version,
				tag: arr.pop(),
				method: arr.pop(),
				repository: repoRefParser(arr.join('/')),
		  }
		: undefined;
};

export const repoRefParser: (slug: string) => Repository | undefined = (
	slug,
) => {
	const [org, fleet, release, service] = slug.split('/');
	return org && fleet != null
		? {
				slug,
				fleet: [org, fleet].join('/'),
				release,
				service,
		  }
		: undefined;
};

export const scopeRefParser: (slug: string) => ScopeRequest | undefined = (
	slug,
) => {
	const [type, name, action] = slug.split(':');
	return type && name && action != null
		? {
				type,
				name,
				action,
		  }
		: undefined;
};
