#!/usr/bin/env bash
# Decides which groups of packages a push can affect, and writes the answer to
# $GITHUB_OUTPUT.
#
# A group's tests run when the change touched that group's own folder, or touched eng/ or
# the top-level config that every group depends on. A documentation-only change turns
# everything off, so a README fix does not spend twenty minutes proving that the Windows
# registry bindings still work.
set -euo pipefail

if [ "${EVENT_NAME:-}" = "pull_request" ]; then
  BASE="origin/${BASE_REF}"
else
  BASE="${BEFORE:-}"
fi

# A branch's first push has no parent to compare against. Treat it as changing everything
# rather than trusting a filter to guess.
FIRST_PUSH=false
if [ -z "$BASE" ] || [ "$BASE" = "0000000000000000000000000000000000000000" ]; then
  FIRST_PUSH=true
  BASE="$(git rev-list --max-parents=0 HEAD)"
fi

CHANGED=""
if [ "$FIRST_PUSH" = false ]; then
  CHANGED="$(git diff --name-only "$BASE" HEAD)"
fi

# Top-level files every group depends on: the shared tooling, the workspace layout, the
# lint and format rules, and the CI definitions themselves. A change to a workflow has to
# run everything, otherwise a new path filter could skip the very push that introduced it.
REPO_PATTERN='^(eng/|\.github/|deno\.json$|deno\.lock$|package\.json$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|\.oxlintrc\.json$|\.editorconfig$|\.gitattributes$|\.gitignore$|LICENSE)'

# Documentation only. Anything else counts as a real change.
DOCS_PATTERN='(^|/)(README|LICENSE|CHANGELOG|CONTRIBUTING|SECURITY)\.md$'

emit() { echo "$1=$2" >>"$GITHUB_OUTPUT"; }

for group in std crypto os; do emit "$group" false; done
emit repo false
emit any false

if [ "$FIRST_PUSH" = true ]; then
  for group in std crypto os; do emit "$group" true; done
  emit repo true
  emit any true
  exit 0
fi

ANY=false
REPO=false
DOCS_ONLY=true

while IFS= read -r file; do
  [ -n "$file" ] || continue
  if printf '%s' "$file" | grep -Eq "$DOCS_PATTERN"; then
    continue
  fi
  DOCS_ONLY=false
  ANY=true
  if printf '%s' "$file" | grep -Eq "$REPO_PATTERN"; then
    REPO=true
  fi
  for group in std crypto os; do
    case "$file" in
      "$group"/*) emit "$group" true ;;
    esac
  done
done <<<"$CHANGED"

if [ "$DOCS_ONLY" = true ]; then
  ANY=false
  REPO=false
  for group in std crypto os; do emit "$group" false; done
fi

# Shared tooling or top-level config can affect any group, so turn everything on.
if [ "$REPO" = true ]; then
  for group in std crypto os; do emit "$group" true; done
fi

emit repo "$REPO"
emit any "$ANY"
