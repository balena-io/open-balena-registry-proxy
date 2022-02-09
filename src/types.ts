export type ResolvedImage = {
	registry: string;
	repo: string;
	digest: string;
};

export type ParsedRelease = {
	application: {
		slug: string;
		org: string;
		name: string;
	};
	version?: string;
	service?: string;
};

export type ParsedImageRequest = {
	version: string;
	name: string;
	method: string;
	tag: string;
};

export type ParsedScopeRequest = {
	type: string;
	name: string;
	action: string;
};
