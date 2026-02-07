# Agent Web Dev Playbook

## Objective

Run agent-driven web development sessions that improve over time through three layers:

1. Tiered session logs (`docs/ai/sessions/`).
2. Durable memory (`.agents/MEMORY.md`).
3. Deterministic skill routing (`.agents/skills/README.md`).

This is workflow scaffolding only. It does not change product runtime behavior.

## Defaults

- Terminology is agent-neutral.
- Default log tier is `L1` unless `L2` or `L3` clearly applies.
- Default execution style is one primary implementing agent with targeted subagents for exploration/review only.
- Quality gates use balanced strictness.

## Mandatory Pre-Flight Block

Before implementation starts, record:

1. Goal.
2. Success criteria.
3. In scope.
4. Out of scope.
5. Target files/areas.
6. Constraints.
7. Tests planned (or why skipped).

## Fixed Session Loop

Every non-trivial session follows this order:

1. Explore.
2. Plan.
3. Implement.
4. Review/Test.
5. Retro.

## Tiered Logging Policy

### L1 Full (required when any trigger is true)

Use `L1` if any of the following are true:

- `schema.sql` or migration files are touched.
- Any multi-tenant query logic is touched.
- Auth/permissions behavior is touched.
- URL sync behavior is touched.
- Remote function boundaries/validation are touched.
- The task is a production bugfix.
- The change spans 3+ files.

`L1` required sections:

- Goal
- Constraints
- Actions
- Outcomes
- Follow-ups
- Phase Log (optional)

Use `docs/ai/sessions/_template.md` for `L1` logs.

### L2 Minimal (allowed for low-risk UI-only tasks)

Use `L2` only when all are true:

- UI-only behavior.
- 1-2 files changed.
- No data model/API/security/URL-sync changes.

`L2` required sections:

- Goal
- Files touched
- Checks run
- Outcome
- Memory candidate (yes/no)

### L3 Skip (trivial only)

Use `L3` only for trivial non-behavior edits:

- Copy/text/comment/format-only.
- One file.
- No reusable lesson expected.

No log is required for `L3` unless unexpected risk/learning appears.

## Memory Compaction Rules

- After each `L1`, add up to 3 durable lessons to `.agents/MEMORY.md`.
- After each `L2`, add 0-1 durable lesson.
- After each `L3`, add none unless an unexpected issue was discovered.
- Only add repo-specific lessons likely to recur.

## Skill Routing

Use deterministic routing from `.agents/skills/README.md`:

- Frontend/component/page work -> `sveltekit-frontend`
- URL param sync/filter/calendar/search -> `svelte5-url-sync`
- Org-scoped queries -> `kysely-query-architect` + `kysely-multi-tenant-guard`
- Remote function I/O/validation -> `sveltekit-remote-functions`
- Schema changes -> `atlas-migrations`

## Balanced Validation Matrix

Always:

1. Run targeted tests for touched behavior.
2. Run `bun --bun run check`.

Run `bun --bun run lint` when:

- Shared primitives are touched.
- Config/tooling files are touched.
- Global styles are touched.
- The change spans many files.

Run `bun --bun run build` when:

- Routes/SSR boundaries are touched.
- Build config/adapter infrastructure is touched.

Run migration flow only when `schema.sql` changes:

1. `bun --bun run db:migrate:diff`
2. `bun --bun run db:migrate`
3. `bun --bun run gentypes`

## Session Commands

- `scripts/agent-session-start.sh "<topic>" --tier L1|L2|L3`
- `scripts/agent-session-close.sh "<absolute_log_path>" --tier L1|L2|L3`
- `scripts/check-agent-memory-refresh.sh`
