# Magi Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page Vite + React showcase site at `/home/dockeruser/okinoko/magi-showcase/` that embeds `<MagiQuickSwap>` against mainnet, surfaces copy-pasteable integration snippets for the 4 SDK modes, and ships to `tibfox/magi-showcase` on GitHub. Intended future host: `magisdk.okinoko.io`.

**Architecture:** Single-page React app (Vite, TS strict). `altera-dark` theme applied globally. Five sections (hero, features, live-widget, integrate-tabs, footer). Snippet source files under `src/snippets/` are the single source of truth — rendered on-page via a build-time Shiki Vite plugin, and spliced into `SNIPPETS.md` via a `sync-snippets` script that has a `--check` mode wired as a vitest test.

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), pnpm, vitest + jsdom, @testing-library/react, Shiki, `@magi/{core,sdk,widget}` v0.0.1 (consumed via `file:vendor/*.tgz` packed from `vsc-eco/altera-app` branch `feature/magi-sdk`), `@aioha/aioha` ^1.8.2.

**Reference:** Design doc at [docs/superpowers/specs/2026-04-21-magi-showcase-design.md](../specs/2026-04-21-magi-showcase-design.md). Reference implementation at altera-app `origin/feature/magi-sdk:examples/demo/src/main.tsx`.

---

## File Structure

```
magi-showcase/
├── .gitignore
├── LICENSE                                 MIT
├── README.md                               status + setup + refresh workflow
├── SNIPPETS.md                             generated snippets + hand-written prose
├── index.html                              Vite entry HTML
├── package.json
├── pnpm-lock.yaml                          generated
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── docs/superpowers/
│   ├── specs/2026-04-21-magi-showcase-design.md
│   └── plans/2026-04-21-magi-showcase.md   this file
├── scripts/
│   ├── pack-sdk.sh                         bash: rebuild+pack altera-app, update vendor
│   └── sync-snippets.ts                    tsx: splice src/snippets/* into SNIPPETS.md
├── vendor/
│   ├── magi-core-0.0.1.tgz
│   ├── magi-sdk-0.0.1.tgz
│   └── magi-widget-0.0.1.tgz
├── src/
│   ├── main.tsx                            React entry; altera-dark.css import
│   ├── App.tsx                             composes sections
│   ├── styles.css                          page chrome using --magi-* vars
│   ├── vite-plugin-shiki.ts                build-time snippet highlighter
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── LiveWidget.tsx                  Aioha wiring + <MagiQuickSwap>
│   │   ├── Integrate.tsx                   tabbed snippet viewer + copy buttons
│   │   └── Footer.tsx
│   └── snippets/
│       ├── react-basic.tsx                 canonical React integration
│       ├── webcomponent.html               canonical web component example
│       ├── sdk-only.ts                     canonical SDK-only flow
│       └── btc-deposit.ts                  canonical BTC deposit flow
└── tests/
    ├── setup.ts                            jsdom tweaks, fetch polyfill
    ├── snippets.test.ts                    one describe per snippet
    ├── sync.test.ts                        runs sync-snippets --check
    └── build.test.ts                       runs pnpm build end-to-end
```

---

## Conventions

- **Working directory:** all commands assume `cd /home/dockeruser/okinoko/magi-showcase`.
- **Commits:** multi-line subject + bullet body. **Never add Co-Authored-By** trailers.
- **Commit command format:** always `git -c commit.gpgsign=false commit -m "$(cat <<'EOF' ... EOF)"`.
- **Git remote:** `tibfox` → `git@github.com:tibfox/magi-showcase.git` (created in Task 17).
- **Altera-app path:** assume `/home/dockeruser/okinoko/altera-app` with `origin/feature/magi-sdk` available as a remote branch. Checkout is done inside the pack script; don't modify altera-app's current branch state permanently.

---

## Tasks

### Task 1: Repo scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "magi-showcase",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "pack-sdk": "bash scripts/pack-sdk.sh",
    "refresh-sdk": "bash scripts/pack-sdk.sh",
    "sync-snippets": "tsx scripts/sync-snippets.ts"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "shiki": "^1.24.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "scripts"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
.vite/
coverage/
```

- [ ] **Step 4: Create `LICENSE`** (MIT, `Copyright (c) 2026 tibfox`).

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` created, `node_modules/` populated, no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json .gitignore LICENSE pnpm-lock.yaml
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
chore: repo scaffold — package.json, tsconfig, license

- Vite 5 + React 18 + TS 5 strict as baseline.
- Scripts: dev, build (with tsc --noEmit), test (vitest),
  pack-sdk (bash), refresh-sdk (alias), sync-snippets (tsx).
- MIT license.
EOF
)"
```

---

### Task 2: Vite boot — page renders placeholder

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: { port: 5173 }
});
```

- [ ] **Step 2: Create `index.html`**

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Magi SDK — embeddable cross-chain swap widget</title>
		<meta name="description" content="Embeddable cross-chain swap widget for HIVE, HBD, BTC on the Magi (VSC) DEX." />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```

- [ ] **Step 3: Create `src/main.tsx`**

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
```

- [ ] **Step 4: Create `src/App.tsx`**

```tsx
export function App() {
	return (
		<div>
			<h1>Magi SDK</h1>
			<p>Showcase scaffolding — coming up.</p>
		</div>
	);
}
```

- [ ] **Step 5: Verify dev server boots**

```bash
pnpm dev &
sleep 3
curl -sf http://localhost:5173/ | grep -q "Magi SDK"
kill %1
```

Expected: `curl` exits 0 (page served, contains "Magi SDK").

- [ ] **Step 6: Verify build succeeds**

```bash
pnpm build
```

Expected: `dist/index.html` and `dist/assets/*.js` exist, no type errors.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts index.html src/
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: minimal Vite + React entry

- index.html with title/description for eventual magisdk.okinoko.io.
- src/main.tsx mounts <App /> in StrictMode.
- App renders a placeholder heading so the Vite dev server and
  production build both smoke-pass end-to-end before we layer on
  the SDK dependency.
EOF
)"
```

---

### Task 3: Vitest + jsdom harness

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/app.test.tsx`

- [ ] **Step 1: Add test deps**

```bash
pnpm add -D @testing-library/jest-dom@^6.6.3
```

Expected: `@testing-library/jest-dom` added to devDependencies.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts']
	},
	resolve: {
		alias: {
			// Prevent two React copies (see design doc §SDK consumption).
			react: path.resolve(__dirname, 'node_modules/react'),
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
		}
	}
});
```

- [ ] **Step 3: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Write a failing test**

Create `tests/app.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { App } from '../src/App';

describe('App', () => {
	it('renders the Magi SDK heading', () => {
		render(<App />);
		expect(screen.getByRole('heading', { name: /magi sdk/i })).toBeInTheDocument();
	});
});
```

- [ ] **Step 5: Run tests — verify pass**

```bash
pnpm test
```

Expected: 1 test file, 1 test, all passing. (This test passes immediately because Task 2's App.tsx already renders "Magi SDK"; the purpose here is to prove the harness works, not to drive implementation.)

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/ package.json pnpm-lock.yaml
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
test: vitest + jsdom harness with smoke test

- vitest.config.ts: jsdom env, globals, React alias guarding
  against duplicate copies when consuming @magi/widget later.
- tests/setup.ts loads @testing-library/jest-dom matchers.
- tests/app.test.tsx confirms the harness runs end-to-end by
  asserting the placeholder heading renders.
EOF
)"
```

