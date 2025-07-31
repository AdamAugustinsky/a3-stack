# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack TypeScript monorepo using Turborepo with two main applications:

- **apps/web**: SvelteKit frontend with Svelte 5, TailwindCSS, and shadcn/ui components
- **apps/server**: Elysia backend with oRPC for type-safe APIs, Drizzle ORM, and PostgreSQL

### Key Technologies

- **Frontend**: SvelteKit, Svelte 5 (uses `$state`, `$derived`, `$effect` reactivity), TailwindCSS, shadcn/ui
- **Backend**: Elysia, oRPC, Drizzle ORM, Better Auth
- **Database**: PostgreSQL with Drizzle migrations
- **Type Safety**: ArkType for validation (replaced Zod), end-to-end types via oRPC
- **State Management**: TanStack Query for server state
- **Runtime**: Bun

## Development Commands

### Essential Commands
```bash
# Install dependencies
bun install

# Run all apps in dev mode
bun dev

# Run specific apps
bun dev:web     # Frontend only (port 5173)
bun dev:server  # Backend only (port 3000)

# Type checking
bun check-types # Check all apps
bun check       # Lint with oxlint

# Database operations
bun db:push     # Push schema to database
bun db:studio   # Open Drizzle Studio
bun db:generate # Generate migrations
bun db:migrate  # Run migrations
bun db:start    # Start PostgreSQL in Docker
bun db:stop     # Stop PostgreSQL container
```

### Build Commands
```bash
bun build       # Build all apps
```

### Frontend-specific (in apps/web)
```bash
bun run check         # Run svelte-check for type checking
bun run check:watch   # Watch mode for svelte-check
```

## Code Architecture

### Frontend Structure (apps/web)
- **Routes**: File-based routing in `src/routes/`
  - `(protected)/` - Authenticated routes with sidebar layout
  - Auth pages: `/sign-in`, `/sign-up`, `/forgot-password`
- **Components**: 
  - UI components in `src/lib/components/ui/` (shadcn/ui)
  - Business components in `src/lib/components/`
- **API Client**: `src/lib/orpc.ts` - Configured oRPC client with TanStack Query

### Backend Structure (apps/server)
- **Entry**: `src/index.ts` - Elysia server setup
- **Routers**: `src/routers/` - oRPC routers (todo.ts, index.ts)
- **Database**: 
  - Schema in `src/db/schema/` (auth.ts, todo.ts)
  - Migrations in `src/db/migrations/`
- **Auth**: Better Auth configured in `src/lib/auth.ts`
- **Context**: Request context with auth in `src/lib/context.ts`

### Key Patterns

1. **oRPC Procedures**: Use `publicProcedure` or `protectedProcedure` from `src/lib/orpc.ts`
2. **Type Validation**: Use ArkType for input validation (not Zod)
3. **Svelte 5 Reactivity**: Use `$state`, `$derived`, `$effect` (not stores)
4. **Component Props**: Use `$props()` and `$bindable()` for component properties
5. **Database Queries**: Use Drizzle ORM with proper types from schema

### Authentication Flow
- Better Auth handles email/password authentication
- Session stored in cookies
- Protected routes check auth in `+layout.server.ts`
- Client-side auth state via `$lib/auth-client.ts`

## Environment Setup

### Required Environment Variables

**apps/server/.env**:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
CORS_ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

**apps/web/.env**:
```
PUBLIC_SERVER_URL=http://localhost:3000
```