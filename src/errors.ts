import { RegistryError } from './types';

export const errors = {
	UNSUPPORTED: {
		code: 'UNSUPPORTED',
		message: 'The operation is unsupported.',
		detail: '',
	},
	UNAUTHORIZED: {
		code: 'UNAUTHORIZED',
		message: 'authentication required',
		detail: '',
	},
	NAME_UNKNOWN: {
		code: 'NAME_UNKNOWN',
		message: 'repository name not known to registry',
		detail: '',
	},
	DENIED: {
		code: 'DENIED',
		message: 'requested access to the resource is denied',
		detail: '',
	},
};

export const registryError: (error: any) => RegistryError = (error) => {
	return { errors: [error] } as RegistryError;
};
