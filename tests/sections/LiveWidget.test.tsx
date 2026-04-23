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
const { aiohaLogin, aiohaLogout, keychainFactory } = vi.hoisted(() => ({
	aiohaLogin: vi.fn().mockResolvedValue({ success: true }),
	aiohaLogout: vi.fn().mockResolvedValue(undefined),
	keychainFactory: vi.fn((opts: { username: string }) =>
		async () => ({ txId: `keychain-${opts.username}` })
	)
}));

// Aioha mock — exposes a provider list so the provider picker renders.
// login() is spied so we can assert it receives the provider the UI picks.
vi.mock('@aioha/aioha', () => {
	const instance = {
		registerKeychain() {},
		registerHiveAuth() {},
		loadAuth() { return false; },
		getCurrentUser() { return 'bob'; },
		getProviders() { return ['keychain', 'hiveauth']; },
		isLoggedIn() { return false; },
		login: aiohaLogin,
		logout: aiohaLogout,
		on() {},
		off() {}
	};
	return {
		Aioha: class { constructor() { return instance; } },
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
	aiohaLogin.mockClear();
	keychainFactory.mockClear();
	globalThis.fetch = vi.fn(async () =>
		new Response(
			JSON.stringify({ data: { dex_pool_registry: [], dex_pool_liquidity: [] } }),
			{ status: 200 }
		)
	) as typeof fetch;
});

describe('LiveWidget', () => {
	it('defaults to Aioha mode, shows a provider picker, and renders the connect bar', async () => {
		render(<LiveWidget />);
		expect(screen.getByRole('tab', { name: /^aioha$/i })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
		// Provider picker appears once the effect reports >1 registered providers.
		const select = await screen.findByLabelText(/provider/i);
		expect(select).toBeInTheDocument();
		const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
		expect(options).toEqual(['Keychain', 'HiveAuth']);
	});

	it('forwards the selected Aioha provider to aioha.login()', async () => {
		render(<LiveWidget />);
		const select = await screen.findByLabelText(/provider/i);
		fireEvent.change(select, { target: { value: 'hiveauth' } });
		vi.spyOn(window, 'prompt').mockReturnValue('bob');
		fireEvent.click(screen.getByRole('button', { name: /connect/i }));
		// login is async; flush microtasks.
		await Promise.resolve();
		expect(aiohaLogin).toHaveBeenCalledTimes(1);
		expect(aiohaLogin.mock.calls[0][0]).toBe('hiveauth');
	});

	it('opens a HiveAuth URL popup when aioha invokes cbWait', async () => {
		// Real aioha traps HiveAuth cancel/failure internally and resolves
		// login() with { success: false } — mirror that so no promise leaks.
		let resolveLogin!: (value: { success: boolean; error?: string }) => void;
		aiohaLogin.mockImplementationOnce((_provider, _user, opts) => {
			setTimeout(() => {
				opts.hiveauth?.cbWait('has://auth_req/abc123', {}, () => {
					resolveLogin({ success: false, error: 'cancelled' });
				});
			}, 0);
			return new Promise((resolve) => {
				resolveLogin = resolve;
			});
		});
		// alert() isn't implemented in jsdom; no-op it for the failure branch.
		vi.spyOn(window, 'alert').mockImplementation(() => {});

		render(<LiveWidget />);
		const select = await screen.findByLabelText(/provider/i);
		fireEvent.change(select, { target: { value: 'hiveauth' } });
		vi.spyOn(window, 'prompt').mockReturnValue('bob');
		fireEvent.click(screen.getByRole('button', { name: /connect/i }));

		const modal = await screen.findByRole('dialog');
		expect(modal).toBeInTheDocument();
		const link = screen.getByRole('link', { name: /has:\/\/auth_req\/abc123/i });
		expect(link.getAttribute('href')).toBe('has://auth_req/abc123');

		// Cancel closes the modal and triggers the aioha cancel callback,
		// which resolves login with {success:false}. Wait for the resulting
		// finally block to clear the prompt state.
		fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
		await screen.findByRole('tab', { name: /^aioha$/i }); // settle microtasks
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
