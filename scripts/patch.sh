#!/usr/bin/env bash
# Applies the DSH host patch to a deepseek-harness source checkout.
#
# Usage:
#   scripts/patch.sh <deepseek-harness-checkout> [--patch <path>]
#
# The patch applies to a checkout at the pinned baseline snapshot that
# lacks the host wiring; a tree that already contains the wiring is
# detected (reverse apply succeeds) and skipped. The patch path comes
# from patches/host-patch.config.json when present; --patch overrides it.
# The bundle itself installs through the official plugin channel
# (`dsh plugin --profile <p> add <spec>`); this script only applies the
# host seams.
set -euo pipefail

HARNESS="${1:?usage: scripts/patch.sh <deepseek-harness-checkout> [--patch <path>]}"
shift
PATCH=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --patch) PATCH="${2:?--patch needs a value}"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$REPO_ROOT/patches/host-patch.config.json"

if [ -z "$PATCH" ] && [ -f "$CONFIG" ]; then
  PATCH="$(node -e "const c=require(process.argv[1]);process.stdout.write(c.out??'')" "$CONFIG" 2>/dev/null || true)"
  [ -n "$PATCH" ] && PATCH="$REPO_ROOT/$PATCH"
fi
if [ -z "$PATCH" ]; then
  echo "error: no patch path — pass --patch <path> or set out in $CONFIG" >&2
  exit 1
fi

if ! git -C "$HARNESS" rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: $HARNESS is not a git checkout" >&2
  exit 1
fi

if git -C "$HARNESS" apply --check -R "$PATCH" 2>/dev/null; then
  echo "host already contains the wiring — nothing to apply"
  exit 0
fi

if ! git -C "$HARNESS" apply --check "$PATCH"; then
  echo "error: $PATCH neither applies nor reverses onto $HARNESS" >&2
  echo "expected a deepseek-harness checkout at the pinned baseline snapshot without the host wiring" >&2
  exit 1
fi

git -C "$HARNESS" apply "$PATCH"
echo "applied $PATCH to $HARNESS"
