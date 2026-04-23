import { render, screen, fireEvent } from '@testing-library/react';
import { LiveWidget } from '../../src/sections/LiveWidget';

// Capture the props the widget receives so we can assert on them across modes.
const widgetPropsLog: Array<Record<string, unknown>> = [];

vi.mock('@vsc.eco/crosschain-widget', () => ({
	MagiQuickSwap: (props: Record<string, unknown>) => {
		widgetPropsLog.push(props);
		return <div data-testid="magi-quick-swap" />;
	}
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

// Stable directSigner mock — a synchronous stand-in for the dhive-backed factory.
// Returning the input lets us assert the factory was called with the form values.
vi.mock('../../src/directSigner', () => ({
	makeDirectSigner: vi.fn((opts: { username: string; wif: string }) => {
		if (opts.wif === 'bad-key') throw new Error('invalid checksum');
		return async () => ({ txId: `fake-${opts.username}` });
	})
}));

beforeEach(() => {
	widgetPropsLog.length = 0;
	globalThis.fetch = vi.fn(async () =>
		new Response(
			JSON.stringify({ data: { dex_pool_registry: [], dex_pool_liquidity: [] } }),
			{ status: 200 }
		)
	) as typeof fetch;
});

describe('LiveWidget', () => {
	it('defaults to Aioha mode and shows the connect bar', () => {
		render(<LiveWidget />);
		expect(screen.getByRole('tab', { name: /^aioha$/i })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
		expect(screen.getByText(/mainnet\. swaps are real/i)).toBeInTheDocument();
	});

	it('switches to direct-signer mode and hides the widget until both fields are filled', () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /direct signer/i }));
		expect(screen.getByText(/testing only\./i)).toBeInTheDocument();
		expect(screen.getByLabelText(/hive username/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/active wif/i)).toBeInTheDocument();
		// Nothing filled → widget not mounted, explanatory notice shown instead.
		expect(screen.queryByTestId('magi-quick-swap')).not.toBeInTheDocument();
		expect(screen.getByText(/enter your hive username and active wif/i)).toBeInTheDocument();
	});

	it('mounts the widget with onBroadcast (not aioha) once both direct-signer fields are set', async () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /direct signer/i }));
		fireEvent.change(screen.getByLabelText(/hive username/i), { target: { value: 'tibfox' } });
		fireEvent.change(screen.getByLabelText(/active wif/i), { target: { value: '5Ktestkey' } });
		// The signer factory is dynamically imported — await its async resolve.
		expect(await screen.findByTestId('magi-quick-swap')).toBeInTheDocument();
		const last = widgetPropsLog.at(-1)!;
		expect(last.username).toBe('tibfox');
		expect(last.aioha).toBeUndefined();
		expect(typeof last.onBroadcast).toBe('function');
	});

	it('surfaces invalid-WIF errors from makeDirectSigner without crashing', async () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /direct signer/i }));
		fireEvent.change(screen.getByLabelText(/hive username/i), { target: { value: 'tibfox' } });
		fireEvent.change(screen.getByLabelText(/active wif/i), { target: { value: 'bad-key' } });
		// Dynamic factory load + re-render before the try/catch fires.
		expect(await screen.findByText(/key invalid: invalid checksum/i)).toBeInTheDocument();
		expect(screen.queryByTestId('magi-quick-swap')).not.toBeInTheDocument();
	});
});
