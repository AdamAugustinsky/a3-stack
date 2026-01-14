#!/usr/bin/env bash

# scripts/generate-migration.sh
#
# Usage:
#   scripts/generate-migration.sh <migration-name>
#
# Example:
#   scripts/generate-migration.sh add_users_name
#
# This script uses Atlas to generate a new SQL migration based on differences
# between the existing migrations and the desired state defined by schema.sql.
# It reads the dev database connection from .env (DATABASE_URL).
#
# You must have Atlas installed and accessible on your path.
# For example, by running:
#   brew install atlas
# Or:
#   npm i -g atlas@latest

set -euo pipefail

NAME=${1:-}
if [ -z "${NAME}" ]; then
  echo "Usage: $0 <migration-name>"
  exit 1
fi

# Load environment variables from .env if present
if [ -f "./.env" ]; then
  echo "Sourcing .env ..."
  # shellcheck disable=SC1091
  source "./.env"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set. Please configure it in .env."
  exit 1
fi

# Use DATABASE_URL as the dev url for Atlas
echo "Creating migration '${NAME}' using dev url from DATABASE_URL..."
atlas migrate diff "${NAME}" \
  --dir "file://migrations" \
  --to "file://schema.sql" \
  --dev-url "${DATABASE_URL}"

echo "Migration '${NAME}' created successfully. Check the 'migrations' folder."
echo "\nDon't forget to run 'bun run gentypes' if your DB schema changed, to keep Kysely types in sync.\n"