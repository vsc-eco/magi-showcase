import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendOperations = vi.fn();
const fromString = vi.fn((wif: string) => ({ __mockKey: wif }));

vi.mock('@hiveio/dhive', () => ({
	Client: vi.fn().mockImplementation((rpc: string) => ({
		__rpc: rpc,
		broadcast: { sendOperations }
	})),
	PrivateKey: { fromString }
}));

// Import AFTER the mock is registered so the helper binds to the stubs.
const { makeDirectSigner } = await import('../src/directSigner');

describe('makeDirectSigner', () => {
	beforeEach(() => {
		sendOperations.mockReset();
		fromString.mockClear();
	});

	it('builds an onBroadcast callback that signs with the WIF and returns the txId', async () => {
		sendOperations.mockResolvedValueOnce({
			id: 'abc123deadbeef',
			block_num: 99000000,
			trx_num: 7
		});

		const onBroadcast = makeDirectSigner({
			username: 'tibfox',
			wif: '5JuserActiveKeyWIFNeverRealDontUse'
		});

		const ops = [
			['transfer', { from: 'tibfox', to: 'vsc.gateway', amount: '1.000 HBD', memo: 'to=tibfox' }],
			['custom_json', { required_auths: ['tibfox'], required_posting_auths: [], id: 'vsc.call', json: '{}' }]
		];

		const out = await onBroadcast(ops, 'Active');

		expect(out).toEqual({ txId: 'abc123deadbeef' });
		expect(fromString).toHaveBeenCalledWith('5JuserActiveKeyWIFNeverRealDontUse');
		expect(sendOperations).toHaveBeenCalledTimes(1);
		// dhive gets the ops untouched (the widget already tightened rc_limit).
		expect(sendOperations.mock.calls[0][0]).toBe(ops);
		// Second arg is the parsed key handle — whatever PrivateKey.fromString returned.
		expect(sendOperations.mock.calls[0][1]).toEqual({
			__mockKey: '5JuserActiveKeyWIFNeverRealDontUse'
		});
	});

	it('defaults to api.hive.blog but respects a custom rpc', async () => {
		const { Client } = await import('@hiveio/dhive');

		makeDirectSigner({ username: 'tibfox', wif: 'wif-a' });
		expect(Client).toHaveBeenLastCalledWith('https://api.hive.blog');

		makeDirectSigner({ username: 'tibfox', wif: 'wif-b', rpc: 'https://rpc.example.com' });
		expect(Client).toHaveBeenLastCalledWith('https://rpc.example.com');
	});

	it('invokes onResult with the full dhive result for telemetry', async () => {
		const result = { id: 'txid-xyz', block_num: 42, trx_num: 3 };
		sendOperations.mockResolvedValueOnce(result);
		const onResult = vi.fn();

		const onBroadcast = makeDirectSigner({
			username: 'tibfox',
			wif: 'wif',
			onResult
		});
		await onBroadcast([], 'Active');

		expect(onResult).toHaveBeenCalledWith(result);
	});

	it('throws a descriptive error when dhive returns no id', async () => {
		sendOperations.mockResolvedValueOnce({ block_num: 1, trx_num: 0 });
		const onBroadcast = makeDirectSigner({ username: 'tibfox', wif: 'wif' });

		await expect(onBroadcast([], 'Active')).rejects.toThrow(
			/dhive broadcast\.sendOperations for @tibfox returned no txId/
		);
	});

	it('propagates dhive broadcast errors so the widget surfaces them', async () => {
		sendOperations.mockRejectedValueOnce(new Error('missing active authority'));
		const onBroadcast = makeDirectSigner({ username: 'tibfox', wif: 'wif' });

		await expect(onBroadcast([], 'Active')).rejects.toThrow('missing active authority');
	});
});
