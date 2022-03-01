import 'dotenv/config';

export const SECONDS = 1000;
export const SECONDS_PER_HOUR = 60 * 60;
export const MINUTES = 60 * SECONDS;
export const HOURS = 60 * MINUTES;
export const DAYS = 24 * HOURS;

export const requiredVar = (varName: string): string => {
	const s = process.env[varName];
	if (s == null) {
		process.exitCode = 1;
		throw new Error(`Missing environment variable: ${varName}`);
	}
	return s;
};

// https://github.com/balena-io/open-balena-api/blob/ce795224b69a8806d38b0368f47040cb355990a0/src/lib/config.ts#L58
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

// https://github.com/balena-io/open-balena-api/blob/ce795224b69a8806d38b0368f47040cb355990a0/src/lib/config.ts#L70
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

// https://github.com/balena-io/open-balena-api/blob/ce795224b69a8806d38b0368f47040cb355990a0/src/lib/config.ts#L88
export function boolVar(varName: string): boolean;
export function boolVar<R>(varName: string, defaultValue: R): boolean | R;
export function boolVar<R>(varName: string, defaultValue?: R): boolean | R {
	if (arguments.length === 1) {
		requiredVar(varName);
	}

	const s = process.env[varName];
	if (s == null) {
		return defaultValue!;
	}
	if (s === 'false') {
		return false;
	}
	if (s === 'true') {
		return true;
	}
	throw new Error(
		`Invalid value for boolean var '${varName}', got '${s}', expected 'true' or 'false'`,
	);
}

export const REGISTRY2_HOST = optionalVar(
	'REGISTRY2_HOST',
	'registry2.balena-cloud.com',
);

export const API_HOST = optionalVar('API_HOST', 'api.balena-cloud.com');

export const DNS_TLD = optionalVar('DNS_TLD');

export const PORT = intVar('PORT', 80);
export const RESOLVE_IMAGE_LOCATION_CACHE_TIMEOUT = intVar(
	'RESOLVE_IMAGE_LOCATION_CACHE_TIMEOUT',
	5 * MINUTES,
);

export const TEST_USER = optionalVar('TEST_USER');
export const TEST_TOKEN = optionalVar('TEST_TOKEN');
export const TEST_REPO = optionalVar(
	'TEST_REPO',
	'balenablocks/dashboard/0.0.0/dashboard',
);

export const REGISTRY_URL =
	'https://' + (DNS_TLD ? ['registry2', DNS_TLD].join('.') : REGISTRY2_HOST);
export const API_URL =
	'https://' + (DNS_TLD ? ['api', DNS_TLD].join('.') : API_HOST);

// https://github.com/balena-io/open-balena-api/blob/ce795224b69a8806d38b0368f47040cb355990a0/src/lib/config.ts#L279
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
