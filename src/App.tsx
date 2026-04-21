import { Hero } from './sections/Hero';
import { Features } from './sections/Features';

export function App() {
	return (
		<main>
			<Hero />
			<Features />
			<section id="widget"><h2>Try it</h2></section>
			<section id="integrate"><h2>Integrate</h2></section>
			<section id="footer" />
		</main>
	);
}
