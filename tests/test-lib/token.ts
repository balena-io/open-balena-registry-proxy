import * as jsonwebtoken from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface Access {
	name: string;
	type: string;
	actions: string[];
	alias?: string;
}

// https://github.com/balena-io/open-balena-api/blob/50dd3715aee3e076f648f364de37578ebaa92233/src/features/registry/registry.ts#L549
export const generateToken = (
	subject: string = '',
	audience: string = '',
	access: Access[],
): string => {
	const payload = {
		jti: randomUUID(),
		nbf: Math.floor(Date.now() / 1000) - 10,
		access,
	};
	// const options = {
	// 	algorithm: CERT.algo,
	// 	issuer: CERT.issuer,
	// 	audience,
	// 	subject,
	// 	expiresIn: 60 * TOKEN_EXPIRY_MINUTES,
	// 	keyid: CERT.kid,
	// };
	// return jsonwebtoken.sign(payload, CERT.key, options);
	return jsonwebtoken.sign(payload, 'shhhhh');
};
