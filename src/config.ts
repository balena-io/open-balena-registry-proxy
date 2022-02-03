import 'dotenv/config';

export const server = {
	port: parseInt(process.env.PROXY_PORT || '5000', 10),
	cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE || '600', 10),
};

export const registry = {
	url: process.env.REGISTRY_URL || 'https://registry2.balena-cloud.com',
};

export const api = {
	url: process.env.API_URL || 'https://api.balena-cloud.com',
	username: process.env.API_USER || undefined,
	token: process.env.API_TOKEN || undefined,
};

export const test = {
	repo: process.env.TEST_REPO || 'balenablocks/dashboard/0.0.0/dashboard',
};
