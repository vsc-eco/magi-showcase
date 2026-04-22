# Magi SDK — integration snippets

Four integration modes, each backed by a type-checked file in `src/snippets/`. The code blocks below are **generated** from those files by `pnpm sync-snippets`; don't edit them by hand. The prose between markers is maintained manually.

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
	import '@vsc.eco/crosschain-widget/webcomponent';
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
