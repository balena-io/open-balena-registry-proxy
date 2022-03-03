// https://docs.docker.com/registry/spec/api/#errors
function registryError(code: string, message: string, detail: string = '') {
	return { errors: [{ code, message, detail }] };
}

export const ERROR_UNSUPPORTED = registryError(
	'UNSUPPORTED',
	'The operation is unsupported.',
);

export const ERROR_UNAUTHORIZED = registryError(
	'UNAUTHORIZED',
	'authentication required',
);

export const ERROR_NAME_UNKNOWN = registryError(
	'NAME_UNKNOWN',
	'repository name not known to registry',
);

export const ERROR_DENIED = registryError(
	'DENIED',
	'requested access to the resource is denied',
);
