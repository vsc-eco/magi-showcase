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
