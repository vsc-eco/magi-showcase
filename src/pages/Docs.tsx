import { Component, type ReactNode, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const README_URL =
	'https://raw.githubusercontent.com/vsc-eco/altera-app/feature/magi-sdk/README.md';
const FETCH_TIMEOUT_MS = 10_000;

class DocsErrorBoundary extends Component<
	{ children: ReactNode },
	{ hasError: boolean; message: string }
> {
	constructor(props: { children: ReactNode }) {
		super(props);
		this.state = { hasError: false, message: '' };
	}
	static getDerivedStateFromError(err: Error) {
		return { hasError: true, message: err.message };
	}
	render() {
		if (!this.state.hasError) return this.props.children;
		return (
			<div className="docs-status docs-status--error">
				<p>Docs page failed to load: {this.state.message || 'unknown error'}.</p>
				<p>
					This usually means a cached HTML file is pointing at a stale JS chunk.
					Hard-refresh (Cmd/Ctrl+Shift+R) to pick up the latest build, or{' '}
					<a
						href="https://github.com/vsc-eco/altera-app/blob/feature/magi-sdk/README.md"
						target="_blank"
						rel="noopener noreferrer"
					>
						read the SDK README on GitHub
					</a>
					.
				</p>
			</div>
		);
	}
}

type FetchState =
	| { kind: 'loading' }
	| { kind: 'ready'; markdown: string }
	| { kind: 'error'; message: string };

function Readme() {
	const [state, setState] = useState<FetchState>({ kind: 'loading' });
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		(async () => {
			try {
				const res = await fetch(README_URL, { signal: controller.signal });
				if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
				const markdown = await res.text();
				setState({ kind: 'ready', markdown });
			} catch (err) {
				if ((err as Error).name === 'AbortError') {
					setState({
						kind: 'error',
						message: `Fetch timed out or was cancelled after ${FETCH_TIMEOUT_MS / 1000}s`
					});
					return;
				}
				setState({ kind: 'error', message: (err as Error).message });
			} finally {
				clearTimeout(timer);
			}
		})();
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [attempt]);

	if (state.kind === 'loading') {
		return <div className="docs-status">Loading docs from GitHub…</div>;
	}
	if (state.kind === 'error') {
		return (
			<div className="docs-status docs-status--error">
				<p>Failed to load docs: {state.message}.</p>
				<p>
					<button
						onClick={() => {
							setState({ kind: 'loading' });
							setAttempt((n) => n + 1);
						}}
					>
						Retry
					</button>{' '}
					or{' '}
					<a
						href="https://github.com/vsc-eco/altera-app/blob/feature/magi-sdk/README.md"
						target="_blank"
						rel="noopener noreferrer"
					>
						read on GitHub
					</a>
					.
				</p>
			</div>
		);
	}
	return (
		<article className="markdown-body">
			<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
				{state.markdown}
			</Markdown>
		</article>
	);
}

export function Docs() {
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
			<DocsErrorBoundary>
				<Readme />
			</DocsErrorBoundary>
		</main>
	);
}
