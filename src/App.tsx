import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { LiveWidget } from './sections/LiveWidget';

export function App() {
	return (
		<main>
			<Hero />
			<Features />
			<LiveWidget />
			<section id="integrate"><h2>Integrate</h2></section>
			<section id="footer" />
		</main>
	);
}
