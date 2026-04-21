import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

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

describe('App', () => {
	it('renders the Magi SDK heading', () => {
		render(<App />);
		expect(screen.getByRole('heading', { name: /magi sdk/i })).toBeInTheDocument();
	});
});
