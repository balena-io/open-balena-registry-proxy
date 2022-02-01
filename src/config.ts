import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
	path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`) || undefined,
});

export const config = {
	listenPort: parseInt(process.env.PORT || '5000', 10),
	registryUrl:
		process.env.REGISTRY_HOST || 'https://registry2.balena-cloud.com',
	apiUrl: process.env.API_URL || 'https://api.balena-cloud.com',
	cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || '600', 10),
};

export const auth = {
	apiUsername: process.env.API_USER || undefined,
	apiToken: process.env.API_TOKEN || undefined,
};

export const test = {
	repository: process.env.TEST_REPO || 'balenablocks/dashboard/0.0.0/dashboard',
};
