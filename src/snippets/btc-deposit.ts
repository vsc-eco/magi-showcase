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
