import { Aioha } from '@aioha/aioha';

export function createShowcaseAioha(): Aioha {
	const instance = new Aioha();
	instance.registerKeychain();
	instance.registerHiveSigner({
		app: 'magi-sdk-showcase',
		callbackURL: typeof window !== 'undefined' ? window.location.origin : ''
	});
	instance.registerHiveAuth({ name: 'magi-sdk-showcase' });
	return instance;
}
