import { intVar, optionalVar, trustProxyVar } from '@balena/env-parsing';

export const DNS_TLD = optionalVar('DNS_TLD');
export const REGISTRY2_HOST = optionalVar(
	'REGISTRY2_HOST',
	'registry2.balena-cloud.com',
);

export const REGISTRY_URL = optionalVar(
	'REGISTRY_URL',
	DNS_TLD != null
		? `https://registry2.${DNS_TLD}`
		: `https://${REGISTRY2_HOST}`,
);

export const PROXY_PORT = intVar('PROXY_PORT', 80);

export const TRUST_PROXY = trustProxyVar('TRUST_PROXY', false);
