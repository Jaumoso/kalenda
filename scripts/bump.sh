#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/bump.sh <patch|minor|major> [--dry-run]
# Bumps version in all package.json files, commits, tags, and pushes.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUMP_TYPE="${1:-}"
DRY_RUN=false
[[ "${2:-}" == "--dry-run" ]] && DRY_RUN=true

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Usage: $0 <patch|minor|major> [--dry-run]${NC}"
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
