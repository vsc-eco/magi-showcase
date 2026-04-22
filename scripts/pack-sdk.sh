#!/usr/bin/env bash
# Rebuild @vsc.eco/crosschain-{core,sdk,widget} from crosschain-sdk's main
# branch and refresh vendor/*.tgz tarballs in this repo.
#
# Usage:
#   bash scripts/pack-sdk.sh
#   MAGI_SDK_PATH=/path/to/crosschain-sdk bash scripts/pack-sdk.sh
set -euo pipefail

SHOWCASE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="${MAGI_SDK_PATH:-$SHOWCASE_ROOT/../crosschain-sdk}"
BRANCH="main"

if [[ ! -d "$SDK/.git" ]]; then
	echo "error: crosschain-sdk not found at $SDK" >&2
	echo "set MAGI_SDK_PATH to override" >&2
	exit 1
fi

echo "[pack-sdk] crosschain-sdk: $SDK"
echo "[pack-sdk] branch:         $BRANCH"

# Preserve the user's current branch — don't leave crosschain-sdk checked out
# to main after we're done.
ORIGINAL_BRANCH="$(git -C "$SDK" rev-parse --abbrev-ref HEAD)"
trap 'git -C "$SDK" checkout -q "$ORIGINAL_BRANCH" || true' EXIT

git -C "$SDK" fetch origin "$BRANCH"
git -C "$SDK" checkout -q "$BRANCH"
# Fast-forward only — never clobber local work on this branch.
git -C "$SDK" merge --ff-only "origin/$BRANCH" || {
	echo "error: $BRANCH in crosschain-sdk has diverged from origin" >&2
	echo "resolve manually before running pack-sdk" >&2
	exit 1
}

echo "[pack-sdk] installing crosschain-sdk packages/*"
pnpm -C "$SDK" install --frozen-lockfile=false

echo "[pack-sdk] building @vsc.eco/crosschain-{core,sdk,widget}"
pnpm -C "$SDK" --filter "@vsc.eco/crosschain-*" run build

mkdir -p "$SHOWCASE_ROOT/vendor"
rm -f "$SHOWCASE_ROOT/vendor/vsc.eco-crosschain-"*.tgz
# Also remove legacy @magi/* tarballs from previous layout, in case a
# stale checkout still has them committed.
rm -f "$SHOWCASE_ROOT/vendor/magi-"*.tgz

for pkg in core sdk widget; do
	echo "[pack-sdk] packing @vsc.eco/crosschain-$pkg"
	(cd "$SDK/packages/$pkg" && pnpm pack --pack-destination "$SHOWCASE_ROOT/vendor")
done

# Patch the widget tarball: tsup's --loader .css=copy emits hashed CSS
# (styles-HASH.css) and does not emit src/themes/*.css at all, but the
# widget's package.json exports declare ./styles.css and
# ./themes/altera-dark.css as stable subpaths. Create those stable
# aliases inside the tarball so consumers can import the paths the
# exports field actually advertises. Remove once the widget build in
# crosschain-sdk emits these files itself.
echo "[pack-sdk] patching widget tarball (adding stable CSS entry points)"
WIDGET_TGZ="$(ls "$SHOWCASE_ROOT/vendor/vsc.eco-crosschain-widget-"*.tgz)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"; git -C "$SDK" checkout -q "$ORIGINAL_BRANCH" || true' EXIT
tar -xzf "$WIDGET_TGZ" -C "$WORK"
HASHED_CSS="$(ls "$WORK/package/dist/"styles-*.css 2>/dev/null | head -1 || true)"
if [[ -n "$HASHED_CSS" ]]; then
	cp "$HASHED_CSS" "$WORK/package/dist/styles.css"
elif [[ ! -f "$WORK/package/dist/styles.css" ]]; then
	echo "error: widget tarball contains no dist/styles.css or dist/styles-*.css" >&2
	exit 1
fi
mkdir -p "$WORK/package/dist/themes"
cp "$SDK/packages/widget/src/themes/altera-dark.css" \
	"$WORK/package/dist/themes/altera-dark.css"
(cd "$WORK" && tar -czf "$WIDGET_TGZ" package)

echo "[pack-sdk] vendor/ contents:"
ls -la "$SHOWCASE_ROOT/vendor/"

echo "[pack-sdk] done. Review 'git status' in the showcase repo and commit."
