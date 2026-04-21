import { render, screen, fireEvent } from '@testing-library/react';
import { Integrate } from '../../src/sections/Integrate';

describe('Integrate', () => {
	it('renders all four tabs and switches to Web Component on click', () => {
		render(<Integrate />);
		expect(screen.getByRole('tab', { name: /react/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /web component/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /sdk-only/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /btc deposit/i })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: /web component/i }));
		// Shiki wraps each token in spans; check the whole rendered text.
		expect(document.body.textContent?.toLowerCase()).toContain('magi-quickswap');
	});

	it('copies snippet source to clipboard when Copy is clicked', async () => {
		const writeText = vi.fn();
		Object.assign(navigator, { clipboard: { writeText } });
		render(<Integrate />);
		fireEvent.click(screen.getByRole('button', { name: /copy/i }));
		expect(writeText).toHaveBeenCalledWith(expect.stringContaining('MagiQuickSwap'));
	});
});
