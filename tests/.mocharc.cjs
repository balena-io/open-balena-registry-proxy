module.exports = {
	bail: false,
	exit: false,
	recursive: false,
	loader: "ts-node/esm/transpile-only",
	spec: ['tests/src/*.spec.ts'],
	timeout: '30000',
};
