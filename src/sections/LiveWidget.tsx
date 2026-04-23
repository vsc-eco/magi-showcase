import { useEffect, useMemo, useState } from 'react';
import { KeyTypes, Providers, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@vsc.eco/crosschain-widget';
import { createShowcaseAioha } from '../aioha';
import type { makeDirectSigner as MakeDirectSigner } from '../directSigner';
import { isKeychainAvailable, makeKeychainSigner } from '../keychainSigner';
import { ConnectBar } from './ConnectBar';

type SignerMode = 'aioha' | 'keychain' | 'direct';

export function LiveWidget() {
	const [mode, setMode] = useState<SignerMode>('aioha');
	const [aioha, setAioha] = useState<Aioha | null>(null);
	const [username, setUsername] = useState<string | undefined>(undefined);
	const [lastTx, setLastTx] = useState<string | null>(null);

	const [keychainUsername, setKeychainUsername] = useState('');
	const [keychainInstalled, setKeychainInstalled] = useState(() => isKeychainAvailable());

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

	// Poll once for late-loading Keychain so the warning clears without a
	// reload if the extension injects after the React mount ticks.
	useEffect(() => {
		if (keychainInstalled) return;
		const t = setTimeout(() => setKeychainInstalled(isKeychainAvailable()), 300);
		return () => clearTimeout(t);
	}, [keychainInstalled]);

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
		const user = window.prompt('Hive username:');
		if (!user) return;
		const res = await aioha.login(Providers.Keychain, user, {
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

	// Direct-signer onBroadcast: build once per (username, wif) pair.
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

	// Keychain-backed onBroadcast: rebuilt whenever the username changes.
	const keychainSigner = useMemo(() => {
		const user = keychainUsername.trim();
		if (!user) return null;
		return makeKeychainSigner({ username: user });
	}, [keychainUsername]);

	const isAioha = mode === 'aioha';
	const isKeychain = mode === 'keychain';
	const isDirect = mode === 'direct';

	return (
		<section id="widget" className="live-widget">
			<h2>Try it</h2>
			<div role="tablist" className="live-widget__signer-tabs integrate-tabs">
				<button
					role="tab"
					aria-selected={isAioha}
					className={isAioha ? 'integrate-tab active' : 'integrate-tab'}
					onClick={() => setMode('aioha')}
				>
					Aioha
				</button>
				<button
					role="tab"
					aria-selected={isKeychain}
					className={isKeychain ? 'integrate-tab active' : 'integrate-tab'}
					onClick={() => setMode('keychain')}
				>
					Keychain (onBroadcast)
				</button>
				<button
					role="tab"
					aria-selected={isDirect}
					className={isDirect ? 'integrate-tab active' : 'integrate-tab'}
					onClick={() => setMode('direct')}
				>
					Direct signer (WIF)
				</button>
			</div>
			{isAioha && (
				<>
					<p className="live-widget__provider-note">
						For simplicity we use Keychain as a fixed provider via Aioha.
					</p>
					<ConnectBar username={username} onConnect={connect} onDisconnect={disconnect} />
				</>
			)}
			{isKeychain && (
				<div className="live-widget__direct">
					<div className="live-widget__direct-warning">
						<strong>No Aioha, no WIF.</strong> Swaps go through the Hive
						Keychain browser extension via <code>onBroadcast</code>. You'll
						confirm each transaction in the Keychain popup.
					</div>
					{!keychainInstalled && (
						<p className="live-widget__direct-error">
							Keychain extension not detected.{' '}
							<a href="https://hive-keychain.com/" target="_blank" rel="noopener noreferrer">
								Install it
							</a>{' '}
							and reload.
						</p>
					)}
					<label className="live-widget__direct-label">
						<span>Hive username</span>
						<input
							type="text"
							value={keychainUsername}
							onChange={(e) => setKeychainUsername(e.target.value)}
							placeholder="e.g. bob"
							autoComplete="off"
							spellCheck={false}
						/>
					</label>
				</div>
			)}
			{isDirect && (
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
							placeholder="e.g. bob"
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
			)}
			{isAioha && aioha && (
				<MagiQuickSwap
					aioha={aioha}
					username={username}
					keyType={KeyTypes.Active}
					onSuccess={(tx) => setLastTx(tx)}
				/>
			)}
			{isKeychain && (
				keychainSigner && keychainInstalled ? (
					<MagiQuickSwap
						username={keychainUsername.trim() || undefined}
						keyType={KeyTypes.Active}
						onBroadcast={keychainSigner}
						onSuccess={(tx) => setLastTx(tx)}
					/>
				) : (
					<p className="live-widget__notice">
						Enter your Hive username to enable the swap.
					</p>
				)
			)}
			{isDirect && (
				directSigner ? (
					<MagiQuickSwap
						username={directUsername.trim() || undefined}
						keyType={KeyTypes.Active}
						onBroadcast={directSigner}
						onSuccess={(tx) => setLastTx(tx)}
					/>
				) : (
					<p className="live-widget__notice">
						Enter your Hive username and active WIF to enable the swap.
					</p>
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
