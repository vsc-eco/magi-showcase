#!/usr/bin/env tsx
/**
 * Splice src/snippets/<name> into SNIPPETS.md between
 * `<!-- snippet:<name> -->` and `<!-- /snippet:<name> -->` markers.
 *
 * Usage:
 *   pnpm sync-snippets            # write changes to SNIPPETS.md
 *   pnpm sync-snippets --check    # exit 1 if SNIPPETS.md would change
 */
import { readFile, writeFile } from 'node:fs/promises';
import { extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = resolve(__dirname, '..');
const SNIPPETS_DIR = resolve(REPO_ROOT, 'src/snippets');
const MD_PATH = resolve(REPO_ROOT, 'SNIPPETS.md');

const LANG_BY_EXT: Record<string, string> = {
	'.ts': 'ts',
	'.tsx': 'tsx',
	'.html': 'html'
};

async function replaceAsync(
	input: string,
	re: RegExp,
	replacer: (...args: string[]) => Promise<string>
): Promise<string> {
	const matches: { start: number; end: number; out: string }[] = [];
	for (const m of input.matchAll(re)) {
		const out = await replacer(...m);
		matches.push({ start: m.index!, end: m.index! + m[0].length, out });
	}
	let result = '';
	let cursor = 0;
	for (const { start, end, out } of matches) {
		result += input.slice(cursor, start) + out;
		cursor = end;
	}
	return result + input.slice(cursor);
}

async function buildExpected(): Promise<string> {
	const md = await readFile(MD_PATH, 'utf8');
	const markerRe = /<!-- snippet:([^ ]+) -->[\s\S]*?<!-- \/snippet:\1 -->/g;
	return replaceAsync(md, markerRe, async (_m, name: string) => {
		const filePath = resolve(SNIPPETS_DIR, name);
		const lang = LANG_BY_EXT[extname(filePath)] ?? '';
		const source = (await readFile(filePath, 'utf8')).replace(/\s+$/, '');
		return `<!-- snippet:${name} -->\n\`\`\`${lang}\n${source}\n\`\`\`\n<!-- /snippet:${name} -->`;
	});
}

async function main() {
	const check = process.argv.includes('--check');
	const expected = await buildExpected();
	const actual = await readFile(MD_PATH, 'utf8');
	if (expected === actual) {
		if (!check) console.log('SNIPPETS.md already in sync.');
		return;
	}
	if (check) {
		console.error('SNIPPETS.md is out of sync with src/snippets/. Run `pnpm sync-snippets`.');
		process.exit(1);
	}
	await writeFile(MD_PATH, expected);
	console.log('SNIPPETS.md updated.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
