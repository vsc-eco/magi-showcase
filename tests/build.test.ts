import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const DIST = resolve(REPO_ROOT, 'dist');

describe('pnpm build', () => {
	it('produces an index.html and a JS bundle', () => {
		execSync('pnpm build', { cwd: REPO_ROOT, stdio: 'pipe' });
		expect(existsSync(resolve(DIST, 'index.html'))).toBe(true);
		const assets = readdirSync(resolve(DIST, 'assets'));
		expect(assets.some((f) => f.endsWith('.js'))).toBe(true);
	}, 60_000);
});
