/**
 * Keychain-backed `onBroadcast` factory. Mirrors `makeDirectSigner` but
 * routes signing through the Hive Keychain browser extension
 * (`window.hive_keychain.requestBroadcast`) instead of `@hiveio/dhive`.
 *
 * The user confirms each swap in the Keychain popup; no private key
 * material ever touches the page. Suitable for any web app whose users
 * have the Keychain extension installed and who don't want an Aioha
 * runtime in the bundle.
 */

interface KeychainResponse {
	success: boolean;
	result?: { id: string };
	message?: string;
}
interface HiveKeychain {
	requestBroadcast(
		account: string,
		operations: unknown[],
		key: 'Active' | 'Posting',
		callback: (response: KeychainResponse) => void
	): void;
}
declare global {
	interface Window {
		hive_keychain?: HiveKeychain;
	}
}

export function isKeychainAvailable(): boolean {
	return typeof window !== 'undefined' && !!window.hive_keychain;
}

export interface KeychainSignerOptions {
	username: string;
	/** Which authority Keychain should request. Defaults to 'Active' since
	 *  transfer + custom_json signing for vsc swaps requires the active key. */
	key?: 'Active' | 'Posting';
}

export function makeKeychainSigner(opts: KeychainSignerOptions) {
	const { username, key = 'Active' } = opts;
	return function onBroadcast(
		ops: unknown[],
		_keyType: unknown
	): Promise<{ txId: string }> {
		return new Promise((resolve, reject) => {
			if (!window.hive_keychain) {
				reject(new Error('Hive Keychain extension not installed'));
				return;
			}
			window.hive_keychain.requestBroadcast(username, ops, key, (res) => {
				if (res.success && res.result?.id) {
					resolve({ txId: res.result.id });
				} else {
					reject(new Error(res.message ?? 'Keychain broadcast failed'));
				}
			});
		});
	};
}
