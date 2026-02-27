# A3 Stack Convex Template

## Purpose

SvelteKit 5 template for A3 Stack using Better Auth + Convex.

## Non-Negotiables

- Use Bun only.
- Keep Better Auth organization flows working.
- Keep Convex schema/functions under `convex/`.
- No `any` and no `ts-expect-error`.

## Commands

```bash
bun run dev
bun run check
bun run convex:dev
bun run convex:deploy
```

## Key Paths

- `convex/auth.ts` - Better Auth + Convex auth component wiring.
- `src/lib/convex/todos.ts` - Frontend todo mapping/filtering/stat helpers for direct Convex usage.
- `convex/schema.ts` - Convex tables/indexes.
- `convex/todos.ts` - Convex todo queries/mutations.
- `scripts/setup-project.ts` - first-run local setup.
