import { Aioha } from '@aioha/aioha';

// Intentionally only Keychain + HiveAuth. HiveSigner requires an OAuth
// app registration + callback URL wiring that isn't set up for the
// showcase; re-enable once that infra lands.
export function createShowcaseAioha(): Aioha {
	const instance = new Aioha();
	instance.registerKeychain();
	instance.registerHiveAuth({ name: 'magi-sdk-showcase' });
	return instance;
}
