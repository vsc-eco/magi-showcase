import { render, screen } from '@testing-library/react';
import { LiveWidget } from '../../src/sections/LiveWidget';

vi.mock('@magi/widget', () => ({
	MagiQuickSwap: () => <div data-testid="magi-quick-swap" />
}));

vi.mock('@aioha/aioha', () => ({
	Aioha: class {
		registerKeychain() {}
		registerHiveSigner() {}
		registerHiveAuth() {}
		loadAuth() { return false; }
		getCurrentUser() { return null; }
		getProviders() { return []; }
		isLoggedIn() { return false; }
		logout() {}
		on() {}
		off() {}
	},
	KeyTypes: { Active: 'active', Posting: 'posting' }
}));

beforeEach(() => {
	globalThis.fetch = vi.fn(async () =>
		new Response(
			JSON.stringify({
				data: {
					dex_pool_registry: [],
					dex_pool_liquidity: []
				}
			}),
			{ status: 200 }
		)
	) as typeof fetch;
});

describe('LiveWidget', () => {
	it('renders the connect bar and a mainnet notice', () => {
		render(<LiveWidget />);
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
		expect(screen.getByText(/mainnet\. swaps are real/i)).toBeInTheDocument();
	});
});
