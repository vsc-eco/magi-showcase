import { execSync } from 'node:child_process';

describe('sync-snippets --check', () => {
	it('confirms SNIPPETS.md matches src/snippets/', () => {
		expect(() =>
			execSync('pnpm sync-snippets --check', { stdio: 'pipe' })
		).not.toThrow();
	});
});
