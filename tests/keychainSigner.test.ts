import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { makeKeychainSigner, isKeychainAvailable } from '../src/keychainSigner';

describe('keychainSigner', () => {
	const requestBroadcast = vi.fn();
	const origKeychain = window.hive_keychain;

	beforeEach(() => {
		requestBroadcast.mockReset();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).hive_keychain = { requestBroadcast };
	});
	afterEach(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).hive_keychain = origKeychain;
	});

	it('isKeychainAvailable reflects the global presence', () => {
		expect(isKeychainAvailable()).toBe(true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).hive_keychain = undefined;
		expect(isKeychainAvailable()).toBe(false);
	});

	it('resolves with { txId } when Keychain returns a successful broadcast', async () => {
		requestBroadcast.mockImplementation((_user, _ops, _key, cb) => {
			cb({ success: true, result: { id: 'abc123' } });
		});
		const onBroadcast = makeKeychainSigner({ username: 'bob' });
		await expect(onBroadcast([['transfer', {}]], 'Active')).resolves.toEqual({
			txId: 'abc123'
		});

		const [user, ops, key] = requestBroadcast.mock.calls[0];
		expect(user).toBe('bob');
		expect(ops).toEqual([['transfer', {}]]);
		expect(key).toBe('Active');
	});

	it('forwards a custom `key` authority argument', async () => {
		requestBroadcast.mockImplementation((_user, _ops, _key, cb) => {
			cb({ success: true, result: { id: 'x' } });
		});
		const onBroadcast = makeKeychainSigner({ username: 'bob', key: 'Posting' });
		await onBroadcast([], 'Posting');
		expect(requestBroadcast.mock.calls[0][2]).toBe('Posting');
	});

	it('rejects with a descriptive error when the extension is missing', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).hive_keychain = undefined;
		const onBroadcast = makeKeychainSigner({ username: 'bob' });
		await expect(onBroadcast([], 'Active')).rejects.toThrow(/not installed/i);
	});

	it('rejects with the Keychain message when the user declines or broadcast fails', async () => {
		requestBroadcast.mockImplementation((_user, _ops, _key, cb) => {
			cb({ success: false, message: 'User declined the transaction' });
		});
		const onBroadcast = makeKeychainSigner({ username: 'bob' });
		await expect(onBroadcast([], 'Active')).rejects.toThrow(
			/User declined the transaction/
		);
	});

	it('falls back to a generic error when Keychain returns success:false with no message', async () => {
		requestBroadcast.mockImplementation((_user, _ops, _key, cb) => {
			cb({ success: false });
		});
		const onBroadcast = makeKeychainSigner({ username: 'bob' });
		await expect(onBroadcast([], 'Active')).rejects.toThrow(/Keychain broadcast failed/);
	});
});
