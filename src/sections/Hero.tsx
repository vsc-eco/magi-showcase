export function Hero() {
	return (
		<section id="hero" className="hero">
			<div className="hero-title">
				<img src="/magi.svg" alt="" className="hero-logo" />
				<h1>Magi SDK</h1>
			</div>
			<p className="hero-tagline">
				Embeddable cross-chain swap widget for HIVE, HBD, and BTC — drop into Keychain,
				Peakd, Ecency, or any Hive-connected app.
			</p>
			<p className="hero-ctas">
				<a className="hero-cta" href="#widget">Try it ↓</a>
				<a className="hero-cta hero-cta--secondary" href="#/docs">Read the docs</a>
			</p>
		</section>
	);
}
