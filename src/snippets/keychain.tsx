import { MagiQuickSwap } from '@vsc.eco/crosschain-widget';

// Minimal typing for the Keychain extension's globally-injected API.
// In a real app you'd usually pull this from @hiveio/keychain-sdk or
// declare it in a shared globals.d.ts.
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
	interface Window { hive_keychain?: HiveKeychain }
}

interface Props {
	username: string;
}

/**
 * MagiQuickSwap driven by the Hive Keychain browser extension — no
 * Aioha needed. Same integration path as the `@hiveio/dhive` direct
 * signer; only the callback body differs. The user approves the
 * transaction in the Keychain popup; the callback resolves once the
 * extension posts a tx id back.
 */
export function KeychainSigner({ username }: Props) {
	return (
		<MagiQuickSwap
			username={username}
			onBroadcast={(ops) =>
				new Promise((resolve, reject) => {
					if (!window.hive_keychain) {
						reject(new Error('Hive Keychain extension not installed'));
						return;
					}
					window.hive_keychain.requestBroadcast(
						username,
						ops as unknown[],
						'Active', // transfers require active authority
						(res) => {
							if (res.success && res.result?.id) {
								resolve({ txId: res.result.id });
							} else {
								reject(new Error(res.message ?? 'Keychain broadcast failed'));
							}
						}
					);
				})
			}
			onSuccess={(txId) => console.log('Swap broadcast:', txId)}
			onError={(err) => console.error('Swap failed:', err)}
		/>
	);
}
