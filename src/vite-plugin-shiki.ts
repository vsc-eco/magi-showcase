import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createHighlighter, type Highlighter } from 'shiki';
import type { Plugin } from 'vite';

// Imports like `./snippets/react-basic.tsx?highlight` resolve to a
// module exporting { source, html } — source is the raw file text
// (what you'd copy-paste) and html is Shiki's highlighted output.
const SUFFIX = '?highlight';
const LANG_BY_EXT: Record<string, string> = {
	'.ts': 'ts',
	'.tsx': 'tsx',
	'.html': 'html'
};

export function shikiHighlight(): Plugin {
	let highlighter: Highlighter | null = null;

	return {
		name: 'magi-shiki-highlight',
		enforce: 'pre',

		async buildStart() {
			highlighter = await createHighlighter({
				themes: ['github-dark'],
				langs: ['ts', 'tsx', 'html']
			});
		},

		resolveId(id, importer) {
			if (!id.endsWith(SUFFIX)) return null;
			const clean = id.slice(0, -SUFFIX.length);
			const resolved = importer
				? resolve(importer, '..', clean)
				: resolve(clean);
			return resolved + SUFFIX;
		},

		async load(id) {
			if (!id.endsWith(SUFFIX)) return null;
			const filePath = id.slice(0, -SUFFIX.length);
			const ext = extname(filePath);
			const lang = LANG_BY_EXT[ext] ?? 'ts';
			const source = await readFile(filePath, 'utf8');
			const html = highlighter!.codeToHtml(source, { lang, theme: 'github-dark' });
			return (
				`export const source = ${JSON.stringify(source)};\n` +
				`export const html = ${JSON.stringify(html)};\n` +
				`export default { source, html };\n`
			);
		}
	};
}
