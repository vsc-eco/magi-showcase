import { render, screen } from '@testing-library/react';
import { Hero } from '../../src/sections/Hero';

describe('Hero', () => {
	it('renders the tagline and a CTA linking to the widget section', () => {
		render(<Hero />);
		expect(screen.getByRole('heading', { name: /magi sdk/i })).toBeInTheDocument();
		expect(screen.getByText(/embeddable cross-chain swap widget/i)).toBeInTheDocument();
		const cta = screen.getByRole('link', { name: /try it/i });
		expect(cta).toHaveAttribute('href', '#widget');
	});
});
