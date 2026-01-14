# Project Guidelines

> **Skills Available**: Always invoke the appropriate skill for specialized tasks:
>
> - `SvelteKit Frontend Patterns` - Pages, components, data loading with boundary pattern
> - `SvelteKit Remote Functions` - Backend query/form/command implementations
> - `Kysely Query Architect` - Database queries in `@packages/db/src/queries/*`
> - `frontend-design` - New screens, pages, or components requiring design

## Runtime & Package Manager

Use **Bun** exclusively. Never use Node.js, npm, yarn, pnpm, vite, or dotenv.

```bash
bun <file>           # Run TypeScript/JavaScript
bun test             # Run tests
bun install          # Install dependencies
bun run <script>     # Run package.json scripts
```

## Commands

- `bun run dev` - Start development
- `bun run build` - Production build
- `bun run check` - Type checking
- `bun run gentypes` - Generate DB types (REQUIRED after migrations)

## Database

- **PostgreSQL** with **Kysely** (type-safe query builder)
- **Atlas** for migrations
- Always run `bun run gentypes` after schema changes

## Code Philosophy

### Simplicity

- Make direct, obvious code changes. Avoid abstractions that obscure behavior.
- Inline simple logic. Create helpers only when they clearly reduce duplication.
- Design functions as data-in/data-out pipelines.
- When classes are necessary, make them simple and tasteful.
- Endpoints: validate input → database ops → return results.
- All work should be parallelized when possible, especially I/O bound tasks.

### Type Safety

- No `any` or `ts-expect-error`. Use precise union types.
- Use `Record<Union, T>` for constant maps.
- Derive types from Queries in @packages/db/src/queries/\* and generated DB types in @packages/db/src/usertypes.ts.

### Data Integrity

- Do all possible data transformations and aggregations in the database, not application code.
- APIs return dense, normalized, zero-safe data (no NaN/undefined).
- Server controls timestamps. Never trust client-provided timestamps.
- Use parameterized ORM operations. No dynamic SQL.
- Queries are bundled in @packages/db/src/queries, if new queries are necessary, add it there under the correct file.

### Error Handling

- No empty catch blocks. Add contextual error messages.
- Wrap errors with `cause` for debugging context.

## Code Style

- Keep functions concise, simple and low enthropy, ideally opting for fewest LOC.
- Use classes to bundle together functions that should be together.
- Use named constants instead of magic numbers.
- Follow existing patterns in `/apps/web/src/lib/server/modules/`.

## Testing

```typescript
import { test, expect } from 'bun:test';

test('description', () => {
	expect(result).toBe(expected);
});
```

## Svelte 5 Data Loading

Use `<svelte:boundary>` with `{@const data = await ...}` for all data fetching:

```svelte
{#snippet DataList()}
  <svelte:boundary onerror={(e) => console.error(e)}>
    {@const data = await fetchData(queryParams)}

    {#each data as item}{item.name}{/each}

    {#snippet pending()}<Skeleton />{/snippet}
    {#snippet failed(error, reset)}<Button onclick={reset}>Retry</Button>{/snippet}
  </svelte:boundary>
{/snippet}

{@render DataList()}
```

**Never use the old `.loading/.error/.current` pattern** - it's deprecated.

## Product Philosophy

- Optimize for speed and usability (think Linear).
- It's nice to have a well tought design, like it was made by a craftsman, think dub.co
- Store UI state in query params (filters, modals, we have utilities for this like useSearchParams from runed.dev).
- Add keyboard shortcuts for key actions (/, C, CMD+K).
- Add commands for key actions or nice to have presets (for example in customers table it makes sense to have a command for filtering users by some obvious things, instead of having to use the mouse to click on the filter button and type what you want).
- Give immediate visual feedback on user actions, keep the user hooked and aware of what is happening behind the scenes.
- use the frontend-design skill every time building a new screen/page/component
