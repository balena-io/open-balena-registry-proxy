import { Image } from 'balena-sdk';

export interface ExtendedImage extends Partial<Image> {
	// path is the repository location without the registry host prefix
	path: string;
}

export interface ImageLocation {
	repository: string;
	digest: string;
}

export interface ReleaseRef {
	application: {
		slug: string;
		org: string;
		name: string;
	};
	version?: string;
	service?: string;
}

// image request MUST be in the format /version/repository/method/tag
export interface ImageRequest {
	version: string;
	tag: string;
	method: string;
	repository: string;
	release: ReleaseRef | undefined;
}

// scope request MUST be in the format type:name:action
// https://docs.docker.com/registry/spec/auth/token/
export interface ScopeRequest {
	type: string;
	name: string;
	action: string;
	release: ReleaseRef | undefined;
}

export const parseReleaseRef: (slug: string) => ReleaseRef | undefined = (
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
		  } as ReleaseRef)
		: undefined;
};

export const parseImageRequest: (slug: string) => ImageRequest | undefined = (
	slug,
) => {
	const arr = slug.split('/').filter(Boolean);
	return arr.length > 3
		? ({
				version: arr.shift(),
				tag: arr.pop(),
				method: arr.pop(),
				repository: arr.join('/'),
				release: parseReleaseRef(arr.join('/')) as ReleaseRef,
		  } as ImageRequest)
		: undefined;
};

export const parseScopeRequest: (slug: string) => ScopeRequest | undefined = (
	slug,
) => {
	const [type, name, action] = slug.split(':').filter(Boolean);
	return action != null
		? ({
				type,
				name,
				action,
				release: parseReleaseRef(name) as ReleaseRef,
		  } as ScopeRequest)
		: undefined;
};
