module.exports = {
	bail: true,
	exit: false,
	recursive: false,
	require: [
        'ts-node/register/transpile-only',
    ],
	spec: ['tests/docker/*.spec.ts'],
	timeout: '30000',
};