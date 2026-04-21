import { useEffect, useState } from 'react';
import { KeyTypes, Providers, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@magi/widget';
import { MAINNET_CONFIG } from '@magi/sdk';
import { createShowcaseAioha } from '../aioha';
import { ConnectBar } from './ConnectBar';

// Showcase-wide config: mainnet defaults plus a referral fee on
// outbound BTC swaps routed through the widget here.
const SHOWCASE_CONFIG = {
	...MAINNET_CONFIG,
	referral: {
		beneficiary: 'hive:altera.app',
		bps: 25
	}
};

export function LiveWidget() {
	const [aioha, setAioha] = useState<Aioha | null>(null);
	const [username, setUsername] = useState<string | undefined>(undefined);
	const [lastTx, setLastTx] = useState<string | null>(null);

	useEffect(() => {
		const instance = createShowcaseAioha();
		if (instance.loadAuth()) {
			setUsername(instance.getCurrentUser() ?? undefined);
		}
		setAioha(instance);
	}, []);

	async function connect() {
		if (!aioha) return;
		const providers = aioha.getProviders();
		const chosen =
			providers.find((p) => p === 'keychain') ??
			providers.find((p) => p === 'hiveauth') ??
			providers[0];
		if (!chosen) return;
		const user = window.prompt('Hive username:');
		if (!user) return;
		const res = await aioha.login(chosen as Providers, user, {
			msg: 'Sign in to Magi SDK showcase',
			keyType: KeyTypes.Posting
		});
		if (res.success) {
			setUsername(aioha.getCurrentUser() ?? user);
		} else {
			alert(`Login failed: ${res.error}`);
		}
	}

	async function disconnect() {
		if (!aioha) return;
		await aioha.logout();
		setUsername(undefined);
	}

	return (
		<section id="widget" className="live-widget">
			<h2>Try it</h2>
			<ConnectBar username={username} onConnect={connect} onDisconnect={disconnect} />
			{aioha && (
				<MagiQuickSwap
					aioha={aioha}
					username={username}
					keyType={KeyTypes.Active}
					config={SHOWCASE_CONFIG}
					onSuccess={(tx) => setLastTx(tx)}
				/>
			)}
			<p className="live-widget__notice">
				This widget operates on mainnet. Swaps are real transactions.
			</p>
			{lastTx && (
				<p className="live-widget__tx">
					Last tx:{' '}
					<a href={`https://vsc.techcoderx.com/tx/${lastTx}`} target="_blank" rel="noopener noreferrer">
						<code>{lastTx}</code>
					</a>
				</p>
			)}
		</section>
	);
}
