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
pnpm -C "$ALTERA" --filter "@magi/*" run build

mkdir -p "$SHOWCASE_ROOT/vendor"
rm -f "$SHOWCASE_ROOT/vendor/magi-"*.tgz

for pkg in core sdk widget; do
	echo "[pack-sdk] packing @magi/$pkg"
	(cd "$ALTERA/packages/$pkg" && pnpm pack --pack-destination "$SHOWCASE_ROOT/vendor")
done

# Patch the widget tarball: tsup's --loader .css=copy emits hashed CSS
# (styles-HASH.css) and does not emit src/themes/*.css at all, but the
# widget's package.json exports declare ./styles.css and
# ./themes/altera-dark.css as stable subpaths. Create those stable
# aliases inside the tarball so consumers can import the paths the
# exports field actually advertises. Remove once the widget build in
# altera-app emits these files itself.
echo "[pack-sdk] patching widget tarball (adding stable CSS entry points)"
WIDGET_TGZ="$(ls "$SHOWCASE_ROOT/vendor/magi-widget-"*.tgz)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"; git -C "$ALTERA" checkout -q "$ORIGINAL_BRANCH" || true' EXIT
tar -xzf "$WIDGET_TGZ" -C "$WORK"
HASHED_CSS="$(ls "$WORK/package/dist/"styles-*.css 2>/dev/null | head -1 || true)"
if [[ -z "$HASHED_CSS" ]]; then
	echo "error: widget tarball contains no dist/styles-*.css" >&2
	exit 1
fi
cp "$HASHED_CSS" "$WORK/package/dist/styles.css"
mkdir -p "$WORK/package/dist/themes"
cp "$ALTERA/packages/widget/src/themes/altera-dark.css" \
	"$WORK/package/dist/themes/altera-dark.css"
(cd "$WORK" && tar -czf "$WIDGET_TGZ" package)

echo "[pack-sdk] vendor/ contents:"
ls -la "$SHOWCASE_ROOT/vendor/"

echo "[pack-sdk] done. Review 'git status' in the showcase repo and commit."
