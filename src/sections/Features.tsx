const FEATURES = [
	{
		title: '6 swap paths',
		body: 'HIVE, HBD, BTC — mainnet to mainnet. Magi L2 routes internally; users never see it.'
	},
	{
		title: '4 integration modes',
		body: 'React component, Web Component, SDK-only, or BTC deposit flow (no wallet needed).'
	},
	{
		title: 'Zero config',
		body: 'Neutral defaults, pool-derived USD prices, auto L1 balance queries, CSS-var theming.'
	}
];

export function Features() {
	return (
		<section id="features" className="features">
			<h2>Features</h2>
			<div className="features-grid">
				{FEATURES.map((f) => (
					<div key={f.title} className="feature-card">
						<h3>{f.title}</h3>
						<p>{f.body}</p>
					</div>
				))}
			</div>
		</section>
	);
}
