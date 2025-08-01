# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack TypeScript monorepo using Turborepo with two main applications:

- **apps/web**: SvelteKit frontend with Svelte 5, TailwindCSS, and shadcn/ui components
- **apps/server**: Elysia backend (migrated from oRPC) with type-safe APIs, Drizzle ORM, and PostgreSQL

### Key Technologies

- **Frontend**: SvelteKit, Svelte 5 (uses `$state`, `$derived`, `$effect` reactivity), TailwindCSS, shadcn/ui
- **Backend**: Elysia with Eden treaty for type-safe client-server communication
- **Database**: PostgreSQL with Drizzle ORM and migrations
- **Type Safety**: ArkType for validation, Eden treaty for end-to-end types
- **State Management**: SvelteKit form actions + TanStack Query for complex client-side operations
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
- **API Clients**: 
  - `src/lib/eden.ts` - Client-side Eden treaty client
  - `src/lib/eden-server.ts` - Server-side Eden treaty client for SSR
  - `src/lib/server/elysia.ts` - Elysia API definition (local to web app)

### Backend API Architecture

The backend API is now implemented using Elysia directly in the web app:
- **API Definition**: `apps/web/src/lib/server/elysia.ts` - All API routes defined here
- **Authentication**: Middleware in Elysia for protected routes
- **Database**: 
  - Schema in `src/lib/server/db/schema/` (auth.ts, todo.ts)
  - Database client in `src/lib/server/db/index.ts`

### Key Patterns

1. **API Communication**: 
   - Use Eden treaty for type-safe client-server communication
   - Server-side: Use `edenTreatyServer` from `eden-server.ts`
   - Client-side: Use `edenTreaty` from `eden.ts`

2. **Data Fetching Strategy**:
   - Use SvelteKit form actions for mutations where forms make sense
   - Use Eden treaty + TanStack Query for complex client-side operations (bulk actions, real-time updates)
   - Load initial data in `+page.server.ts` load functions

3. **Type Validation**: Use ArkType for input validation
4. **Svelte 5 Reactivity**: Use `$state`, `$derived`, `$effect` (not stores)
5. **Component Props**: Use `$props()` and `$bindable()` for component properties
6. **Database Queries**: Use Drizzle ORM with proper types from schema

### Authentication Flow
- Better Auth handles email/password authentication
- Session stored in cookies via SvelteKit
- Protected routes check auth in `+layout.server.ts`
- Client-side auth state via `$lib/auth-client.ts`

### API Routes Structure
```
/api
  /healthcheck     - Health check endpoint
  /private/data    - Protected data endpoint
  /todo           - Todo CRUD operations
    GET    /       - Get all todos
    POST   /       - Create todo
    PATCH  /toggle - Toggle todo completion
    PATCH  /:id    - Update todo
    DELETE /:id    - Delete todo
    PATCH  /bulk   - Bulk update todos
    DELETE /bulk   - Bulk delete todos
```

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
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:5173
```

## Important Notes

- The project has migrated from oRPC to Elysia for the backend API
- API routes are defined in the web app itself (`apps/web/src/lib/server/elysia.ts`)
- Use forms for single-item CRUD operations when possible
- Use Eden treaty + svelte-query for bulk operations or complex client-side interactions
- Always run type checks before committing: `bun check-types` and `bun run check`