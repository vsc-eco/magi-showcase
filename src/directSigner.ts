import { Client, PrivateKey, type Operation } from '@hiveio/dhive';

/**
 * Build an `onBroadcast` callback that signs and broadcasts Hive ops directly
 * with a WIF private key via `@hiveio/dhive`. Useful for:
 *
 *  - Non-Aioha hosts (PeakD, Keychain-only apps) that already have their own
 *    signing pipeline but want a worked example of the `onBroadcast` hook.
 *  - Backend or automation scripts that hold an active key in config/secret
 *    and drive `MagiQuickSwap` (or any other SDK op) headlessly.
 *  - Integration tests where an Aioha browser flow isn't available.
 *
 * SECURITY: the returned signer holds the key in memory until garbage
 * collected. Do NOT embed a user-typed private key in a shipped widget —
 * this helper is intended for server-side, CLI, or test contexts where the
 * key is already present in a trusted environment.
 */
export interface DirectSignerOptions {
	username: string;
	/** Active-authority WIF for `username`. */
	wif: string;
	/** Hive RPC endpoint. Defaults to api.hive.blog. */
	rpc?: string;
	/** Optional hook called with the raw dhive result for logging / telemetry. */
	onResult?: (result: { id: string; block_num: number; trx_num: number }) => void;
}

export function makeDirectSigner(opts: DirectSignerOptions) {
	const { username, wif, rpc = 'https://api.hive.blog', onResult } = opts;
	const client = new Client(rpc);
	const key = PrivateKey.fromString(wif);

	return async function onBroadcast(
		ops: unknown[],
		_keyType: unknown
	): Promise<{ txId: string }> {
		// dhive's broadcast.sendOperations takes `Operation[]` — the widget
		// already hands us the fully-tightened op array in the exact shape
		// (e.g. `['transfer', {...}]`, `['custom_json', {...}]`) that dhive
		// expects, so we pass through untouched.
		const result = await client.broadcast.sendOperations(ops as Operation[], key);
		onResult?.(result);
		if (typeof result.id !== 'string') {
			throw new Error(
				`dhive broadcast.sendOperations for @${username} returned no txId`
			);
		}
		return { txId: result.id };
	};
}
