#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") \"topic\" --tier L1|L2|L3"
}

topic=""
tier="L1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tier)
      shift
      tier="${1:-}"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --*)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
    *)
      if [[ -z "$topic" ]]; then
        topic="$1"
      else
        echo "Unexpected extra argument: $1"
        usage
        exit 1
      fi
      ;;
  esac
  shift
done

if [[ -z "$topic" ]]; then
  usage
  exit 1
fi

if [[ "$tier" != "L1" && "$tier" != "L2" && "$tier" != "L3" ]]; then
  echo "Invalid tier: $tier (expected L1, L2, or L3)"
  exit 1
fi

if [[ "$tier" == "L3" ]]; then
  echo "Tier L3 selected: no session log required."
  echo "Use L3 only for trivial non-behavior edits in one file."
  exit 0
fi

slug="$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-|-$//g')"
if [[ -z "$slug" ]]; then
  echo "Topic produced an empty slug. Use a different topic."
  exit 1
fi

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
log_dir="$root/docs/ai/sessions"
date_str="$(date +%Y-%m-%d)"
file="$log_dir/${date_str}-${slug}.md"

mkdir -p "$log_dir"

if [[ -f "$file" ]]; then
  echo "Session log already exists: $file"
  echo "Tier: $tier"
  exit 0
fi

if [[ "$tier" == "L1" ]]; then
  template="$log_dir/_template.md"
  if [[ ! -f "$template" ]]; then
    echo "Missing template: $template"
    exit 1
  fi
  cp "$template" "$file"
else
  cat > "$file" <<'EOF'
# Session Log

## Goal

## Files touched

## Checks run

## Outcome

## Memory candidate
- yes/no:
- candidate lesson (optional):
EOF
fi

echo "Created $file"
echo "Tier: $tier"
echo "Close with: scripts/agent-session-close.sh \"$file\" --tier $tier"
