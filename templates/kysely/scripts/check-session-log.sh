#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
log_dir="$root/docs/ai/sessions"

date_str="$(date +%Y-%m-%d)"
pattern="$log_dir/${date_str}-*.md"

if [[ ! -d "$log_dir" ]]; then
  echo "Reminder: session log directory missing. Expected: $log_dir"
  echo "Create a log with: scripts/new-session-log.sh \"topic\""
  exit 0
fi

if compgen -G "$pattern" > /dev/null; then
  exit 0
fi

echo "Reminder: no session log for ${date_str}."
echo "Create one with: scripts/new-session-log.sh \"topic\""
exit 0
