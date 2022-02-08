module.exports = {
    bail: true,
	exit: true,
	recursive: true,
    require: [
        'ts-node/register/transpile-only',
    ],
    spec: ['tests/src/*.spec.ts'],
    timeout: '30000',
};