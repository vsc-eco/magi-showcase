# Magi SDK Showcase — Design

**Date:** 2026-04-21
**Status:** Approved, pending implementation plan
**Repo:** `tibfox/magi-showcase` (to be created), local path `/home/dockeruser/okinoko/magi-showcase/`

## Summary

A single-page marketing/showcase website for the Magi SDK (the three
`@magi/*` packages added to `vsc-eco/altera-app` on the `feature/magi-sdk`
branch in commit 5cdbfa3). The page embeds a live `<MagiQuickSwap>` against
mainnet, surfaces copy-pasteable integration snippets for the four modes
(React, web component, SDK-only, BTC deposit), and doubles as
documentation — no separate docs site. Separately maintained `SNIPPETS.md`
is generated from the same snippet source files so doc and page cannot
drift.

The SDK itself is **not** extracted from altera-app; the showcase consumes
it via `pnpm pack`-produced tarballs committed to `vendor/` until the
packages are published to npm.

## Goals

- Give integrators (Keychain, Peakd, Ecency, custom frontends) a public URL
  that shows the widget running against mainnet with ready-to-copy code.
- Prove the 4 integration modes work end-to-end from a clean consumer
  project, not just inside altera-app.
- Be deployable as a static site today, without waiting for npm publishing.
- Keep the snippet documentation type-checked and smoke-tested so it
  cannot silently drift from the SDK surface.

## Non-goals

- Extracting `@magi/*` from altera-app into its own repo (considered and
  deferred — see "Rejected alternatives").
- Publishing `@magi/*` to npm (prerequisite for eventual steady-state, but
  out of scope here).
- Full docs site with search/versioning — showcase page + `SNIPPETS.md` is
  the doc surface.
- Multi-page routing, SSR, SEO beyond a basic `<title>` and og image.
- Analytics, cookie banner, i18n, testnet switcher.
- E2E tests that execute real swaps (requires funded wallet — manual only).
- Any modification to altera-app or the SDK itself; bugs get logged, not
  fixed here.

## Architecture

```
magi-showcase/                            new repo
├── docs/superpowers/specs/…              this file + future specs
├── vendor/
│   ├── magi-core-*.tgz                   committed tarballs, output of
│   ├── magi-sdk-*.tgz                    `pnpm pack` in altera-app's
│   └── magi-widget-*.tgz                 packages/* on feature/magi-sdk
├── scripts/pack-sdk.sh                   rebuilds + repacks + updates vendor
├── src/
│   ├── main.tsx                          app entry
│   ├── App.tsx                           hero + features + widget + integrate + footer
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── LiveWidget.tsx                Aioha wiring + <MagiQuickSwap>
│   │   ├── Integrate.tsx                 tabbed snippet viewer
│   │   └── Footer.tsx
│   ├── snippets/                         canonical snippet source
│   │   ├── react-basic.tsx
│   │   ├── webcomponent.html
│   │   ├── sdk-only.ts
│   │   └── btc-deposit.ts
│   ├── vite-plugin-shiki.ts              static syntax highlighting at build time
│   └── styles.css                        page chrome using widget's CSS vars
├── tests/
│   ├── snippets.test.ts                  jsdom smoke renders
│   ├── sync.test.ts                      SNIPPETS.md <-> src/snippets/ parity
│   └── build.test.ts                     pnpm build end-to-end
├── SNIPPETS.md                           hand-written prose, generated snippets
├── README.md                             status, setup, refresh workflow
├── index.html
├── package.json                          deps: file:vendor/*.tgz
├── vite.config.ts
├── tsconfig.json
└── vitest.config.ts
```

Data flow on the live widget section:

```
user opens page
  → Aioha auto-loadAuth() on mount (restores prior login if any)
  → [user clicks Connect] → provider picker → username prompt → login(posting key)
  → <MagiQuickSwap aioha=... username=... keyType=Active />
     → widget auto-queries Hive L1 balance
     → widget pulls pool reserves from api.vsc.eco
     → user inputs amount → preview math runs locally (@magi/core)
     → [user clicks Swap] → widget builds ops via @magi/sdk
       → aioha.signAndBroadcast with active key
       → onSuccess(txId) → toast + log
```

## Tech stack

- **Vite 5 + React 18 + TypeScript 5, strict mode.** Version-pinned to
  match `examples/demo/` in the SDK commit so we don't fight hoist
  conflicts.
- **Package manager: pnpm.** Consistent with altera-app and the SDK
  monorepo. `file:` deps on tarballs work cleanly under pnpm.
- **Styling: hand-written CSS.** The widget exposes `--magi-*` CSS custom
  properties; page chrome reuses them so the whole page reads as one
  visual. Import `@magi/widget/themes/altera-dark.css` at the root.
- **Syntax highlighting: Shiki at build time** via a small custom Vite
  plugin. Reads `src/snippets/*` as `?raw` strings, emits highlighted
  HTML. Zero client-side JS for highlighting. Fallback if Shiki wiring
  is painful: plain `<pre>` + CSS, revisit later.
