import { REGISTRY_URL, PROXY_PORT } from './config';
import app from './app';

const proxy = app(REGISTRY_URL);

proxy.listen(PROXY_PORT, () => {
	console.log(`Proxy listening on port ${PROXY_PORT}`);
});
