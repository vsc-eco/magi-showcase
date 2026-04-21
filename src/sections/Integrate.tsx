import { useState } from 'react';
import react from '../snippets/react-basic.tsx?highlight';
import webcomp from '../snippets/webcomponent.html?highlight';
import sdk from '../snippets/sdk-only.ts?highlight';
import btc from '../snippets/btc-deposit.ts?highlight';

interface Tab {
	id: string;
	label: string;
	blurb: string;
	snippet: { source: string; html: string };
}

const TABS: Tab[] = [
	{
		id: 'react',
		label: 'React',
		blurb: 'Drop <MagiQuickSwap> into any React + Aioha app. Use when you already have a React tree and an Aioha instance.',
		snippet: react
	},
	{
		id: 'webcomp',
		label: 'Web Component',
		blurb: 'Plain HTML / Vue / Svelte — no React needed in your app. The widget is a custom element. Object props must be set as JS properties, not HTML attributes.',
		snippet: webcomp
	},
	{
		id: 'sdk',
		label: 'SDK-only',
		blurb: 'Build ops with your own UI and signer. The SDK returns a pair of Hive ops; you broadcast them via whatever signer your app already uses.',
		snippet: sdk
	},
	{
		id: 'btc',
		label: 'BTC deposit',
		blurb: 'BTC → HIVE or HBD without any wallet connection. Show the user a generated deposit address; the mapping bot delivers the output to the Hive account you name.',
		snippet: btc
	}
];

export function Integrate() {
	const [active, setActive] = useState(TABS[0].id);
	const tab = TABS.find((t) => t.id === active) ?? TABS[0];

	async function copy() {
		await navigator.clipboard.writeText(tab.snippet.source);
	}

	return (
		<section id="integrate" className="integrate">
			<h2>Integrate</h2>
			<div role="tablist" className="integrate-tabs">
				{TABS.map((t) => (
					<button
						key={t.id}
						role="tab"
						aria-selected={t.id === active}
						className={t.id === active ? 'integrate-tab active' : 'integrate-tab'}
						onClick={() => setActive(t.id)}
					>
						{t.label}
					</button>
				))}
			</div>
			<p className="integrate-blurb">{tab.blurb}</p>
			<div className="integrate-snippet">
				<button className="integrate-copy" onClick={copy}>Copy</button>
				<div dangerouslySetInnerHTML={{ __html: tab.snippet.html }} />
			</div>
		</section>
	);
}
