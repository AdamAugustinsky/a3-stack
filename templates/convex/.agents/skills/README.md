# Skill Index

Use this index to choose the correct skill for a task. Load the listed skill before implementing changes.

1. `ai-generation` - AI ad generation, VSL debriefing, copy forking, extraction services.
2. `ai-xml-output` - Any AI generation output that must be structured, validated, and retried.
3. `atlas-migrations` - Any schema change or migration workflow.
4. `effect-backend` - Effect-based services, runtime, and dependency layering.
5. `effect-comprehensive` - Deep Effect patterns or complex refactors.
6. `kysely-query-architect` - Writing or refactoring Kysely queries.
7. `kysely-multi-tenant-guard` - Any query touching tenant data or org-scoped tables.
8. `sveltekit-frontend` - Svelte 5 UI and component changes.
9. `svelte5-url-sync` - URL param synchronization, filters, calendars, and search state.
10. `sveltekit-remote-functions` - Remote function inputs, validation, and API boundaries.

## Deterministic Routing Rules

When multiple routes match, load all matched skills.

1. Frontend/component/page work
- Use `sveltekit-frontend`.

2. URL param sync, filters, calendars, or search state
- Use `svelte5-url-sync`.

3. Organization-scoped query changes
- Use both `kysely-query-architect` and `kysely-multi-tenant-guard`.

4. Remote function input/output/validation changes
- Use `sveltekit-remote-functions`.

5. Schema changes and migration workflow
- Use `atlas-migrations`.
