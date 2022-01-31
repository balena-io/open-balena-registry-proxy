import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
	path: path.resolve(__dirname, `${process.env.NODE_ENV}.env`) || undefined,
});

export const config = {
	listenPort: parseInt(process.env.PORT || '5000', 10),
	registryHost: process.env.REGISTRY_HOST || 'registry2.balena-cloud.com',
	authHost: process.env.AUTH_HOST || 'api.balena-cloud.com',
	useHttps: process.env.HTTPS || true,
};
