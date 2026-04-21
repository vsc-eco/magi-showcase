import { Hero } from './sections/Hero';

export function App() {
	return (
		<main>
			<Hero />
			<section id="features"><h2>Features</h2></section>
			<section id="widget"><h2>Try it</h2></section>
			<section id="integrate"><h2>Integrate</h2></section>
			<section id="footer" />
		</main>
	);
}
