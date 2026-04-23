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

// vi.mock hoists to the top of the module; any spies the factories close
// over must be declared via vi.hoisted so the bindings exist when the
// mock factories run.
const { keychainFactory } = vi.hoisted(() => ({
	keychainFactory: vi.fn((opts: { username: string }) =>
		async () => ({ txId: `keychain-${opts.username}` })
	)
}));

// Showcase pins Aioha to Keychain only; the mock mirrors that surface.
vi.mock('@aioha/aioha', () => {
	const instance = {
		registerKeychain() {},
		loadAuth() { return false; },
		getCurrentUser() { return null; },
		getProviders() { return ['keychain']; },
		isLoggedIn() { return false; },
		login: vi.fn().mockResolvedValue({ success: true }),
		logout: vi.fn().mockResolvedValue(undefined),
		on() {},
		off() {}
	};
	return {
		Aioha: class { constructor() { return instance; } },
		Providers: { Keychain: 'keychain' },
		KeyTypes: { Active: 'active', Posting: 'posting' }
	};
});

// Direct signer factory — fake async import + throw on an obviously-bad WIF.
vi.mock('../../src/directSigner', () => ({
	makeDirectSigner: vi.fn((opts: { username: string; wif: string }) => {
		if (opts.wif === 'bad-key') throw new Error('invalid checksum');
		return async () => ({ txId: `fake-${opts.username}` });
	})
}));

// Keychain helper mock — keep it in lockstep with the real factory so the
// widget gets a function back when the username is set.
vi.mock('../../src/keychainSigner', () => ({
	isKeychainAvailable: () => true,
	makeKeychainSigner: keychainFactory
}));

beforeEach(() => {
	widgetPropsLog.length = 0;
	keychainFactory.mockClear();
	globalThis.fetch = vi.fn(async () =>
		new Response(
			JSON.stringify({ data: { dex_pool_registry: [], dex_pool_liquidity: [] } }),
			{ status: 200 }
		)
	) as typeof fetch;
});

describe('LiveWidget', () => {
	it('defaults to Aioha mode with Keychain pinned and renders the connect bar', () => {
		render(<LiveWidget />);
		expect(screen.getByRole('tab', { name: /^aioha$/i })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
		expect(screen.getByText(/for simplicity we use keychain as a fixed provider via aioha/i)).toBeInTheDocument();
		// No provider picker: we've intentionally pinned to Keychain.
		expect(screen.queryByLabelText(/provider/i)).not.toBeInTheDocument();
	});

	it('switches to Keychain mode and mounts the widget with onBroadcast once a username is set', async () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /keychain \(onbroadcast\)/i }));
		expect(screen.getByText(/no aioha, no wif\./i)).toBeInTheDocument();
		// Nothing rendered until username is typed.
		expect(screen.queryByTestId('magi-quick-swap')).not.toBeInTheDocument();
		fireEvent.change(screen.getByLabelText(/hive username/i), { target: { value: 'bob' } });
		expect(screen.getByTestId('magi-quick-swap')).toBeInTheDocument();
		const last = widgetPropsLog.at(-1)!;
		expect(last.username).toBe('bob');
		expect(last.aioha).toBeUndefined();
		expect(typeof last.onBroadcast).toBe('function');
		expect(keychainFactory).toHaveBeenCalledWith({ username: 'bob' });
	});

	it('switches to direct-signer mode and hides the widget until both fields are filled', () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /direct signer/i }));
		expect(screen.getByText(/testing only\./i)).toBeInTheDocument();
		expect(screen.queryByTestId('magi-quick-swap')).not.toBeInTheDocument();
		expect(screen.getByText(/enter your hive username and active wif/i)).toBeInTheDocument();
	});

	it('mounts the widget with onBroadcast (not aioha) once both direct-signer fields are set', async () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /direct signer/i }));
		fireEvent.change(screen.getByLabelText(/hive username/i), { target: { value: 'bob' } });
		fireEvent.change(screen.getByLabelText(/active wif/i), { target: { value: '5Ktestkey' } });
		expect(await screen.findByTestId('magi-quick-swap')).toBeInTheDocument();
		const last = widgetPropsLog.at(-1)!;
		expect(last.username).toBe('bob');
		expect(last.aioha).toBeUndefined();
		expect(typeof last.onBroadcast).toBe('function');
	});

	it('surfaces invalid-WIF errors from makeDirectSigner without crashing', async () => {
		render(<LiveWidget />);
		fireEvent.click(screen.getByRole('tab', { name: /direct signer/i }));
		fireEvent.change(screen.getByLabelText(/hive username/i), { target: { value: 'bob' } });
		fireEvent.change(screen.getByLabelText(/active wif/i), { target: { value: 'bad-key' } });
		expect(await screen.findByText(/key invalid: invalid checksum/i)).toBeInTheDocument();
		expect(screen.queryByTestId('magi-quick-swap')).not.toBeInTheDocument();
	});
});
