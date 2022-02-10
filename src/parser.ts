import { ParsedImageRequest, ParsedScopeRequest, ParsedRelease } from './types';

export const parseRelease: (slug: string) => ParsedRelease | undefined = (
	slug,
) => {
	const [org, name, version, service] = slug.split('/').filter(Boolean);
	return name != null
		? ({
				application: {
					org,
					name,
					slug: [org, name].filter(Boolean).join('/'),
				},
				version,
				service,
		  } as ParsedRelease)
		: undefined;
};

// image request MUST be in the format /version/repository/method/tag
export const parseImageReq: (slug: string) => ParsedImageRequest | undefined = (
	slug,
) => {
	const arr = slug.split('/').filter(Boolean);
	return arr.length > 3
		? ({
				version: arr.shift(),
				tag: arr.pop(),
				method: arr.pop(),
				name: arr.join('/'),
		  } as ParsedImageRequest)
		: undefined;
};

// scope request MUST be in the format type:name:action
// https://docs.docker.com/registry/spec/auth/token/
export const parseScopeReq: (slug: string) => ParsedScopeRequest | undefined = (
	slug,
) => {
	const [type, name, action] = slug.split(':').filter(Boolean);
	return action != null
		? ({
				type,
				name,
				action,
		  } as ParsedScopeRequest)
		: undefined;
};
