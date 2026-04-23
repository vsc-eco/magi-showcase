# Magi SDK — integration snippets

Six integration modes, each backed by a type-checked file in `src/snippets/`. The code blocks below are **generated** from those files by `pnpm sync-snippets`; don't edit them by hand. The prose between markers is maintained manually.

## React

Drop `<MagiQuickSwap>` into any React + Aioha app. Use this when you already have a React tree and an Aioha instance the user has logged into.

<!-- snippet:react-basic.tsx -->
```tsx
import { KeyTypes, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@vsc.eco/crosschain-widget';

interface Props {
	aioha: Aioha;
	username: string;
}

export function ReactBasic({ aioha, username }: Props) {
	return (
		<MagiQuickSwap
			aioha={aioha}
			username={username}
			keyType={KeyTypes.Active}
			defaultAssetIn="HBD"
			defaultAssetOut="BTC"
			onSuccess={(txId) => console.log('Swap broadcast:', txId)}
			onError={(err) => console.error('Swap failed:', err)}
		/>
	);
}
```
<!-- /snippet:react-basic.tsx -->

## Web Component

For apps that aren't in React — plain HTML, Vue, Svelte, etc. The widget registers `<magi-quickswap>` as a custom element. **Object props (`aioha`, `onSuccess`) must be set as JS properties, not HTML attributes** — attributes can only carry strings.

<!-- snippet:webcomponent.html -->
```html
<!-- Drop into any HTML page — no framework required beyond the import. -->
<script type="module">
	import '@magi/widget/webcomponent';
</script>

<magi-quickswap id="swap"></magi-quickswap>

<script>
	// Object props MUST be set as JS properties, not HTML attributes —
	// the widget expects live Aioha / function references, which can't
	// round-trip through attributes.
	const el = document.getElementById('swap');
	el.aioha = yourAiohaInstance;
	el.username = 'lordbutterfly';
	el.keyType = 'active';
	el.onSuccess = (txId) => console.log('Swap broadcast:', txId);
</script>
```
<!-- /snippet:webcomponent.html -->

## SDK-only

When you want the swap math and Hive op shapes but your app already owns a signer (e.g. a Keychain browser extension building its own transaction UI). Returns a pair of ops you broadcast yourself.

<!-- snippet:sdk-only.ts -->
```ts
import { CoinAmount, createMagi } from '@vsc.eco/crosschain-sdk';

// Bring-your-own signer. The SDK builds the ops; you broadcast them
// via whatever signing path your app already owns.
export async function buildSwap(username: string) {
	const magi = createMagi();
	const { ops, preview } = await magi.buildQuickSwap({
		username,
		assetIn: 'HBD',
		amountIn: CoinAmount.fromDecimal('10', 'HBD'),
		assetOut: 'BTC',
		recipient: 'bc1q5hnuykyu0ejkwktheh5mq2v9dp2y3674ep0kss',
		slippageBps: 100
	});
	// ops: [transferOp, customJsonOp] — broadcast with your own signer.
	return { ops, preview };
}
```
<!-- /snippet:sdk-only.ts -->

## BTC deposit

The user sends BTC from any Bitcoin wallet; the mapping bot watches the deposit and delivers HIVE or HBD to the Hive account you name. No wallet connection required.

<!-- snippet:btc-deposit.ts -->
```ts
import { createMagi } from '@vsc.eco/crosschain-sdk';

// BTC → HIVE/HBD: no Hive wallet connection needed. The user sends
// BTC from any wallet; the mapping bot watches and delivers the
// destination asset to the Hive account you specify.
export async function getDepositAddress(recipient: string) {
	const magi = createMagi();
	const { address } = await magi.getBtcDepositAddress({
		recipient, // Hive username that receives HIVE/HBD
		assetOut: 'HIVE',
		destinationChain: 'HIVE'
	});
	return address; // bc1q... — show this to the user
}
```
<!-- /snippet:btc-deposit.ts -->

## Direct signer

Skip Aioha entirely: the widget's `onBroadcast` prop takes precedence over `aioha`, letting you plug in any signer — here `@hiveio/dhive` with a raw active WIF. The widget still builds the ops, simulates, and tightens `rc_limit`; your callback only signs and broadcasts. Useful for PeakD / Keychain-only apps and for CLI or backend automation. **Never** feed a user-typed private key into a browser widget — load keys from env / secret store in a trusted context only.

<!-- snippet:direct-signer.tsx -->
```tsx
import { MagiQuickSwap } from '@vsc.eco/crosschain-widget';
import { Client, PrivateKey, type Operation } from '@hiveio/dhive';

interface Props {
	username: string;
	/** Active-authority WIF. Never hard-code this; load from env / secret store. */
	activeWif: string;
}

/**
 * Drop-in MagiQuickSwap integration that bypasses Aioha entirely and signs
 * ops with a private key via @hiveio/dhive. Suitable for non-Aioha hosts
 * (PeakD, Keychain-only apps) or CLI / backend integrations.
 */
export function DirectSigner({ username, activeWif }: Props) {
	const client = new Client('https://api.hive.blog');
	const key = PrivateKey.fromString(activeWif);

	return (
		<MagiQuickSwap
			username={username}
			// onBroadcast takes precedence over `aioha` — the widget still
			// handles build + simulate + rc_limit tightening and then hands
			// the finalized ops to your signer.
			onBroadcast={async (ops) => {
				const result = await client.broadcast.sendOperations(
					ops as Operation[],
					key
				);
				return { txId: result.id };
			}}
			onSuccess={(txId) => console.log('Swap broadcast:', txId)}
			onError={(err) => console.error('Swap failed:', err)}
		/>
	);
}
```
<!-- /snippet:direct-signer.tsx -->

## Keychain

Same `onBroadcast` hook, but signing runs through the Hive Keychain browser extension — no Aioha, no private keys in the page. The user approves the swap in Keychain's popup; the callback resolves once the extension returns a tx id. The only difference from the dhive snippet above is the body of the `onBroadcast` callback.

<!-- snippet:keychain.tsx -->
```tsx
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
```
<!-- /snippet:keychain.tsx -->
