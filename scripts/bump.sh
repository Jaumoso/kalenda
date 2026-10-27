#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/bump.sh <patch|minor|major> [--prerelease <label>] [--dry-run]
# Bumps version in all package.json files, commits, tags, and pushes.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUMP_TYPE="${1:-}"
DRY_RUN=false
PRERELEASE=""

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --prerelease)
      if [[ -z "${2:-}" || "${2}" == -* || ! "${2}" =~ ^[0-9A-Za-z-]+([.][0-9A-Za-z-]+)*$ ]]; then
        echo -e "${RED}Error: --prerelease requires a valid SemVer prerelease label.${NC}"
        exit 1
      fi
      PRERELEASE="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Usage: $0 <patch|minor|major> [--prerelease <label>] [--dry-run]${NC}"
  exit 1
fi

# Stable releases must come from main. Development releases must be explicitly
# marked as prereleases so they cannot be mistaken for production versions.
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" == "main" && -n "$PRERELEASE" ]]; then
  echo -e "${RED}Error: stable production releases from main cannot use --prerelease.${NC}"
  exit 1
fi
if [[ "$BRANCH" == "dev" && -z "$PRERELEASE" ]]; then
  echo -e "${RED}Error: releases from dev must use --prerelease <label>.${NC}"
  exit 1
fi
if [[ "$BRANCH" != "main" && "$BRANCH" != "dev" ]]; then
  echo -e "${RED}Error: releases can only be created from main or dev (current: $BRANCH).${NC}"
  exit 1
fi

# Ensure working tree is clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo -e "${RED}Error: Working tree is not clean. Commit or stash changes first.${NC}"
  exit 1
fi

# Read current version from root package.json
CURRENT=$(node -p "require('./package.json').version")
echo -e "Current version: ${YELLOW}v${CURRENT}${NC}"

# Calculate next version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac
NEXT="${MAJOR}.${MINOR}.${PATCH}"
[[ -n "$PRERELEASE" ]] && NEXT="${NEXT}-${PRERELEASE}"
echo -e "Next version:    ${GREEN}v${NEXT}${NC}"

if $DRY_RUN; then
  echo -e "${YELLOW}[dry-run] No changes made.${NC}"
  exit 0
fi

# Update all package.json files
FILES=(
  package.json
  apps/backend/package.json
  apps/frontend/package.json
  packages/shared/package.json
)

for f in "${FILES[@]}"; do
  if [[ -f "$f" ]]; then
    # Use node to update version preserving formatting
    node -e "
      const fs = require('fs');
      const raw = fs.readFileSync('$f', 'utf8');
      const updated = raw.replace(/\"version\":\s*\"[^\"]+\"/, '\"version\": \"${NEXT}\"');
      fs.writeFileSync('$f', updated);
    "
    echo "  Updated $f"
  fi
done

# Commit and tag
git add -A
git commit -m "release: v${NEXT}"
git tag -a "v${NEXT}" -m "release: v${NEXT}"

echo ""
echo -e "${GREEN}✓ Bumped to v${NEXT}${NC}"
echo ""
echo "To publish, run:"
echo -e "  ${YELLOW}git push && git push origin v${NEXT}${NC}"
if [[ -n "$PRERELEASE" ]]; then
  echo -e "  ${YELLOW}gh release create v${NEXT} --prerelease${NC}"
else
  echo -e "  ${YELLOW}gh release create v${NEXT}${NC}"
fi