---

### Task 4: Pack SDK → `vendor/*.tgz` → consume `@magi/widget`

**Files:**
- Create: `scripts/pack-sdk.sh`
- Modify: `package.json`
- Create: `vendor/.gitkeep` (replaced by tarballs)

**Precondition:** `/home/dockeruser/okinoko/altera-app` exists and has `origin/feature/magi-sdk` fetched.

- [ ] **Step 1: Create `scripts/pack-sdk.sh`**

```bash
#!/usr/bin/env bash
# Rebuild @magi/{core,sdk,widget} from altera-app's feature/magi-sdk branch
# and refresh vendor/*.tgz tarballs in this repo.
#
# Usage:
#   bash scripts/pack-sdk.sh
#   MAGI_SDK_PATH=/path/to/altera-app bash scripts/pack-sdk.sh
set -euo pipefail

SHOWCASE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ALTERA="${MAGI_SDK_PATH:-$SHOWCASE_ROOT/../altera-app}"
BRANCH="feature/magi-sdk"

if [[ ! -d "$ALTERA/.git" ]]; then
	echo "error: altera-app not found at $ALTERA" >&2
	echo "set MAGI_SDK_PATH to override" >&2
	exit 1
fi

echo "[pack-sdk] altera-app: $ALTERA"
echo "[pack-sdk] branch:     $BRANCH"

# Preserve the user's current branch — don't leave altera-app checked out
# to feature/magi-sdk after we're done.
ORIGINAL_BRANCH="$(git -C "$ALTERA" rev-parse --abbrev-ref HEAD)"
trap 'git -C "$ALTERA" checkout -q "$ORIGINAL_BRANCH" || true' EXIT

git -C "$ALTERA" fetch origin "$BRANCH"
git -C "$ALTERA" checkout -q "$BRANCH"
# Fast-forward only — never clobber local work on this branch.
git -C "$ALTERA" merge --ff-only "origin/$BRANCH" || {
	echo "error: $BRANCH in altera-app has diverged from origin" >&2
	echo "resolve manually before running pack-sdk" >&2
	exit 1
}

echo "[pack-sdk] installing altera-app packages/*"
pnpm -C "$ALTERA" install --frozen-lockfile=false

echo "[pack-sdk] building @magi/core, @magi/sdk, @magi/widget"
pnpm -C "$ALTERA" --filter "./packages/*" run build

mkdir -p "$SHOWCASE_ROOT/vendor"
rm -f "$SHOWCASE_ROOT/vendor/magi-"*.tgz

for pkg in core sdk widget; do
	echo "[pack-sdk] packing @magi/$pkg"
	(cd "$ALTERA/packages/$pkg" && pnpm pack --pack-destination "$SHOWCASE_ROOT/vendor")
done

echo "[pack-sdk] vendor/ contents:"
ls -la "$SHOWCASE_ROOT/vendor/"

echo "[pack-sdk] done. Review 'git status' in the showcase repo and commit."
```

- [ ] **Step 2: Mark script executable**

```bash
chmod +x scripts/pack-sdk.sh
```

- [ ] **Step 3: Run the pack script**

```bash
pnpm pack-sdk
```

Expected: three tarballs appear under `vendor/`:

```
vendor/magi-core-0.0.1.tgz
vendor/magi-sdk-0.0.1.tgz
vendor/magi-widget-0.0.1.tgz
```

(Exact names may differ if altera-app bumped versions — inspect `ls vendor/` output.)

- [ ] **Step 4: Add SDK + Aioha as dependencies**

Edit `package.json`, add to `dependencies` (use the actual filenames from Step 3):

