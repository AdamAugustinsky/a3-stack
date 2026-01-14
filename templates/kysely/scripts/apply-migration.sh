#!/usr/bin/env bash

# scripts/apply-migration.sh
#
# Usage:
#   scripts/apply-migration.sh [command] [options]
#
# Commands:
#   apply      Apply pending migrations (default)
#   status     Show migration status
#   dry-run    Preview migrations without applying
#   baseline   Apply with baseline for existing databases
#
# Examples:
#   scripts/apply-migration.sh                    # Apply all pending migrations
#   scripts/apply-migration.sh apply 2            # Apply only 2 pending migrations
#   scripts/apply-migration.sh dry-run            # Preview changes without applying
#   scripts/apply-migration.sh status             # Check migration status
#   scripts/apply-migration.sh baseline 20250815170516  # Apply with baseline
#
# This script uses Atlas to apply database migrations from the migrations directory.

set -euo pipefail

# Load environment variables from .env if present
if [ -f "./.env" ]; then
  # shellcheck disable=SC1091
  source "./.env"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set. Please configure it in .env."
  exit 1
fi

# Parse command and options
COMMAND=${1:-apply}
LIMIT=${2:-}
BASELINE=${2:-}

# Migration directory (default to file://migrations)
MIGRATION_DIR="file://migrations"

# Revision schema (stores migration history)
REVISION_SCHEMA="public"

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

case "${COMMAND}" in
  apply)
    echo -e "${BLUE}Applying pending migrations...${NC}"
    if [ -n "${LIMIT}" ]; then
      echo -e "${YELLOW}Limiting to ${LIMIT} migration(s)${NC}"
      atlas migrate apply "${LIMIT}" \
        --url "${DATABASE_URL}" \
        --dir "${MIGRATION_DIR}" \
        --revisions-schema "${REVISION_SCHEMA}"
    else
      atlas migrate apply \
        --url "${DATABASE_URL}" \
        --dir "${MIGRATION_DIR}" \
        --revisions-schema "${REVISION_SCHEMA}"
    fi
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
    ;;
    
  dry-run)
    echo -e "${BLUE}Performing dry run (preview only)...${NC}"
    atlas migrate apply \
      --url "${DATABASE_URL}" \
      --dir "${MIGRATION_DIR}" \
      --revisions-schema "${REVISION_SCHEMA}" \
      --dry-run
    echo -e "${YELLOW}This was a dry run. No changes were applied.${NC}"
    ;;
    
  status)
    echo -e "${BLUE}Checking migration status...${NC}"
    atlas migrate status \
      --url "${DATABASE_URL}" \
      --dir "${MIGRATION_DIR}" \
      --revisions-schema "${REVISION_SCHEMA}"
    ;;
    
  baseline)
    if [ -z "${BASELINE}" ]; then
      echo -e "${RED}Error: Baseline version required${NC}"
      echo "Usage: $0 baseline <version>"
      echo "Example: $0 baseline 20250815170516"
      exit 1
    fi
    echo -e "${BLUE}Applying migrations with baseline ${BASELINE}...${NC}"
    atlas migrate apply \
      --url "${DATABASE_URL}" \
      --dir "${MIGRATION_DIR}" \
      --revisions-schema "${REVISION_SCHEMA}" \
      --baseline "${BASELINE}"
    echo -e "${GREEN}✓ Migrations applied with baseline${NC}"
    ;;
    
  allow-dirty)
    echo -e "${YELLOW}⚠️  Applying migrations to non-clean database...${NC}"
    atlas migrate apply \
      --url "${DATABASE_URL}" \
      --dir "${MIGRATION_DIR}" \
      --revisions-schema "${REVISION_SCHEMA}" \
      --allow-dirty
    echo -e "${GREEN}✓ Migrations applied (allow-dirty mode)${NC}"
    ;;
    
  help|--help|-h)
    cat << EOF
Database Migration Tool using Atlas

Usage: $0 [command] [options]

Commands:
  apply [n]         Apply pending migrations (optionally limit to n files)
  dry-run           Preview migrations without applying them
  status            Show current migration status
  baseline <ver>    Apply with baseline version (for existing databases)
  allow-dirty       Apply to non-clean database (use with caution)
  help              Show this help message

Environment Variables:
  DATABASE_URL      Required. PostgreSQL connection string

Examples:
  $0                        # Apply all pending migrations
  $0 apply 2                # Apply only 2 pending migrations
  $0 dry-run                # Preview without applying
  $0 status                 # Check migration status
  $0 baseline 20250815170516    # First-time apply with baseline

Notes:
  - Migrations are stored in: ${MIGRATION_DIR}
  - Migration history is tracked in: ${REVISION_SCHEMA}.atlas_schema_revisions
  - By default, each migration runs in its own transaction
  - Use 'dry-run' to preview changes before applying to production

EOF
    ;;
    
  *)
    echo -e "${RED}Error: Unknown command '${COMMAND}'${NC}"
    echo "Use '$0 help' for usage information"
    exit 1
    ;;
esac

# Post-migration actions
if [[ "${COMMAND}" == "apply" ]] || [[ "${COMMAND}" == "baseline" ]] || [[ "${COMMAND}" == "allow-dirty" ]]; then
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "1. Run 'bun run gentypes' to regenerate TypeScript types"
  echo "2. Run '$0 status' to verify migration status"
  echo "3. Test your application to ensure everything works"
fi