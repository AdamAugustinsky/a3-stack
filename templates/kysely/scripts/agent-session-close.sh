#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") \"<absolute_log_path>\" --tier L1|L2|L3"
}

log_path=""
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
      if [[ -z "$log_path" ]]; then
        log_path="$1"
      else
        echo "Unexpected extra argument: $1"
        usage
        exit 1
      fi
      ;;
  esac
  shift
done

if [[ "$tier" != "L1" && "$tier" != "L2" && "$tier" != "L3" ]]; then
  echo "Invalid tier: $tier (expected L1, L2, or L3)"
  exit 1
fi

if [[ "$tier" == "L3" ]]; then
  echo "Tier L3 selected: no session log validation required."
  echo "Memory update: add none unless an unexpected issue was discovered."
  exit 0
fi

if [[ -z "$log_path" ]]; then
  usage
  exit 1
fi

if [[ "$log_path" != /* ]]; then
  echo "Pass an absolute log path."
  exit 1
fi

if [[ ! -f "$log_path" ]]; then
  echo "Log file not found: $log_path"
  exit 1
fi

declare -a missing_sections=()

require_section() {
  local section="$1"
  if ! rg -q "^##[[:space:]]+$section[[:space:]]*$" "$log_path"; then
    missing_sections+=("$section")
  fi
}

if [[ "$tier" == "L1" ]]; then
  require_section "Goal"
  require_section "Constraints"
  require_section "Actions"
  require_section "Outcomes"
  require_section "Follow-ups"
else
  require_section "Goal"
  require_section "Files touched"
  require_section "Checks run"
  require_section "Outcome"
  require_section "Memory candidate"
fi

if (( ${#missing_sections[@]} > 0 )); then
  echo "Missing required sections for $tier:"
  for section in "${missing_sections[@]}"; do
    echo "- $section"
  done
  exit 1
fi

memory_choice=""
if [[ "$tier" == "L2" ]]; then
  memory_block="$(awk '
    /^##[[:space:]]+Memory candidate[[:space:]]*$/ { in_block=1; next }
    /^##[[:space:]]+/ { in_block=0 }
    in_block { print }
  ' "$log_path")"
  memory_choice_line="$(echo "$memory_block" | rg -i '^[[:space:]]*-[[:space:]]*yes/no[[:space:]]*:[[:space:]]*' | head -n 1 || true)"
  memory_choice="$(echo "$memory_choice_line" | sed -E 's/^[[:space:]]*-[[:space:]]*yes\/no[[:space:]]*:[[:space:]]*//I' | tr '[:upper:]' '[:lower:]' | xargs || true)"

  if [[ "$memory_choice" != "yes" && "$memory_choice" != "no" ]]; then
    echo "L2 requires an explicit Memory candidate value:"
    echo "- yes/no: yes"
    echo "or"
    echo "- yes/no: no"
    exit 1
  fi
fi

echo "Log validation passed for $tier: $log_path"

if [[ "$tier" == "L1" ]]; then
  echo "Memory action: add up to 3 durable lessons to .agents/MEMORY.md."
  echo "Promote recurring lessons to .agents/skills/README.md or playbook updates."
else
  if [[ "$memory_choice" == "yes" ]]; then
    echo "Memory action: add up to 1 durable lesson to .agents/MEMORY.md."
  else
    echo "Memory action: no durable lesson update required."
  fi
fi
