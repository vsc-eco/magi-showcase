import { useEffect, useMemo, useState } from 'react';
import { KeyTypes, Providers, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@vsc.eco/crosschain-widget';
import { createShowcaseAioha } from '../aioha';
import type { makeDirectSigner as MakeDirectSigner } from '../directSigner';
import { ConnectBar } from './ConnectBar';

type SignerMode = 'aioha' | 'direct';

export function LiveWidget() {
	const [mode, setMode] = useState<SignerMode>('aioha');
	const [aioha, setAioha] = useState<Aioha | null>(null);
	const [username, setUsername] = useState<string | undefined>(undefined);
	const [lastTx, setLastTx] = useState<string | null>(null);

	const [directUsername, setDirectUsername] = useState('');
	const [directWif, setDirectWif] = useState('');
	const [directWifError, setDirectWifError] = useState<string | null>(null);
	const [makeDirectSigner, setMakeDirectSigner] = useState<typeof MakeDirectSigner | null>(null);

	useEffect(() => {
		const instance = createShowcaseAioha();
		if (instance.loadAuth()) {
			setUsername(instance.getCurrentUser() ?? undefined);
		}
		setAioha(instance);
	}, []);

	// Lazy-load the dhive-backed signer factory only when the user actually
	// switches to direct mode. @hiveio/dhive pulls in secp256k1 + crypto and
	// roughly triples the landing-page bundle; deferring it keeps the Aioha
	// path (which the vast majority of visitors hit) lean.
	useEffect(() => {
		if (mode === 'direct' && !makeDirectSigner) {
			import('../directSigner').then((m) => setMakeDirectSigner(() => m.makeDirectSigner));
		}
	}, [mode, makeDirectSigner]);

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

	// Build the onBroadcast callback once per (username, wif) pair. Parsing
	// the WIF throws for malformed keys, so catch eagerly and surface the
	// message in the UI instead of crashing the whole section. Waits for
	// the lazy-loaded factory the first time the user lands on this mode.
	const directSigner = useMemo(() => {
		const user = directUsername.trim();
		const wif = directWif.trim();
		if (!user || !wif || !makeDirectSigner) return null;
		try {
			const fn = makeDirectSigner({ username: user, wif });
			setDirectWifError(null);
			return fn;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			setDirectWifError(msg);
			return null;
		}
	}, [directUsername, directWif, makeDirectSigner]);

	const isDirect = mode === 'direct';
	const directReady = !!directSigner;
	const directUser = directUsername.trim() || undefined;

	return (
		<section id="widget" className="live-widget">
			<h2>Try it</h2>
			<div role="tablist" className="live-widget__signer-tabs integrate-tabs">
				<button
					role="tab"
					aria-selected={mode === 'aioha'}
					className={mode === 'aioha' ? 'integrate-tab active' : 'integrate-tab'}
					onClick={() => setMode('aioha')}
				>
					Aioha
				</button>
				<button
					role="tab"
					aria-selected={mode === 'direct'}
					className={mode === 'direct' ? 'integrate-tab active' : 'integrate-tab'}
					onClick={() => setMode('direct')}
				>
					Direct signer (WIF)
				</button>
			</div>
			{isDirect ? (
				<div className="live-widget__direct">
					<div className="live-widget__direct-warning">
						<strong>Testing only.</strong> Your private key stays in this tab's
						memory and is passed directly to <code>@hiveio/dhive</code> for
						signing. Never paste an active key here for a real-life account
						unless you understand the trust model — close the tab when done.
					</div>
					<label className="live-widget__direct-label">
						<span>Hive username</span>
						<input
							type="text"
							value={directUsername}
							onChange={(e) => setDirectUsername(e.target.value)}
							placeholder="e.g. tibfox"
							autoComplete="off"
							spellCheck={false}
						/>
					</label>
					<label className="live-widget__direct-label">
						<span>Active WIF</span>
						<input
							type="password"
							value={directWif}
							onChange={(e) => setDirectWif(e.target.value)}
							placeholder="5K…"
							autoComplete="off"
							spellCheck={false}
						/>
					</label>
					{directWifError && (
						<p className="live-widget__direct-error">Key invalid: {directWifError}</p>
					)}
				</div>
			) : (
				<ConnectBar username={username} onConnect={connect} onDisconnect={disconnect} />
			)}
			{isDirect ? (
				directReady ? (
					<MagiQuickSwap
						username={directUser}
						keyType={KeyTypes.Active}
						onBroadcast={directSigner!}
						onSuccess={(tx) => setLastTx(tx)}
					/>
				) : (
					<p className="live-widget__notice">
						Enter your Hive username and active WIF to enable the swap.
					</p>
				)
			) : (
				aioha && (
					<MagiQuickSwap
						aioha={aioha}
						username={username}
						keyType={KeyTypes.Active}
						onSuccess={(tx) => setLastTx(tx)}
					/>
				)
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
