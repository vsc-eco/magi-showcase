import { render, screen } from '@testing-library/react';
import { Footer } from '../../src/sections/Footer';

describe('Footer', () => {
	it('links to altera-app source and the SDK README', () => {
		render(<Footer />);
		const links = screen.getAllByRole('link');
		const hrefs = links.map((a) => a.getAttribute('href'));
		expect(hrefs.some((h) => h?.includes('vsc-eco/altera-app'))).toBe(true);
		expect(hrefs.some((h) => h?.includes('feature/magi-sdk'))).toBe(true);
	});
});