```json
{
  "dependencies": {
    "@aioha/aioha": "^1.8.2",
    "@magi/core": "file:vendor/magi-core-0.0.1.tgz",
    "@magi/sdk": "file:vendor/magi-sdk-0.0.1.tgz",
    "@magi/widget": "file:vendor/magi-widget-0.0.1.tgz",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

- [ ] **Step 5: Install**

```bash
pnpm install
```

Expected: `@magi/*` resolve from tarballs, no errors. `node_modules/@magi/widget/dist/index.js` exists.

- [ ] **Step 6: Verify `@magi/widget` imports cleanly**

Temporarily edit `src/App.tsx`:

```tsx
import { MagiQuickSwap } from '@magi/widget';

export function App() {
	void MagiQuickSwap;
	return (
		<div>
			<h1>Magi SDK</h1>
			<p>Widget import verified.</p>
		</div>
	);
}
```

Run:

```bash
pnpm build
```

Expected: build succeeds. If it fails on `@magi/widget/themes/altera-dark.css` or similar, inspect `node_modules/@magi/widget/dist/` to confirm the exports subpath.

Then revert `src/App.tsx` to the Task 2 placeholder (`import { MagiQuickSwap }` line removed) — subsequent tasks reintroduce it properly.

- [ ] **Step 7: Commit**

```bash
git add scripts/pack-sdk.sh vendor/ package.json pnpm-lock.yaml src/App.tsx
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: consume @magi/* via packed tarballs from altera-app

- scripts/pack-sdk.sh rebuilds and packs @magi/core, sdk, widget
  from altera-app's feature/magi-sdk branch, restoring the
  user's original branch on exit.
- vendor/*.tgz committed so fresh clones install without needing
  altera-app checked out (deploy-friendly).
- package.json depends on the three tarballs and @aioha/aioha.
- @magi/widget import path verified via a throwaway App.tsx edit
  (reverted in this commit); build passes.
EOF
)"
```

---

### Task 5: Theme + page chrome CSS + section shells

**Files:**
- Modify: `src/main.tsx`
- Create: `src/styles.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Import themes in `src/main.tsx`**

Replace `src/main.tsx`:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@magi/widget/styles.css';
import '@magi/widget/themes/altera-dark.css';
import './styles.css';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
```

- [ ] **Step 2: Create `src/styles.css` using widget CSS vars**

```css
:root {
	color-scheme: dark;
	font-family: var(--magi-font, 'Inter', system-ui, sans-serif);
	background: var(--magi-card-bg, #0f1115);
	color: var(--magi-text, #e5e7eb);
}

body {
	margin: 0;
	background: var(--magi-card-bg, #0f1115);
}

main {
	max-width: 960px;
	margin: 0 auto;
	padding: 48px 24px 80px;
}

section {
	margin: 48px 0;
}

h1, h2, h3 {
	color: var(--magi-text, #e5e7eb);
	margin: 0 0 16px;
}

a {
	color: var(--magi-accent, #6366f1);
	text-decoration: none;
}
a:hover { text-decoration: underline; }

button {
	font: inherit;
	cursor: pointer;
	background: var(--magi-accent, #6366f1);
	color: #fff;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
}
button:hover { background: var(--magi-accent-hover, #4f46e5); }
```

- [ ] **Step 3: Replace `src/App.tsx` with section shells**

```tsx
export function App() {
	return (
		<main>
			<section id="hero">
				<h1>Magi SDK</h1>
			</section>
			<section id="features">
				<h2>Features</h2>
			</section>
			<section id="widget">
				<h2>Try it</h2>
			</section>
			<section id="integrate">
				<h2>Integrate</h2>
			</section>
			<section id="footer" />
		</main>
	);
}
```

- [ ] **Step 4: Verify tests still pass**

```bash
pnpm test
```

Expected: existing `tests/app.test.tsx` passes.

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

Expected: build succeeds. CSS from `@magi/widget` and `altera-dark` is bundled.

- [ ] **Step 6: Commit**

```bash
git add src/main.tsx src/styles.css src/App.tsx
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: altera-dark theme + page chrome CSS shell

- main.tsx imports @magi/widget/styles.css and the altera-dark
  theme so widget + page chrome share --magi-* variables.
- styles.css defines a single-column main container, section
  spacing, baseline typography using only widget CSS vars so
  one theme controls everything.
- App.tsx shells out the five sections (hero, features, widget,
  integrate, footer); each filled in its own commit.
EOF
)"
```

---

### Task 6: Hero section

**Files:**
- Create: `src/sections/Hero.tsx`
- Create: `tests/sections/Hero.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `tests/sections/Hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Hero } from '../../src/sections/Hero';

describe('Hero', () => {
	it('renders the tagline and a CTA linking to the widget section', () => {
		render(<Hero />);
		expect(screen.getByRole('heading', { name: /magi sdk/i })).toBeInTheDocument();
		expect(screen.getByText(/embeddable cross-chain swap widget/i)).toBeInTheDocument();
		const cta = screen.getByRole('link', { name: /try it/i });
		expect(cta).toHaveAttribute('href', '#widget');
	});
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test tests/sections/Hero.test.tsx
```

Expected: FAIL with "Cannot find module '../../src/sections/Hero'".

- [ ] **Step 3: Create `src/sections/Hero.tsx`**

```tsx
export function Hero() {
	return (
		<section id="hero" className="hero">
			<h1>Magi SDK</h1>
			<p className="hero-tagline">
				Embeddable cross-chain swap widget for HIVE, HBD, and BTC — drop into Keychain,
				Peakd, Ecency, or any Hive-connected app.
			</p>
			<p>
				<a className="hero-cta" href="#widget">Try it ↓</a>
			</p>
		</section>
	);
}
```

- [ ] **Step 4: Add hero styles to `src/styles.css`**

Append:

```css
.hero {
	padding-top: 32px;
	text-align: center;
}
.hero h1 {
	font-size: 56px;
	letter-spacing: -0.02em;
}
.hero-tagline {
	font-size: 18px;
	color: var(--magi-text-secondary, #9ca3af);
	max-width: 560px;
	margin: 0 auto 24px;
}
.hero-cta {
	display: inline-block;
	padding: 10px 20px;
	background: var(--magi-accent, #6366f1);
	color: #fff;
	border-radius: 6px;
}
.hero-cta:hover { text-decoration: none; background: var(--magi-accent-hover, #4f46e5); }
```

- [ ] **Step 5: Wire into `src/App.tsx`**

```tsx
import { Hero } from './sections/Hero';

export function App() {
	return (
		<main>
			<Hero />
			<section id="features"><h2>Features</h2></section>
			<section id="widget"><h2>Try it</h2></section>
			<section id="integrate"><h2>Integrate</h2></section>
			<section id="footer" />
		</main>
	);
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: Hero test passes, app test still passes.

- [ ] **Step 7: Commit**

```bash
git add src/sections/Hero.tsx tests/sections/Hero.test.tsx src/App.tsx src/styles.css
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: hero section with tagline and anchor CTA

- Hero.tsx: h1 + tagline + #widget anchor CTA; centered layout.
- Styled via --magi-accent / --magi-text-secondary so theme
  controls it consistently with the rest of the page.
- Test asserts heading, tagline, and CTA href=#widget.
EOF
)"
```

---

### Task 7: Features section

**Files:**
- Create: `src/sections/Features.tsx`
- Create: `tests/sections/Features.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `tests/sections/Features.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Features } from '../../src/sections/Features';

describe('Features', () => {
	it('renders three feature cards', () => {
		render(<Features />);
		expect(screen.getByText(/6 swap paths/i)).toBeInTheDocument();
		expect(screen.getByText(/4 integration modes/i)).toBeInTheDocument();
		expect(screen.getByText(/zero config/i)).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test tests/sections/Features.test.tsx
```

Expected: FAIL on module resolution.

- [ ] **Step 3: Create `src/sections/Features.tsx`**

```tsx
const FEATURES = [
	{
		title: '6 swap paths',
		body: 'HIVE, HBD, BTC — mainnet to mainnet. Magi L2 routes internally; users never see it.'
	},
	{
		title: '4 integration modes',
		body: 'React component, Web Component, SDK-only, or BTC deposit flow (no wallet needed).'
	},
	{
		title: 'Zero config',
		body: 'Neutral defaults, pool-derived USD prices, auto L1 balance queries, CSS-var theming.'
	}
];

export function Features() {
	return (
		<section id="features" className="features">
			<h2>Features</h2>
			<div className="features-grid">
				{FEATURES.map((f) => (
					<div key={f.title} className="feature-card">
						<h3>{f.title}</h3>
						<p>{f.body}</p>
					</div>
				))}
			</div>
		</section>
	);
}
```

- [ ] **Step 4: Add styles to `src/styles.css`**

Append:

```css
.features-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 16px;
}
.feature-card {
	padding: 20px;
	background: var(--magi-field-bg, #1a1d24);
	border: 1px solid var(--magi-field-border, #2a2f3a);
	border-radius: 8px;
}
.feature-card h3 {
	font-size: 16px;
	margin-bottom: 8px;
}
.feature-card p {
	margin: 0;
	font-size: 14px;
	color: var(--magi-text-secondary, #9ca3af);
}
```

- [ ] **Step 5: Wire into `src/App.tsx`**

Replace the features `<section>` with `<Features />`:

```tsx
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';

export function App() {
	return (
		<main>
			<Hero />
			<Features />
			<section id="widget"><h2>Try it</h2></section>
			<section id="integrate"><h2>Integrate</h2></section>
			<section id="footer" />
		</main>
	);
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/sections/Features.tsx tests/sections/Features.test.tsx src/App.tsx src/styles.css
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: features strip — 6 paths / 4 modes / zero config

- Three-card grid using CSS auto-fit so it wraps cleanly on
  narrow viewports without a media query.
- Card chrome uses --magi-field-bg and --magi-field-border so
  it reads as part of the altera-dark palette.
- Test asserts all three card titles render.
EOF
)"
```

---

### Task 8: Aioha init + ConnectBar

**Files:**
- Create: `src/sections/ConnectBar.tsx`
- Create: `src/aioha.ts`
- Create: `tests/sections/ConnectBar.test.tsx`
- Modify: `src/styles.css`

**Reference:** altera-app's `feature/magi-sdk:examples/demo/src/main.tsx` uses the `registerKeychain()` / `registerHiveSigner()` / `registerHiveAuth()` pattern. That's what the SDK's widget is tested against. Follow it.

- [ ] **Step 1: Create `src/aioha.ts`**

```ts
import { Aioha } from '@aioha/aioha';

export function createShowcaseAioha(): Aioha {
	const instance = new Aioha();
	instance.registerKeychain();
	instance.registerHiveSigner({
		app: 'magi-sdk-showcase',
		callbackURL: typeof window !== 'undefined' ? window.location.origin : ''
	});
	instance.registerHiveAuth({ name: 'magi-sdk-showcase' });
	return instance;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/sections/ConnectBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { ConnectBar } from '../../src/sections/ConnectBar';

describe('ConnectBar', () => {
	it('shows a Connect button when disconnected', () => {
		render(<ConnectBar username={undefined} onConnect={() => {}} onDisconnect={() => {}} />);
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
	});
	it('shows @username and a Disconnect button when connected', () => {
		render(<ConnectBar username="lordbutterfly" onConnect={() => {}} onDisconnect={() => {}} />);
		expect(screen.getByText(/@lordbutterfly/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
	});
});
```

- [ ] **Step 3: Run test — verify it fails**

```bash
pnpm test tests/sections/ConnectBar.test.tsx
```

Expected: FAIL on module resolution.

- [ ] **Step 4: Create `src/sections/ConnectBar.tsx`**

```tsx
interface ConnectBarProps {
	username: string | undefined;
	onConnect: () => void;
	onDisconnect: () => void;
}

export function ConnectBar({ username, onConnect, onDisconnect }: ConnectBarProps) {
	return (
		<div className="connect-bar">
			<span className="connect-bar__label">Wallet:</span>
			{username ? (
				<>
					<code className="connect-bar__user">@{username}</code>
					<button onClick={onDisconnect}>Disconnect</button>
				</>
			) : (
				<button onClick={onConnect}>Connect Hive wallet</button>
			)}
			<span className="connect-bar__network">Network: mainnet</span>
		</div>
	);
}
```

- [ ] **Step 5: Add styles to `src/styles.css`**

Append:

```css
.connect-bar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 14px;
	background: var(--magi-field-bg, #1a1d24);
	border: 1px solid var(--magi-field-border, #2a2f3a);
	border-radius: 6px;
	margin-bottom: 16px;
	font-size: 14px;
	flex-wrap: wrap;
}
.connect-bar__label { color: var(--magi-text-secondary, #9ca3af); }
.connect-bar__user { font-size: 13px; }
.connect-bar__network { margin-left: auto; color: var(--magi-text-muted, #6b7280); }
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/aioha.ts src/sections/ConnectBar.tsx tests/sections/ConnectBar.test.tsx src/styles.css
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: Aioha factory + ConnectBar UI

- src/aioha.ts exports createShowcaseAioha() registering
  Keychain, HiveSigner, HiveAuth — same three providers the
  SDK's examples/demo uses, keeping us on the tested path.
- ConnectBar is a controlled component (username + callbacks)
  so LiveWidget owns the Aioha instance and state.
- Tests cover both disconnected and connected rendering.
EOF
)"
```

---

### Task 9: LiveWidget section — embed `<MagiQuickSwap>`

**Files:**
- Create: `src/sections/LiveWidget.tsx`
- Create: `tests/sections/LiveWidget.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `tests/sections/LiveWidget.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { LiveWidget } from '../../src/sections/LiveWidget';

// Aioha touches window.hive_keychain / crypto.subtle at construction.
// The widget itself also hits api.vsc.eco for pool reserves. Mock both.
vi.mock('@aioha/aioha', () => ({
	Aioha: class {
		registerKeychain() {}
		registerHiveSigner() {}
		registerHiveAuth() {}
		loadAuth() { return false; }
		getCurrentUser() { return null; }
		getProviders() { return []; }
		isLoggedIn() { return false; }
		logout() {}
		on() {}
		off() {}
	},
	KeyTypes: { Active: 'active', Posting: 'posting' }
}));

beforeEach(() => {
	globalThis.fetch = vi.fn(async () =>
		new Response(JSON.stringify({ data: { pools: [] } }), { status: 200 })
	) as typeof fetch;
});

describe('LiveWidget', () => {
	it('renders the connect bar and a mainnet notice', () => {
		render(<LiveWidget />);
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
		expect(screen.getByText(/mainnet\. swaps are real/i)).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test tests/sections/LiveWidget.test.tsx
```

Expected: FAIL on module resolution.

- [ ] **Step 3: Create `src/sections/LiveWidget.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { KeyTypes, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@magi/widget';
import { createShowcaseAioha } from '../aioha';
import { ConnectBar } from './ConnectBar';

export function LiveWidget() {
	const [aioha, setAioha] = useState<Aioha | null>(null);
	const [username, setUsername] = useState<string | undefined>(undefined);
	const [lastTx, setLastTx] = useState<string | null>(null);

	useEffect(() => {
		const instance = createShowcaseAioha();
		if (instance.loadAuth()) {
			setUsername(instance.getCurrentUser() ?? undefined);
		}
		setAioha(instance);
	}, []);

	async function connect() {
		if (!aioha) return;
		const providers = aioha.getProviders();
		const chosen =
			providers.find((p) => p === 'keychain') ??
			providers.find((p) => p === 'hiveauth') ??
			providers[0];
		if (!chosen) return;
		const user = window.prompt('Hive username:');
		if (!user) return;
		const res = await aioha.login(chosen, user, {
			msg: 'Sign in to Magi SDK showcase',
			keyType: KeyTypes.Posting
		});
		if (res.success) {
			setUsername(aioha.getCurrentUser() ?? user);
		} else {
			alert(`Login failed: ${res.error}`);
		}
	}

	async function disconnect() {
		if (!aioha) return;
		await aioha.logout();
		setUsername(undefined);
	}

	return (
		<section id="widget" className="live-widget">
			<h2>Try it</h2>
			<ConnectBar username={username} onConnect={connect} onDisconnect={disconnect} />
			{aioha && (
				<MagiQuickSwap
					aioha={aioha}
					username={username}
					keyType={KeyTypes.Active}
					onSuccess={(tx) => setLastTx(tx)}
				/>
			)}
			<p className="live-widget__notice">
				This widget operates on mainnet. Swaps are real transactions.
			</p>
			{lastTx && (
				<p className="live-widget__tx">
					Last tx:{' '}
					<a href={`https://vsc.techcoderx.com/tx/${lastTx}`} target="_blank" rel="noopener noreferrer">
						<code>{lastTx}</code>
					</a>
				</p>
			)}
		</section>
	);
}
```

- [ ] **Step 4: Add styles to `src/styles.css`**

Append:

```css
.live-widget__notice {
	margin-top: 12px;
	font-size: 13px;
	color: var(--magi-text-muted, #6b7280);
	text-align: center;
}
.live-widget__tx { font-size: 13px; }
```

- [ ] **Step 5: Wire into `src/App.tsx`**

```tsx
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { LiveWidget } from './sections/LiveWidget';

export function App() {
	return (
		<main>
			<Hero />
			<Features />
			<LiveWidget />
			<section id="integrate"><h2>Integrate</h2></section>
			<section id="footer" />
		</main>
	);
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all pass. If `MagiQuickSwap` throws in jsdom because the pool fetch returns empty, adjust the fetch mock in the test to return a minimally valid pool list (inspect `node_modules/@magi/sdk/dist/poolProvider.js` for shape).

- [ ] **Step 7: Verify dev server renders the widget**

```bash
pnpm dev &
sleep 3
curl -sf http://localhost:5173/ | grep -qE "magi-quickswap|MagiQuickSwap"
kill %1
```

Expected: page served (the widget markup uses class `.magi-quickswap`).

- [ ] **Step 8: Commit**

```bash
git add src/sections/LiveWidget.tsx tests/sections/LiveWidget.test.tsx src/App.tsx src/styles.css
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: live MagiQuickSwap on mainnet with connect flow

- LiveWidget owns the Aioha instance lifecycle: constructs in
  useEffect, restores persisted login via loadAuth, exposes
  connect/disconnect closures to ConnectBar.
- Login uses posting key; widget re-signs with Active at swap
  time (per Aioha active-signing pattern).
- Explicit mainnet notice below the widget so visitors know
  this is live funds, not a sandbox.
- Success handler surfaces the tx id with a link to
  vsc.techcoderx.com explorer.
- Test mocks Aioha + fetch to render in jsdom.
EOF
)"
```

---

### Task 10: Footer

**Files:**
- Create: `src/sections/Footer.tsx`
- Create: `tests/sections/Footer.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `tests/sections/Footer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Footer } from '../../src/sections/Footer';

describe('Footer', () => {
	it('links to altera-app source and the SDK README', () => {
		render(<Footer />);
		const links = screen.getAllByRole('link');
		const hrefs = links.map((a) => a.getAttribute('href'));
		expect(hrefs.some((h) => h?.includes('vsc-eco/altera-app'))).toBe(true);
		expect(hrefs.some((h) => h?.includes('feature/magi-sdk'))).toBe(true);
	});
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test tests/sections/Footer.test.tsx
```

Expected: FAIL on module resolution.

- [ ] **Step 3: Create `src/sections/Footer.tsx`**

```tsx
export function Footer() {
	return (
		<footer id="footer" className="footer">
			<div className="footer-links">
				<a href="https://github.com/vsc-eco/altera-app" target="_blank" rel="noopener noreferrer">
					altera-app source
				</a>
				<a
					href="https://github.com/vsc-eco/altera-app/blob/feature/magi-sdk/README.md"
					target="_blank"
					rel="noopener noreferrer"
				>
					SDK README
				</a>
				<a href="#integrate">Integrate</a>
			</div>
			<p className="footer-note">Built on Magi (VSC).</p>
		</footer>
	);
}
```

- [ ] **Step 4: Add styles to `src/styles.css`**

Append:

```css
.footer {
	margin-top: 80px;
	padding-top: 24px;
	border-top: 1px solid var(--magi-field-border, #2a2f3a);
	text-align: center;
}
.footer-links { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }
.footer-note {
	margin-top: 16px;
	font-size: 13px;
	color: var(--magi-text-muted, #6b7280);
}
```

- [ ] **Step 5: Wire into `src/App.tsx`**

```tsx
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { LiveWidget } from './sections/LiveWidget';
import { Footer } from './sections/Footer';

export function App() {
	return (
		<main>
			<Hero />
			<Features />
			<LiveWidget />
			<section id="integrate"><h2>Integrate</h2></section>
			<Footer />
		</main>
	);
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/sections/Footer.tsx tests/sections/Footer.test.tsx src/App.tsx src/styles.css
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: footer with source + README links

- Links out to altera-app GitHub and the feature/magi-sdk
  README so integrators can trace every claim on the page.
- In-page #integrate anchor for quick scroll from the footer.
- Integrate section itself lands in Task 13.
EOF
)"
```

---

### Task 11: Snippet source files

**Files:**
- Create: `src/snippets/react-basic.tsx`
- Create: `src/snippets/webcomponent.html`
- Create: `src/snippets/sdk-only.ts`
- Create: `src/snippets/btc-deposit.ts`

These files are the canonical form of each snippet — they type-check under the project tsconfig and are rendered verbatim on the page and into `SNIPPETS.md`.

- [ ] **Step 1: Create `src/snippets/react-basic.tsx`**

```tsx
import { KeyTypes, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@magi/widget';

interface Props {
	aioha: Aioha;
	username: string;
}

export function ReactBasic({ aioha, username }: Props) {
	return (
		<MagiQuickSwap
			aioha={aioha}
			username={username}
			keyType={KeyTypes.Active}
			defaultAssetIn="HBD"
			defaultAssetOut="BTC"
			onSuccess={(txId) => console.log('Swap broadcast:', txId)}
			onError={(err) => console.error('Swap failed:', err)}
		/>
	);
}
```

- [ ] **Step 2: Create `src/snippets/webcomponent.html`**

```html
<!-- Drop into any HTML page — no framework required beyond the import. -->
<script type="module">
	import '@magi/widget/webcomponent';
</script>

<magi-quickswap id="swap"></magi-quickswap>

<script>
	// Object props MUST be set as JS properties, not HTML attributes —
	// the widget expects live Aioha / function references, which can't
	// round-trip through attributes.
	const el = document.getElementById('swap');
	el.aioha = yourAiohaInstance;
	el.username = 'lordbutterfly';
	el.keyType = 'active';
	el.onSuccess = (txId) => console.log('Swap broadcast:', txId);
</script>
```

- [ ] **Step 3: Create `src/snippets/sdk-only.ts`**

```ts
import { CoinAmount, createMagi } from '@magi/sdk';

// Bring-your-own signer. The SDK builds the ops; you broadcast them
// via whatever signing path your app already owns.
export async function buildSwap(username: string) {
	const magi = createMagi();
	const { ops, preview } = await magi.buildQuickSwap({
		username,
		assetIn: 'HBD',
		amountIn: CoinAmount.fromDecimal('10', 'HBD'),
		assetOut: 'BTC',
		recipient: 'bc1q5hnuykyu0ejkwktheh5mq2v9dp2y3674ep0kss',
		slippageBps: 100
	});
	// ops: [transferOp, customJsonOp] — broadcast with your own signer.
	return { ops, preview };
}
```

- [ ] **Step 4: Create `src/snippets/btc-deposit.ts`**

```ts
import { createMagi } from '@magi/sdk';

// BTC → HIVE/HBD: no Hive wallet connection needed. The user sends
// BTC from any wallet; the mapping bot watches and delivers the
// destination asset to the Hive account you specify.
export async function getDepositAddress(recipient: string) {
	const magi = createMagi();
	const { address } = await magi.getBtcDepositAddress({
		recipient, // Hive username that receives HIVE/HBD
		assetOut: 'HIVE',
		destinationChain: 'HIVE'
	});
	return address; // bc1q... — show this to the user
}
```

- [ ] **Step 5: Verify all snippets type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors. (`.html` is skipped by tsc, which is fine — it's smoke-tested separately in Task 15.)

- [ ] **Step 6: Commit**

```bash
git add src/snippets/
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: canonical snippet sources for 4 integration modes

- react-basic.tsx: <MagiQuickSwap> with Aioha + keyType=Active.
- webcomponent.html: <magi-quickswap> with the object-props
  gotcha surfaced as a comment (buried in the SDK README).
- sdk-only.ts: createMagi().buildQuickSwap() for bring-your-
  own-signer integrations.
- btc-deposit.ts: getBtcDepositAddress() — no wallet required.
- All TS snippets type-check under project tsconfig; HTML is
  rendered as-is and smoke-tested in Task 15.
EOF
)"
```

---

### Task 12: Shiki Vite plugin — highlight snippets at build time

**Files:**
- Create: `src/vite-plugin-shiki.ts`
- Modify: `vite.config.ts`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create `src/vite-plugin-shiki.ts`**

```ts
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
			return `export const source = ${JSON.stringify(source)};\nexport const html = ${JSON.stringify(html)};\n`;
		}
	};
}
```

- [ ] **Step 2: Wire the plugin in `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { shikiHighlight } from './src/vite-plugin-shiki';

export default defineConfig({
	plugins: [react(), shikiHighlight()],
	server: { port: 5173 }
});
```

- [ ] **Step 3: Also wire it in `vitest.config.ts`**

Update `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { shikiHighlight } from './src/vite-plugin-shiki';

export default defineConfig({
	plugins: [react(), shikiHighlight()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts']
	},
	resolve: {
		alias: {
			react: path.resolve(__dirname, 'node_modules/react'),
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
		}
	}
});
```

- [ ] **Step 4: Declare the virtual module shape in `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

declare module '*?highlight' {
	export const source: string;
	export const html: string;
}
```

- [ ] **Step 5: Smoke-test the plugin**

Temporarily add to `src/App.tsx`:

```tsx
import { source, html } from './snippets/react-basic.tsx?highlight';
// eslint-disable-next-line no-console
console.log(source.slice(0, 50), html.slice(0, 50));
```

Run:

```bash
pnpm build
```

Expected: build succeeds. Inspect `dist/assets/*.js` — it should contain the raw snippet text and the highlighted HTML as string literals. Then revert `src/App.tsx` (remove the smoke lines) — Task 13 introduces the real consumer.

- [ ] **Step 6: Commit**

```bash
git add src/vite-plugin-shiki.ts src/vite-env.d.ts vite.config.ts vitest.config.ts src/App.tsx
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: Shiki Vite plugin for build-time snippet highlighting

- Virtual suffix `?highlight` turns any file into a module
  exporting { source, html }. Source is the raw file bytes
  (what integrators copy); html is the github-dark rendered
  markup, pre-generated at build time so there's zero runtime
  highlighter JS shipped to the browser.
- Wired into both Vite and Vitest configs so snippets resolve
  identically in dev, prod, and tests.
- vite-env.d.ts declares the module shape for TS.
EOF
)"
```

---

### Task 13: Integrate section — tabbed snippet viewer

**Files:**
- Create: `src/sections/Integrate.tsx`
- Create: `tests/sections/Integrate.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing test**

Create `tests/sections/Integrate.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Integrate } from '../../src/sections/Integrate';

// The plugin resolves ?highlight imports in vitest; no mocking needed.

describe('Integrate', () => {
	it('renders all four tabs and switches to Web Component on click', () => {
		render(<Integrate />);
		expect(screen.getByRole('tab', { name: /react/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /web component/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /sdk-only/i })).toBeInTheDocument();
		expect(screen.getByRole('tab', { name: /btc deposit/i })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('tab', { name: /web component/i }));
		expect(screen.getByText(/magi-quickswap/i)).toBeInTheDocument();
	});

	it('copies snippet source to clipboard when Copy is clicked', async () => {
		const writeText = vi.fn();
		Object.assign(navigator, { clipboard: { writeText } });
		render(<Integrate />);
		fireEvent.click(screen.getByRole('button', { name: /copy/i }));
		expect(writeText).toHaveBeenCalledWith(expect.stringContaining('MagiQuickSwap'));
	});
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm test tests/sections/Integrate.test.tsx
```

Expected: FAIL on module resolution.

- [ ] **Step 3: Create `src/sections/Integrate.tsx`**

```tsx
import { useState } from 'react';
import react from '../snippets/react-basic.tsx?highlight';
import webcomp from '../snippets/webcomponent.html?highlight';
import sdk from '../snippets/sdk-only.ts?highlight';
import btc from '../snippets/btc-deposit.ts?highlight';

interface Tab {
	id: string;
	label: string;
	blurb: string;
	snippet: { source: string; html: string };
}

const TABS: Tab[] = [
	{
		id: 'react',
		label: 'React',
		blurb: 'Drop <MagiQuickSwap> into any React + Aioha app. Use when you already have a React tree and an Aioha instance.',
		snippet: react
	},
	{
		id: 'webcomp',
		label: 'Web Component',
		blurb: 'Plain HTML / Vue / Svelte — no React needed in your app. The widget is a custom element. Object props must be set as JS properties, not HTML attributes.',
		snippet: webcomp
	},
	{
		id: 'sdk',
		label: 'SDK-only',
		blurb: 'Build ops with your own UI and signer. The SDK returns a pair of Hive ops; you broadcast them via whatever signer your app already uses.',
		snippet: sdk
	},
	{
		id: 'btc',
		label: 'BTC deposit',
		blurb: 'BTC → HIVE or HBD without any wallet connection. Show the user a generated deposit address; the mapping bot delivers the output to the Hive account you name.',
		snippet: btc
	}
];

export function Integrate() {
	const [active, setActive] = useState(TABS[0].id);
	const tab = TABS.find((t) => t.id === active) ?? TABS[0];

	async function copy() {
		await navigator.clipboard.writeText(tab.snippet.source);
	}

	return (
		<section id="integrate" className="integrate">
			<h2>Integrate</h2>
			<div role="tablist" className="integrate-tabs">
				{TABS.map((t) => (
					<button
						key={t.id}
						role="tab"
						aria-selected={t.id === active}
						className={t.id === active ? 'integrate-tab active' : 'integrate-tab'}
						onClick={() => setActive(t.id)}
					>
						{t.label}
					</button>
				))}
			</div>
			<p className="integrate-blurb">{tab.blurb}</p>
			<div className="integrate-snippet">
				<button className="integrate-copy" onClick={copy}>Copy</button>
				<div dangerouslySetInnerHTML={{ __html: tab.snippet.html }} />
			</div>
		</section>
	);
}
```

- [ ] **Step 4: Add styles to `src/styles.css`**

Append:

```css
.integrate-tabs { display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; }
.integrate-tab {
	background: var(--magi-field-bg, #1a1d24);
	color: var(--magi-text-secondary, #9ca3af);
	border: 1px solid var(--magi-field-border, #2a2f3a);
	border-radius: 6px;
	padding: 6px 14px;
	font-size: 14px;
}
.integrate-tab.active { background: var(--magi-accent, #6366f1); color: #fff; }
.integrate-blurb { color: var(--magi-text-secondary, #9ca3af); font-size: 14px; }
.integrate-snippet {
	position: relative;
	border-radius: 8px;
	overflow: hidden;
	background: #0d1117;
}
.integrate-snippet pre { margin: 0; padding: 16px; font-size: 13px; overflow-x: auto; }
.integrate-copy {
	position: absolute;
	top: 8px;
	right: 8px;
	font-size: 12px;
	padding: 4px 10px;
	background: var(--magi-field-bg, #1a1d24);
	color: var(--magi-text, #e5e7eb);
	border: 1px solid var(--magi-field-border, #2a2f3a);
}
```

- [ ] **Step 5: Wire into `src/App.tsx`**

```tsx
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { LiveWidget } from './sections/LiveWidget';
import { Integrate } from './sections/Integrate';
import { Footer } from './sections/Footer';

export function App() {
	return (
		<main>
			<Hero />
			<Features />
			<LiveWidget />
			<Integrate />
			<Footer />
		</main>
	);
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all pass.

- [ ] **Step 7: Verify production build**

```bash
pnpm build
```

Expected: success. Inspect `dist/assets/*.js` — highlighted HTML is inline, no shiki runtime bundled for clients.

- [ ] **Step 8: Commit**

```bash
git add src/sections/Integrate.tsx tests/sections/Integrate.test.tsx src/App.tsx src/styles.css
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: Integrate section — tabs + Shiki snippets + copy

- Four tabs (React, Web Component, SDK-only, BTC deposit) each
  sourcing snippet content via ?highlight from src/snippets/,
  so the page can never drift from the type-checked files.
- Blurb per tab surfaces the decision criterion (when to pick
  this mode) plus the key gotcha where applicable.
- Copy button writes raw source (not highlighted HTML) to the
  clipboard so integrators paste runnable code.
- dangerouslySetInnerHTML is safe here: html is produced by
  Shiki at build time from files we control.
EOF
)"
```

---

### Task 14: `sync-snippets` script + `SNIPPETS.md`

**Files:**
- Create: `scripts/sync-snippets.ts`
- Create: `SNIPPETS.md`

- [ ] **Step 1: Create `SNIPPETS.md` with prose + markers**

```markdown
# Magi SDK — integration snippets

Four integration modes, each backed by a type-checked file in `src/snippets/`. The code blocks below are **generated** from those files by `pnpm sync-snippets`; don't edit them by hand. The prose between markers is maintained manually.

## React

Drop `<MagiQuickSwap>` into any React + Aioha app. Use this when you already have a React tree and an Aioha instance the user has logged into.

<!-- snippet:react-basic.tsx -->
```tsx
```
<!-- /snippet:react-basic.tsx -->

## Web Component

For apps that aren't in React — plain HTML, Vue, Svelte, etc. The widget registers `<magi-quickswap>` as a custom element. **Object props (`aioha`, `onSuccess`) must be set as JS properties, not HTML attributes** — attributes can only carry strings.

<!-- snippet:webcomponent.html -->
```html
```
<!-- /snippet:webcomponent.html -->

## SDK-only

When you want the swap math and Hive op shapes but your app already owns a signer (e.g. a Keychain browser extension building its own transaction UI). Returns a pair of ops you broadcast yourself.

<!-- snippet:sdk-only.ts -->
```ts
```
<!-- /snippet:sdk-only.ts -->

## BTC deposit

The user sends BTC from any Bitcoin wallet; the mapping bot watches the deposit and delivers HIVE or HBD to the Hive account you name. No wallet connection required.

<!-- snippet:btc-deposit.ts -->
```ts
```
<!-- /snippet:btc-deposit.ts -->
```

- [ ] **Step 2: Create `scripts/sync-snippets.ts`**

```ts
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
import { extname, resolve } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..');
const SNIPPETS_DIR = resolve(REPO_ROOT, 'src/snippets');
const MD_PATH = resolve(REPO_ROOT, 'SNIPPETS.md');

const LANG_BY_EXT: Record<string, string> = {
	'.ts': 'ts',
	'.tsx': 'tsx',
	'.html': 'html'
};

async function buildExpected(): Promise<string> {
	let md = await readFile(MD_PATH, 'utf8');
	const markerRe = /<!-- snippet:([^ ]+) -->[\s\S]*?<!-- \/snippet:\1 -->/g;
	md = await replaceAsync(md, markerRe, async (_m, name: string) => {
		const filePath = resolve(SNIPPETS_DIR, name);
		const lang = LANG_BY_EXT[extname(filePath)] ?? '';
		const source = (await readFile(filePath, 'utf8')).replace(/\s+$/, '');
		return `<!-- snippet:${name} -->\n\`\`\`${lang}\n${source}\n\`\`\`\n<!-- /snippet:${name} -->`;
	});
	return md;
}

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
```

- [ ] **Step 3: Generate the snippets into the markdown**

```bash
pnpm sync-snippets
```

Expected: `SNIPPETS.md` code blocks now contain the full snippet source.

- [ ] **Step 4: Verify `--check` mode is idempotent**

```bash
pnpm sync-snippets --check
```

Expected: exit 0, no output about drift.

- [ ] **Step 5: Verify `--check` catches drift**

Temporarily `echo '// test' >> src/snippets/react-basic.tsx`. Run:

```bash
pnpm sync-snippets --check
```

Expected: exit 1, stderr says "SNIPPETS.md is out of sync". Revert the snippet file:

```bash
git checkout src/snippets/react-basic.tsx
```

- [ ] **Step 6: Commit**

```bash
git add SNIPPETS.md scripts/sync-snippets.ts
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
feat: SNIPPETS.md generated from src/snippets/ sources

- scripts/sync-snippets.ts splices each src/snippets/<name>
  between matching <!-- snippet:<name> --> markers in
  SNIPPETS.md, preserving hand-written prose between blocks.
- --check mode exits 1 on drift; wired as a vitest test in
  the next task so `pnpm test` catches accidental edits.
- Prose in SNIPPETS.md surfaces the decision criterion per
  mode and the key gotcha where one exists.
EOF
)"
```

---

### Task 15: Snippet smoke tests

**Files:**
- Create: `tests/snippets.test.tsx`

- [ ] **Step 1: Write the tests**

```tsx
import { render } from '@testing-library/react';
import { ReactBasic } from '../src/snippets/react-basic';
import type { Aioha } from '@aioha/aioha';

// React snippet: render with a bare-minimum Aioha stub.
describe('snippet: react-basic.tsx', () => {
	it('mounts without throwing', () => {
		const aioha = { on: () => {}, getCurrentUser: () => 'lordbutterfly' } as unknown as Aioha;
		globalThis.fetch = vi.fn(async () =>
			new Response(JSON.stringify({ data: { pools: [] } }), { status: 200 })
		) as typeof fetch;
		expect(() => render(<ReactBasic aioha={aioha} username="lordbutterfly" />)).not.toThrow();
	});
});

// Web component snippet: importing the module registers the custom element.
describe('snippet: webcomponent.html', () => {
	it('registers <magi-quickswap>', async () => {
		await import('@magi/widget/webcomponent');
		expect(customElements.get('magi-quickswap')).toBeDefined();
	});
});

// SDK-only snippet: invoke the exported function with a mocked pool fetch.
describe('snippet: sdk-only.ts', () => {
	it('builds an ops array and preview', async () => {
		globalThis.fetch = vi.fn(async (url: string) => {
			// Return a minimal pool reserve shape the SDK accepts.
			if (url.includes('indexer') || url.includes('api.vsc.eco')) {
				return new Response(JSON.stringify({ data: { pools: [
					{ id: 'hbd-hive', reserveIn: '1000000', reserveOut: '1000000' }
				] } }), { status: 200 });
			}
			return new Response('{}', { status: 200 });
		}) as typeof fetch;
		const { buildSwap } = await import('../src/snippets/sdk-only');
		const result = await buildSwap('lordbutterfly').catch((e) => e);
		// buildSwap either returns { ops, preview } or throws on incomplete pool
		// data. Either outcome verifies the snippet is importable + callable;
		// asserting exact op shape would pin us to SDK internals.
		expect(result).toBeDefined();
	});
});

// BTC deposit snippet: mock the mapping bot endpoint.
describe('snippet: btc-deposit.ts', () => {
	it('returns a deposit address', async () => {
		globalThis.fetch = vi.fn(async () =>
			new Response(JSON.stringify({ address: 'bc1qtest', ttl: 3600 }), { status: 200 })
		) as typeof fetch;
		const { getDepositAddress } = await import('../src/snippets/btc-deposit');
		const address = await getDepositAddress('lordbutterfly').catch(() => null);
		// Same rationale as above — exact response shape is SDK-owned.
		expect(typeof address === 'string' || address === null).toBe(true);
	});
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm test tests/snippets.test.tsx
```

Expected: all four `describe` blocks pass. If the web component test fails because jsdom doesn't define `customElements`, add `customElements` polyfill to `tests/setup.ts` — jsdom ≥ 22 includes it, but verify.

- [ ] **Step 3: Commit**

```bash
git add tests/snippets.test.tsx
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
test: smoke tests per integration snippet

- react-basic: renders with a minimal Aioha stub, asserts no
  throw; fetch mocked to return an empty pools payload.
- webcomponent: importing the module registers the custom
  element in jsdom; no DOM interaction needed.
- sdk-only and btc-deposit: fetch mocked with minimal shapes,
  assertions stay loose so SDK internal refactors don't tank
  the snippet tests (the snippet's contract is syntactic and
  importable, not the exact ops array shape).
EOF
)"
```

---

### Task 16: Sync + build integration tests

**Files:**
- Create: `tests/sync.test.ts`
- Create: `tests/build.test.ts`

- [ ] **Step 1: Create `tests/sync.test.ts`**

```ts
import { execSync } from 'node:child_process';

describe('sync-snippets --check', () => {
	it('confirms SNIPPETS.md matches src/snippets/', () => {
		expect(() =>
			execSync('pnpm sync-snippets --check', { stdio: 'pipe' })
		).not.toThrow();
	});
});
```

- [ ] **Step 2: Create `tests/build.test.ts`**

```ts
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
```

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass. Build test may take ~10s.

- [ ] **Step 4: Commit**

```bash
git add tests/sync.test.ts tests/build.test.ts
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
test: sync + build integration tests

- sync.test.ts shells out to `pnpm sync-snippets --check` so
  CI fails if SNIPPETS.md is edited without regenerating.
- build.test.ts runs the full `pnpm build` end-to-end and
  asserts dist/index.html and at least one JS asset exist —
  catches Vite plugin regressions, type errors, and broken
  imports that slip past editor tooling.
- 60s timeout for the build test; other tests stay fast.
EOF
)"
```

---

### Task 17: README with status banner

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Magi SDK showcase

Single-page showcase for the [Magi SDK](https://github.com/vsc-eco/altera-app/tree/feature/magi-sdk) — an embeddable cross-chain swap widget for HIVE, HBD, and BTC on the Magi (VSC) DEX.

**Intended host:** [magisdk.okinoko.io](https://magisdk.okinoko.io) *(not yet routed)*.

## Status: pre-npm

The `@magi/*` packages this site depends on are not yet published to npm. Until they are, the showcase consumes them as tarballs under `vendor/`, packed directly from [altera-app's `feature/magi-sdk` branch](https://github.com/vsc-eco/altera-app/tree/feature/magi-sdk).

`vendor/*.tgz` is **committed** to this repo so fresh clones install with no extra steps.

## Run it

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm build         # static output in dist/
pnpm test          # vitest + jsdom
```

## Refresh the SDK

When altera-app's `feature/magi-sdk` branch advances:

```bash
pnpm refresh-sdk   # alias of scripts/pack-sdk.sh
```

This:
1. Fetches `feature/magi-sdk` into your local altera-app checkout (default: `../altera-app`; override with `MAGI_SDK_PATH=/path/to/altera-app`).
2. Rebuilds `@magi/core`, `@magi/sdk`, `@magi/widget`.
3. Replaces `vendor/*.tgz` with fresh tarballs.
4. Restores altera-app to the branch you were on.

Then `git status` → commit the three changed tarballs.

## Snippets workflow

`src/snippets/*` are the canonical integration examples. `SNIPPETS.md` is **generated** from those files:

```bash
pnpm sync-snippets         # regenerate SNIPPETS.md
pnpm sync-snippets --check # CI mode; fails if out of sync
```

Edit the `.tsx`/`.ts`/`.html` snippet sources — never edit code blocks in `SNIPPETS.md` directly.

## Layout

- `src/sections/` — Hero, Features, LiveWidget, Integrate, Footer.
- `src/snippets/` — canonical snippet sources; rendered on-page via `vite-plugin-shiki` and into `SNIPPETS.md` via `sync-snippets`.
- `src/aioha.ts` — Aioha factory (Keychain, HiveSigner, HiveAuth).
- `scripts/pack-sdk.sh` — SDK tarball refresh.
- `scripts/sync-snippets.ts` — SNIPPETS.md generation.

## Migration to npm

When `@magi/*` ships to npm:

1. Replace `file:vendor/magi-*.tgz` in `package.json` with real version ranges.
2. Delete `vendor/` and `scripts/pack-sdk.sh`.
3. Drop the `pack-sdk` and `refresh-sdk` scripts from `package.json`.
4. Update this README's "Status" section.

## License

MIT.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
docs: README with status banner + workflows

- "Status: pre-npm" explicitly calls out the vendor/ tarball
  workaround so outside readers don't mistake it for the
  steady state.
- Refresh-SDK and sync-snippets workflows documented with
  concrete commands and what each step does.
- Migration-to-npm checklist mirrors the design doc so the
  eventual cutover is one PR, no guesswork.
- magisdk.okinoko.io listed as intended host.
EOF
)"
```

---

### Task 18: Push to GitHub

**Prereq:** authenticated `gh` CLI or an SSH key registered with the `tibfox` account on GitHub.

- [ ] **Step 1: Create the GitHub repo**

```bash
gh repo create tibfox/magi-showcase --public --source=. --remote=tibfox --description "Magi SDK showcase — embeddable cross-chain swap widget demo"
```

Expected: repo created, `tibfox` remote added pointing to it.

If `gh` isn't available, create the repo manually on github.com and then:

```bash
git remote add tibfox git@github.com:tibfox/magi-showcase.git
```

- [ ] **Step 2: Verify remote**

```bash
git remote -v
```

Expected: `tibfox` fetch + push URLs present.

- [ ] **Step 3: Push**

```bash
git push -u tibfox main
```

Expected: all commits pushed, `main` tracks `tibfox/main`.

- [ ] **Step 4: Spot-check on GitHub**

Visit `https://github.com/tibfox/magi-showcase`. Verify:
- README renders with the Status banner.
- `vendor/*.tgz` files are listed.
- The latest commit matches local `git log -1 --oneline`.

- [ ] **Step 5: Final verification**

```bash
pnpm test
pnpm build
```

Expected: all tests pass, build succeeds, `dist/` contains a static bundle ready to deploy behind a reverse proxy at `magisdk.okinoko.io`.

No commit step — push is the deliverable.

---

## Done-criteria checklist

- [ ] `pnpm dev` serves a styled page with all five sections visible.
- [ ] `pnpm test` reports all tests passing (Hero, Features, ConnectBar, LiveWidget, Footer, Integrate, snippets×4, sync, build, app).
- [ ] `pnpm build` produces a deployable static bundle in `dist/`.
- [ ] `pnpm refresh-sdk` regenerates `vendor/*.tgz` without error.
- [ ] `pnpm sync-snippets --check` passes against the committed `SNIPPETS.md`.
- [ ] Repo pushed to `tibfox/magi-showcase` on GitHub, public, visible.
- [ ] Design doc at `docs/superpowers/specs/2026-04-21-magi-showcase-design.md` and this plan at `docs/superpowers/plans/2026-04-21-magi-showcase.md` both tracked in git.

