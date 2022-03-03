export const requiredVar = (varName: string): string => {
	const s = process.env[varName];
	if (s == null) {
		process.exitCode = 1;
		throw new Error(`Missing environment variable: ${varName}`);
	}
	return s;
};

export function optionalVar(varName: string, defaultValue: string): string;
export function optionalVar(
	varName: string,
	defaultValue?: string,
): string | undefined;
export function optionalVar(
	varName: string,
	defaultValue?: string,
): string | undefined {
	return process.env[varName] || defaultValue;
}

export function intVar(varName: string): number;
export function intVar<R>(varName: string, defaultValue: R): number | R;
export function intVar<R>(varName: string, defaultValue?: R): number | R {
	if (arguments.length === 1) {
		requiredVar(varName);
	}

	const s = process.env[varName];
	if (s == null) {
		return defaultValue!;
	}
	const i = parseInt(s, 10);
	if (!Number.isFinite(i)) {
		throw new Error(`${varName} must be a valid number if set`);
	}
	return i;
}

export const DNS_TLD = optionalVar('DNS_TLD');
export const REGISTRY2_HOST = optionalVar(
	'REGISTRY2_HOST',
	'registry2.balena-cloud.com',
);

export const REGISTRY_URL =
	DNS_TLD != null
		? `https://registry2.${DNS_TLD}`
		: `https://${REGISTRY2_HOST}`;

export const PORT = intVar('PORT', 80);

const { TRUST_PROXY: trustProxy = 'true' } = process.env;
let trustProxyValue;
if (trustProxy === 'true') {
	// If it's 'true' enable it
	trustProxyValue = true;
} else if (trustProxy.includes('.') || trustProxy.includes(':')) {
	// If it looks like an ip use as-is
	trustProxyValue = trustProxy;
} else {
	const trustProxyNum = parseInt(trustProxy, 10);
	if (Number.isFinite(trustProxyNum)) {
		// If it's a number use the number
		trustProxyValue = trustProxyNum;
	} else {
		throw new Error(`Invalid value for 'TRUST_PROXY' of '${trustProxy}'`);
	}
}
export const TRUST_PROXY = trustProxyValue;