- **Testing: vitest + jsdom + @testing-library/react.**
- **License: MIT.**

## SDK consumption

The SDK lives on `vsc-eco/altera-app` branch `feature/magi-sdk`. Until it
is published to npm, the showcase consumes it via tarballs.

**`scripts/pack-sdk.sh`:**

1. Accept optional altera-app path (default: `../altera-app`, env override
   `MAGI_SDK_PATH`).
2. `git -C $ALTERA fetch && git -C $ALTERA checkout feature/magi-sdk`.
3. `pnpm -C $ALTERA install && pnpm -C $ALTERA -r --filter "./packages/*" build`.
4. For each of `core`, `sdk`, `widget`: `pnpm pack` → move `.tgz` to
   `<showcase>/vendor/magi-<pkg>-<version>.tgz`. Filename is stable across
   same-version rebuilds (pnpm pack doesn't salt), so idempotent.
5. Rewrite `package.json` deps to point at the new tarball filenames if
   versions changed.
6. Print a summary of what changed.

**`vendor/*.tgz` is committed.** Fresh clones work without running the
pack script. Trade-off: ~200KB committed per refresh. Acceptable for
pre-npm phase.

**Refresh workflow:** `pnpm refresh-sdk` → script runs → `git status`
shows changed tarballs → commit. One command per update.

**Peer deps / duplicate React risk:** `@magi/widget` declares `react` and
`react-dom` as peers. Showcase provides them. Pack script verifies
altera-app's React version matches the showcase's; if not, fails loudly
rather than producing a broken tarball. Vitest `resolve.alias` points
react/react-dom at the showcase's copy to prevent jsdom loading two
copies.

**Migration to npm:** when `@magi/*` is published, one PR: swap
`file:vendor/*.tgz` for real version ranges, delete `vendor/`, delete
`scripts/pack-sdk.sh`, delete `pnpm refresh-sdk` script.

## Page structure

Single column, max-width ~960px, altera-dark palette applied globally.

### 1. Hero

- Magi logo (reuse `packages/widget/src/assets/magi.svg`).
- Tagline: "Embeddable cross-chain swap widget for Hive → BTC."
- One CTA: "Try it ↓" → smooth-scroll to the widget section.
- No hero art beyond the logo.

### 2. Features strip

Three cards, side by side on desktop, stacked on mobile:

- **6 swap paths** — HIVE/HBD/BTC mainnet-to-mainnet, routed via Magi L2
  internally. User never sees the L2.
- **4 integration modes** — React / Web Component / SDK-only / BTC
  deposit. Links jump to the matching Integrate tab.
- **Zero config** — neutral defaults, pool-derived USD prices, auto
  L1 balance queries, CSS-variable theming.

### 3. Live widget

- Small connection bar: wallet status, Connect/Disconnect button, username
  display.
- `<MagiQuickSwap aioha={a} username={u} keyType={KeyTypes.Active} />`.
- Small caveat below: "This widget operates on mainnet. Swaps are real."

Aioha registered providers: at minimum `keychain`, `hiveSigner`, `hiveAuth`
(matches `examples/demo/main.tsx`). Add `peakVault` and `ledger` if the
altera-app setup registers them and they drop in without extra config —
verify by reading altera-app's Aioha init during implementation. Login
with `KeyTypes.Posting`; widget re-signs with active at swap time
(pattern documented in `AIOHA_ACTIVE_SIGNING_GUIDE.md`). Persists via
`aioha.loadAuth()`.

### 4. Integrate

Tabbed section, four tabs:

- **React** — `react-basic.tsx` source, imports `@magi/widget`, shows
  `<MagiQuickSwap>` with Aioha. Prose: when to pick this mode, key props,
  common pitfalls.
- **Web Component** — `webcomponent.html` source. Prose: object props
  must be set as JS properties not HTML attributes (the pitfall buried in
  the SDK README).
- **SDK-only** — `sdk-only.ts` source using `createMagi()` +
  `buildQuickSwap()`. Prose: when to bring your own signer.
- **BTC deposit** — `btc-deposit.ts` source using
  `getBtcDepositAddress()`. Prose: no wallet connection needed, mapping
  bot handles delivery.

Snippet bodies come from `import src from './snippets/react-basic.tsx?raw'`
— the literal bytes tsc validated. Each tab has a "Copy" button.

### 5. Footer

Links:
- altera-app source (GitHub)
- SDK README on GitHub (anchor to the `feature/magi-sdk` README)
- Referral fee section (anchor in this page or to the README)
- "Built on Magi (VSC)" line, no logo needed

## Snippets system (single source of truth)

Problem: documentation snippets drift from reality the moment the SDK
changes. Solution: snippets are real, type-checked files; both the page
and `SNIPPETS.md` consume those files verbatim.

- **`src/snippets/*` are canonical.** Each file compiles (strict tsc, or
  for HTML: mounted in jsdom). No other form of the snippet exists.
- **On-page rendering:** Vite `?raw` import → string → Shiki highlight →
  `<pre>` in the DOM.
- **`SNIPPETS.md` generation:** `scripts/sync-snippets.ts` reads each
  source file, splices it into `SNIPPETS.md` between named markers
  (`<!-- snippet:react-basic -->` … `<!-- /snippet:react-basic -->`).
  Prose between markers is hand-written and preserved.
- **Check mode:** `pnpm sync-snippets --check` runs the same generation
  into a buffer, compares against on-disk `SNIPPETS.md`, exits non-zero
  if different. Wired as a vitest test so `pnpm test` catches drift.
- **Update flow:** edit a `.tsx` snippet → `pnpm sync-snippets` →
  `SNIPPETS.md` updates → commit both.

## Testing

Scope: level 1 (compiles) + level 2 (smoke renders / sanity). Level 3
(real swaps) is manual only.

### `tests/snippets.test.ts`

One `describe` block per snippet.

- **React snippets** (`react-basic.tsx`): render into jsdom with a mocked
  Aioha instance. Assert the widget mounts, root element is present, no
  thrown errors. Mocked Aioha exposes the methods the widget calls
  (`getCurrentUser`, `signAndBroadcast`, etc.) — minimal mock, not a full
  stub.
- **Web component** (`webcomponent.html`): import
  `@magi/widget/webcomponent`, assert `customElements.get('magi-quickswap')`
  returns a constructor. Set `aioha`, `username`, `keyType` as JS
  properties; assert `shadowRoot` or equivalent mounts.
- **SDK-only** (`sdk-only.ts`): mock `fetch` with a known pool reserve
  response, call `createMagi().buildQuickSwap(...)`, assert the returned
  `ops` array has the expected shape (transfer op + custom_json op, each
  with expected `id` and `json`).
- **BTC deposit** (`btc-deposit.ts`): mock mapping bot endpoint with a
  known response, call `getBtcDepositAddress(...)`, assert address and
  ttl fields present.

### `tests/sync.test.ts`

Runs `pnpm sync-snippets --check` as a subprocess. Fails if `SNIPPETS.md`
is out of sync with `src/snippets/*`.

### `tests/build.test.ts`

Runs `pnpm build` end-to-end. Asserts exit 0 and `dist/` contains
`index.html` and at least one JS bundle. Catches Vite plugin failures,
broken imports, tsc errors that slip past editor type-checking. Slower
(~5–10s) but only one test.

### Explicitly not tested

- Real swaps (requires funded wallet, burning real funds).
- Live pool state correctness (that's altera-app's concern).
- Aioha provider handshake end-to-end (requires real wallet extensions).
- Visual regression / screenshot diffs.

## Deployment

- Static build: `pnpm build` → `dist/`.
- Host: TBD at deploy time. Any static host works.
- **Risk:** hosts that run `pnpm install` themselves need to see
  `vendor/*.tgz` in the repo. Since we commit tarballs, this should work.
  Must verify with one real deploy before declaring solid.
- **No steady-state deploy until `@magi/*` is on npm.** Committed
  tarballs work but are load-bearing in a way that looks rough to anyone
  inspecting the repo.

## Rejected alternatives

- **Extract `@magi/*` into its own repo now.** Discussed as option A in
  brainstorming. Rejected — user wants to keep SDK in altera-app for now.
  Can revisit when npm publishing becomes a priority.
- **Astro or Next.js for the site.** Rejected — single-page React
  consumer, Astro/Next don't earn their complexity. Vite + React
  mirrors the proven `examples/demo/`.
- **Pull in Tailwind / shadcn.** Rejected — four page sections, widget's
  CSS vars already provide the palette. Hand-written CSS is less
  machinery than another dep.
- **`postinstall`-based SDK pack (don't commit tarballs).** Rejected —
  requires every cloner to have altera-app checked out at the right
  branch. Breaks CI and static host builds.
- **pnpm workspace linking across both repos.** Rejected — great for
  local iteration but static hosts can't resolve cross-repo symlinks.

## Open questions / risks

- **Shiki at build time.** First time wiring this for the project. If
  the Vite plugin turns into yak-shaving, fall back to plain `<pre>` +
  CSS and revisit. Not on the critical path.
- **React version skew between altera-app and showcase.** Mitigated by
  pack script check + vitest aliases, but the failure mode ("invalid
  hook call") is hostile. Worth verifying with one deliberate
  version-mismatch test during implementation.
- **First real deploy.** Until we actually push the tarball-based build
  through a static host, "deploy works" is an assumption.
- **Mainnet exposure.** Live widget means any visitor with a wallet can
  swap real funds. Matches `examples/demo/` behavior. User is fine with
  this, no gate.

## Migration path (when `@magi/*` lands on npm)

Single PR:

1. Replace `file:vendor/magi-core-*.tgz` → `"@magi/core": "^0.1.0"` (etc.)
2. `rm -rf vendor/`
3. `rm scripts/pack-sdk.sh`
4. Remove `refresh-sdk` and `pack-sdk` scripts from `package.json`.
5. Update README's "Status" banner from "pre-npm" to a normal overview.

Estimated diff: ~20 lines. Plan for it but don't build it now.
