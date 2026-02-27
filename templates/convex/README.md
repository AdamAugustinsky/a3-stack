# A3 Stack Convex Template

SvelteKit 5 + Better Auth + Convex template for A3 Stack.

## Stack

- SvelteKit 5
- Better Auth (email/password + organizations)
- Convex (todos + dashboard data)
- TailwindCSS v4 + shadcn-svelte components

## Quickstart

```bash
bun install
bun run scripts/setup-project.ts
bun run convex:dev
bun run dev
```

App: `http://localhost:5173`

## Environment

Copy `.env.example` to `.env` (or use setup script):

```bash
CONVEX_URL="http://127.0.0.1:3210"
PUBLIC_CONVEX_URL="http://127.0.0.1:3210"
PUBLIC_CONVEX_SITE_URL="http://127.0.0.1:3210"
SITE_URL="http://localhost:5173"
PUBLIC_SITE_URL="http://localhost:5173"
BETTER_AUTH_SECRET="..."
```

`bun run convex:dev` will prompt login and set deployment metadata for Convex CLI usage.

`/api/auth/[...all]` is proxied to Convex Better Auth routes.

## Commands

- `bun run dev` - Start SvelteKit dev server
- `bun run convex:dev` - Start Convex dev backend
- `bun run convex:deploy` - Deploy Convex functions
- `bun run check` - Run type checks
- `bun run lint` - Run lint + format check
