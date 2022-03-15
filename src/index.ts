import { REGISTRY_URL, PROXY_PORT, TRUST_PROXY } from './config';
import app from './app';

const proxy = app(REGISTRY_URL, TRUST_PROXY);

proxy.listen(PROXY_PORT, () => {
	console.log(`Proxy listening on port ${PROXY_PORT}`);
});
