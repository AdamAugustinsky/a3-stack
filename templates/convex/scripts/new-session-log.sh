#!/usr/bin/env bash
set -euo pipefail

if [[ ${1:-} == "" ]]; then
  echo "Usage: $(basename "$0") \"topic\""
  exit 1
fi

topic="$1"

date_str="$(date +%Y-%m-%d)"
slug="$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g')"

if [[ "$slug" == "" ]]; then
  echo "Topic produced an empty slug. Use a different topic."
  exit 1
fi

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
log_dir="$root/docs/ai/sessions"
file="$log_dir/${date_str}-${slug}.md"

mkdir -p "$log_dir"

template="$log_dir/_template.md"
if [[ ! -f "$template" ]]; then
  echo "Missing template: $template"
  exit 1
fi

if [[ -f "$file" ]]; then
  echo "Session log already exists: $file"
  exit 0
fi

sed "s/^# YYYY-MM-DD - Topic/# ${date_str} - ${topic}/" "$template" > "$file"

echo "Created $file"
