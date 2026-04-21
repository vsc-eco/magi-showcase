import { Hero } from '../sections/Hero';
import { Features } from '../sections/Features';
import { LiveWidget } from '../sections/LiveWidget';
import { Integrate } from '../sections/Integrate';
import { Footer } from '../sections/Footer';

export function Landing() {
	return (
		<main>
			<Hero />
			<Features />
			<LiveWidget />
			<Integrate />
			<Footer />
		</main>
	);
}
