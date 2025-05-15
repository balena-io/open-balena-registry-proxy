import jsonwebtoken from 'jsonwebtoken';
import { randomUUID } from 'crypto';

interface Access {
	name: string;
	type: string;
	actions: string[];
	alias?: string;
}

// https://github.com/balena-io/open-balena-api/blob/50dd3715aee3e076f648f364de37578ebaa92233/src/features/registry/registry.ts#L549
export const generateToken = (access: Access[]): string => {
	const payload = {
		jti: randomUUID(),
		nbf: Math.floor(Date.now() / 1000) - 10,
		access,
	};
	return jsonwebtoken.sign(payload, 'shhhhh');
};
