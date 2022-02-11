module.exports = {
	bail: false,
	exit: false,
	recursive: false,
	require: [
        'ts-node/register/transpile-only',
    ],
	spec: ['tests/src/*.spec.ts'],
	timeout: '30000',
};