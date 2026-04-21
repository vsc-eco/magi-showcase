import { lazy, Suspense, useEffect, useState } from 'react';
import { Landing } from './pages/Landing';

const Docs = lazy(() => import('./pages/Docs').then((m) => ({ default: m.Docs })));

function currentRoute(): 'docs' | 'landing' {
	return window.location.hash === '#/docs' ? 'docs' : 'landing';
}

export function App() {
	const [route, setRoute] = useState<'docs' | 'landing'>(() => currentRoute());

	useEffect(() => {
		const onHashChange = () => setRoute(currentRoute());
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	}, []);

	useEffect(() => {
		// Route changes start from the top; the Hero CTA still scrolls to
		// #widget within the landing page because that's an in-page anchor
		// (no leading slash), not a route switch handled here.
		window.scrollTo({ top: 0 });
	}, [route]);

	if (route === 'docs') {
		return (
			<Suspense fallback={<div className="docs-status">Loading docs…</div>}>
				<Docs />
			</Suspense>
		);
	}
	return <Landing />;
}
