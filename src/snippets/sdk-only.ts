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
