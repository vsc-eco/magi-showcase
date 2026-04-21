import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const README_URL =
	'https://raw.githubusercontent.com/vsc-eco/altera-app/feature/magi-sdk/README.md';

export function Docs() {
	const [state, setState] = useState<
		| { kind: 'loading' }
		| { kind: 'ready'; markdown: string }
		| { kind: 'error'; message: string }
	>({ kind: 'loading' });

	useEffect(() => {
		const controller = new AbortController();
		(async () => {
			try {
				const res = await fetch(README_URL, { signal: controller.signal });
				if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
				const markdown = await res.text();
				setState({ kind: 'ready', markdown });
			} catch (err) {
				if ((err as Error).name === 'AbortError') return;
				setState({ kind: 'error', message: (err as Error).message });
			}
		})();
		return () => controller.abort();
	}, []);

	return (
		<main className="docs">
			<nav className="docs-nav">
				<a href="#/" className="docs-back">← Back to showcase</a>
				<a
					className="docs-source"
					href="https://github.com/vsc-eco/altera-app/blob/feature/magi-sdk/README.md"
					target="_blank"
					rel="noopener noreferrer"
				>
					View on GitHub ↗
				</a>
			</nav>

			{state.kind === 'loading' && (
				<div className="docs-status">Loading docs from GitHub…</div>
			)}
			{state.kind === 'error' && (
				<div className="docs-status docs-status--error">
					Failed to load docs: {state.message}.{' '}
					<a
						href="https://github.com/vsc-eco/altera-app/blob/feature/magi-sdk/README.md"
						target="_blank"
						rel="noopener noreferrer"
					>
						Read on GitHub
					</a>
					.
				</div>
			)}
			{state.kind === 'ready' && (
				<article className="markdown-body">
					<Markdown
						remarkPlugins={[remarkGfm]}
						rehypePlugins={[rehypeHighlight]}
					>
						{state.markdown}
					</Markdown>
				</article>
			)}
		</main>
	);
}
