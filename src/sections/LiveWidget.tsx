import { useEffect, useMemo, useState } from 'react';
import { KeyTypes, Providers, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@vsc.eco/crosschain-widget';
import { QRCodeSVG } from 'qrcode.react';
import { createShowcaseAioha } from '../aioha';
import type { makeDirectSigner as MakeDirectSigner } from '../directSigner';
import { isKeychainAvailable, makeKeychainSigner } from '../keychainSigner';
import { ConnectBar } from './ConnectBar';

type SignerMode = 'aioha' | 'keychain' | 'direct';
type AiohaProvider = 'keychain' | 'hiveauth';

const PROVIDER_LABELS: Record<AiohaProvider, string> = {
	keychain: 'Keychain',
	hiveauth: 'HiveAuth'
};

export function LiveWidget() {
	const [mode, setMode] = useState<SignerMode>('aioha');
	const [aioha, setAioha] = useState<Aioha | null>(null);
	const [username, setUsername] = useState<string | undefined>(undefined);
	const [lastTx, setLastTx] = useState<string | null>(null);
	const [aiohaProvider, setAiohaProvider] = useState<AiohaProvider>('keychain');
	const [availableProviders, setAvailableProviders] = useState<AiohaProvider[]>([]);

	const [keychainUsername, setKeychainUsername] = useState('');
	const [keychainInstalled, setKeychainInstalled] = useState(() => isKeychainAvailable());

	const [hiveAuthPrompt, setHiveAuthPrompt] = useState<{ url: string; cancel: () => void } | null>(null);
	const [hiveAuthCopied, setHiveAuthCopied] = useState(false);

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
		// Clamp the provider dropdown to what Aioha actually registered.
		const provs = (instance.getProviders() as string[]).filter(
			(p): p is AiohaProvider => p === 'keychain' || p === 'hiveauth'
		);
		setAvailableProviders(provs);
		if (provs.length && !provs.includes('keychain')) {
			setAiohaProvider(provs[0]);
		}
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
		// For HiveAuth, capture the `has://auth_req/...` URL the provider
		// hands us via cbWait and surface it in a modal so the user can
		// tap (mobile) or copy (desktop) it to approve the auth request.
		const hiveauthOpts =
			aiohaProvider === 'hiveauth'
				? {
						hiveauth: {
							cbWait: (url: string, _evt: unknown, cancel: () => void) => {
								setHiveAuthCopied(false);
								setHiveAuthPrompt({ url, cancel });
							}
						}
					}
				: undefined;
		try {
			const res = await aioha.login(aiohaProvider as Providers, user, {
				msg: 'Sign in to Magi SDK showcase',
				keyType: KeyTypes.Posting,
				...hiveauthOpts
			});
			if (res.success) {
				setUsername(aioha.getCurrentUser() ?? user);
			} else {
				alert(`Login failed: ${res.error}`);
			}
		} finally {
			// Always clear — the prompt is scoped to this single login attempt.
			setHiveAuthPrompt(null);
		}
	}

	async function copyHiveAuthUrl() {
		if (!hiveAuthPrompt) return;
		try {
			await navigator.clipboard.writeText(hiveAuthPrompt.url);
			setHiveAuthCopied(true);
			setTimeout(() => setHiveAuthCopied(false), 1500);
		} catch {
			// Clipboard permission denied — user can still tap/long-press.
		}
	}

	function cancelHiveAuth() {
		if (!hiveAuthPrompt) return;
		hiveAuthPrompt.cancel();
		setHiveAuthPrompt(null);
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
					{availableProviders.length > 1 && (
						<label className="live-widget__provider-select">
							<span>Provider</span>
							<select
								value={aiohaProvider}
								onChange={(e) => setAiohaProvider(e.target.value as AiohaProvider)}
							>
								{availableProviders.map((p) => (
									<option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
								))}
							</select>
						</label>
					)}
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
			{hiveAuthPrompt && (
				<div
					className="hiveauth-modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="hiveauth-modal-title"
					onClick={cancelHiveAuth}
				>
					<div className="hiveauth-modal__card" onClick={(e) => e.stopPropagation()}>
						<h3 id="hiveauth-modal-title" className="hiveauth-modal__title">
							HiveAuth authentication
						</h3>
						<p className="hiveauth-modal__body">
							Scan the QR code with your HiveAuth-compatible mobile wallet
							(Hive Keychain mobile, HiveAuth, etc.). On mobile, tap the link
							below to open the wallet directly.
						</p>
						<div className="hiveauth-modal__qr" aria-hidden="true">
							<QRCodeSVG value={hiveAuthPrompt.url} size={220} marginSize={2} />
						</div>
						<a
							className="hiveauth-modal__link"
							href={hiveAuthPrompt.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							{hiveAuthPrompt.url}
						</a>
						<div className="hiveauth-modal__actions">
							<button type="button" onClick={copyHiveAuthUrl}>
								{hiveAuthCopied ? 'Copied!' : 'Copy link'}
							</button>
							<button type="button" onClick={cancelHiveAuth}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
