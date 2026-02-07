# A3 Stack Kysely Template

## Purpose

This template is a Bun-first starter for multi-tenant web apps using SvelteKit 5, Better Auth organizations, Kysely, and PostgreSQL. It provides production-ready patterns for auth, org-scoped data access, remote functions, and dashboard/todo flows.

## Non-Negotiables

- Use Bun only. No Node.js, npm, yarn, or pnpm.
- Multi-tenant by default. Tenant data queries must be scoped by organization.
- Never trust client-provided organization ids. Derive access from server context.
- For org routes, resolve tenant context via `organization_slug` and server-side auth helpers.
- Use Remote Functions (`query`, `form`, `command`) with Valibot validation.
- Atlas migrations only. `schema.sql` is the source of truth. Do not hand-write migration SQL.
- Run `bun run gentypes` after schema changes.
- Svelte 5 URL sync: avoid bidirectional `$effect`; use explicit callbacks and equality guards.
- No `any` or `ts-expect-error`.

## Workflow

### Pre-flight (first message)

- Confirm scope and expected outcome.
- Identify target files/areas.
- Identify tests/checks to run (or why skipped).
- Ask for missing constraints if truly unknown.

### Session flow

1. Explore: locate files and existing patterns.
2. Plan: choose approach, risks, and checks.
3. Implement: keep diffs focused.
4. Review/Test: self-review and run relevant tests/checks.
5. Check: run type/lint/build gates when appropriate.
6. Code Review.

### Session logs

- Store logs in `docs/ai/sessions/YYYY-MM-DD-topic.md`.
- Default sections: Goal, Constraints, Actions, Outcomes, Follow-ups.
- Start from `docs/ai/sessions/_template.md`.

## Architecture Snapshot

- `src/lib/remote/` Remote functions for app behavior.
- `src/lib/server/` auth, db, server utilities, test helpers.
- `src/routes/(protected)/[organization_slug]/` org-scoped application routes.
- `src/lib/components/` shared UI and feature components.
- `src/lib/schemas/` Valibot input schemas.
- `migrations/` Atlas migration files.
- `schema.sql` database source of truth.

## Core Domain

- Authentication and sessions via Better Auth.
- Organization and membership flows (create/switch/manage/invite).
- Org-scoped todo lifecycle (create/read/update/delete/bulk actions).
- Dashboard metrics and recent activity by organization.

## Remote Function Guardrails

- Validate all inputs with Valibot before business logic.
- Keep `query` read-only and fast.
- Use `form` for form submissions and string-to-type transforms.
- Use `command` for side effects and explicit refreshes.
- Keep tenant filtering (`organization_id`) at the query boundary.

## Svelte 5 Guardrails

- Use `<svelte:boundary>` for async data loading in pages/components.
- Prefer explicit local state transitions over reactive loops.
- For URL-synced filters/search, initialize once from URL and update URL in callbacks.
- Avoid `bind:value` for URL-synced state.

## Performance Patterns

- Filter/aggregate in SQL when feasible.
- Avoid fetching heavy fields for list views.
- Debounce search before URL updates.
- Return stable/unmodified collections when no filtering is applied.

## Code Quality

- Prefer direct, obvious code over abstractions.
- Follow the Scout Rule: leave every touched file cleaner than you found it with small, safe improvements.
- No `any` or `ts-expect-error`. Use precise types, use TypeScript features properly (type inference) and Valibot schemas where necessary.
- Wrap errors with `cause`. No empty catch blocks.
- Server controls timestamps; never trust client-provided timestamps.
- Prefer doing data aggregations/transformations in SQL, not JS.
- Create code around data structures and algorithms, not the other way around.

## Commands

```bash
bun --bun run dev               # Start development server
bun --bun run build             # Production build
bun --bun run check             # Type checking
bun --bun run lint              # Lint + formatting checks
bun --bun run db:migrate        # Apply Atlas migrations
bun --bun run db:migrate:status # Migration status
bun --bun run db:migrate:diff   # Generate migration from schema.sql
bun --bun run gentypes          # Regenerate DB types
bun --bun run db:setup          # Migrate + regenerate types
```

## Skills

- `SvelteKit Frontend Patterns` - Pages/components and boundary-based loading.
- `SvelteKit Remote Functions` - `query`/`form`/`command` patterns and validation boundaries.
- `Kysely Query Architect` - Query design and type-safe SQL access.
- `Kysely Multi-Tenant Guard` - Organization scoping and tenant safety.
- `Svelte 5 URL Sync` - URL-state synchronization without effect loops.
- `frontend-design` - Use for new screen/page/component UI design work.
