# Magi SDK showcase

Single-page showcase for the [VSC crosschain SDK](https://github.com/vsc-eco/crosschain-sdk) — an embeddable cross-chain swap widget for HIVE, HBD, and BTC on the Magi (VSC) DEX.

**Intended host:** [magisdk.okinoko.io](https://magisdk.okinoko.io) *(not yet routed)*.

## Status: pre-npm

The `@vsc.eco/crosschain-*` packages this site depends on are not yet published to npm. Until they are, the showcase consumes them as tarballs under `vendor/`, packed directly from [`vsc-eco/crosschain-sdk` `main`](https://github.com/vsc-eco/crosschain-sdk).

`vendor/*.tgz` is **committed** to this repo so fresh clones install with no extra steps.

## Run it

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm build         # static output in dist/
pnpm test          # vitest + jsdom
```

## Refresh the SDK

When `crosschain-sdk`'s `main` branch advances:

```bash
pnpm refresh-sdk   # alias of scripts/pack-sdk.sh
```

This:
1. Fetches `main` into your local crosschain-sdk checkout (default: `../crosschain-sdk`; override with `MAGI_SDK_PATH=/path/to/crosschain-sdk`).
2. Rebuilds `@vsc.eco/crosschain-core`, `@vsc.eco/crosschain-sdk`, `@vsc.eco/crosschain-widget`.
3. Replaces `vendor/*.tgz` with fresh tarballs.
4. Patches the widget tarball with `dist/styles.css` and `dist/themes/altera-dark.css` entry points that the widget's current tsup build doesn't emit directly.
5. Restores crosschain-sdk to the branch you were on.

Then `git status` → commit the three changed tarballs.

## Snippets workflow

`src/snippets/*` are the canonical integration examples. `SNIPPETS.md` is **generated** from those files:

```bash
pnpm sync-snippets         # regenerate SNIPPETS.md
pnpm sync-snippets --check # CI mode; fails if out of sync
```

Edit the `.tsx`/`.ts`/`.html` snippet sources — never edit code blocks in `SNIPPETS.md` directly. The `tests/sync.test.ts` test fails if someone forgets.

## Layout

- `src/sections/` — Hero, Features, LiveWidget, Integrate, Footer.
- `src/snippets/` — canonical snippet sources; rendered on-page via `vite-plugin-shiki.ts` and into `SNIPPETS.md` via `sync-snippets`.
- `src/aioha.ts` — Aioha factory (Keychain, HiveSigner, HiveAuth).
- `scripts/pack-sdk.sh` — SDK tarball refresh.
- `scripts/sync-snippets.ts` — `SNIPPETS.md` generation.

## Migration to npm

When `@vsc.eco/crosschain-*` ships to npm:

1. Replace `file:vendor/vsc.eco-crosschain-*.tgz` in `package.json` with real version ranges.
2. Delete `vendor/` and `scripts/pack-sdk.sh`.
3. Drop the `pack-sdk`, `refresh-sdk`, and `pnpm.overrides` block from `package.json`.
4. Update this README's "Status" section.

## License

MIT.
