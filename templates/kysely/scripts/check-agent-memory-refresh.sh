#!/usr/bin/env bash
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
log_dir="$root/docs/ai/sessions"
memory_file="$root/.agents/MEMORY.md"

if [[ ! -d "$log_dir" ]]; then
  echo "Reminder: session log directory missing. Expected: $log_dir"
  echo "Create it or skip this reminder if logs are intentionally disabled."
  exit 0
fi

latest_log="$(ls -1t "$log_dir"/20??-??-??-*.md 2>/dev/null | head -n 1 || true)"

if [[ -z "$latest_log" ]]; then
  exit 0
fi

if [[ ! -f "$memory_file" ]]; then
  echo "Reminder: memory file missing: $memory_file"
  echo "Create it to keep durable lessons for future sessions."
  exit 0
fi

if [[ "$latest_log" -nt "$memory_file" ]]; then
  echo "Reminder: .agents/MEMORY.md is older than the latest session log."
  echo "Latest log: $latest_log"
  echo "Update memory with durable lessons when applicable."
fi

exit 0
