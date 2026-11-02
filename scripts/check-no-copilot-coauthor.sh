#!/bin/sh

set -eu

commit_message_file=${1:-}

if [ -z "$commit_message_file" ] || [ ! -f "$commit_message_file" ]; then
  echo "Unable to inspect the commit message." >&2
  exit 1
fi

if grep -Eiq '^[[:space:]]*co-authored-by:.*copilot' "$commit_message_file"; then
  echo "Commit blocked: Co-authored-by trailers mentioning Copilot are not allowed." >&2
  exit 1
fi
