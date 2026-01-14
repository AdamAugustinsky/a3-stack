# A3 Stack Template

A modern full-stack web application template built with the **A3 Stack**: **SvelteKit 5**, **Better Auth**, and **Kysely** (PostgreSQL).

## Features

- 🚀 **SvelteKit 5** - Full-stack framework with experimental remote functions
- 🔐 **Better Auth** - Modern authentication with organization/multi-tenant support
- 🗄️ **Kysely** - Type-safe SQL query builder with PostgreSQL
- 🎨 **shadcn/ui (Svelte)** - Beautiful UI component library
- 🎯 **TailwindCSS v4** - Utility-first CSS framework
- 📦 **Bun** - Fast all-in-one JavaScript runtime
- 🐳 **Docker** - PostgreSQL container setup included
- 🔄 **Atlas** - Database schema migrations
- ✨ **TypeScript** - Full type safety from database to UI

## Quick Start

Create a new project using Bun:

```bash
bun create github.com/AdamAugustinsky/a3-stack-kysely my-app
cd my-app
```

The setup script will run automatically during project creation. If you need to run it again or it didn't run:

```bash
bun run scripts/setup-project.ts
```

This interactive setup will:

- Generate a secure authentication secret
- Create your `.env` file with default database configuration
- Optionally start PostgreSQL with Docker Compose
- Optionally run database migrations and generate TypeScript types

Once setup is complete, start the development server:

```bash
bun run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app.

### Manual Setup

If you prefer to configure manually:

1. Copy `.env.example` to `.env`
2. Update the database connection string and generate a secret:
   ```bash
   openssl rand -base64 32
   ```
3. Start PostgreSQL: `bun run db:start`
4. Run migrations: `bun run db:setup`
5. Start dev server: `bun run dev`

## Available Commands

### Development

- `bun run dev` - Start development server
- `bun run build` - Production build
- `bun run preview` - Preview production build
- `bun run check` - Type checking
- `bun run lint` - ESLint and Prettier checks
- `bun run format` - Format code with Prettier

### Database

- `bun run db:start` - Start PostgreSQL container
- `bun run db:migrate` - Apply Atlas migrations
- `bun run db:migrate:status` - Check migration status
- `bun run db:migrate:diff` - Generate new migration
- `bun run gentypes` - Generate TypeScript types from database schema
- `bun run db:setup` - Complete setup (migrate + generate types)
- `bun run db:seed` - Seed database with sample data

## Project Structure

```
.
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── server/         # Server-side code
│   │   │   ├── db/         # Database connection and types
│   │   │   └── auth.ts     # Better Auth configuration
│   │   └── ...
│   ├── routes/             # SvelteKit routes
│   └── app.html            # HTML template
├── migrations/             # Atlas database migrations
├── scripts/                # Utility scripts
├── static/                 # Static assets
├── .env.example           # Environment variables template
├── docker-compose.yml     # PostgreSQL setup
└── package.json
```

## Remote Functions

This template uses **SvelteKit Remote Functions** (experimental) for type-safe server-client communication. See [REMOTE_FUNCTIONS_DOCS.md](./REMOTE_FUNCTIONS_DOCS.md) for details.

Example:

```typescript
// src/routes/todos/data.remote.ts
import { query, form } from '$app/server';
import * as v from 'valibot';

export const getTodos = query(async () => {
 return await db.selectFrom('todos').selectAll().execute();
});

export const createTodo = form(v.object({ title: v.string() }), async ({ title }) => {
 await db.insertInto('todos').values({ title }).execute();
});
```

```svelte
<!-- src/routes/todos/+page.svelte -->
<script>
 import { getTodos, createTodo } from './data.remote';
</script>

<ul>
 {#each await getTodos() as todo}
  <li>{todo.title}</li>
 {/each}
</ul>

<form {...createTodo}>
 <input name="title" />
 <button>Add</button>
</form>
```

## Database Migrations

Generate a new migration:

```bash
bun run db:migrate:diff
```

Apply migrations:

```bash
bun run db:migrate
```

After any schema changes, always regenerate types:

```bash
bun run gentypes
```

Or run both at once:

```bash
bun run db:setup
```

## Authentication

Better Auth is pre-configured with:

- Email/password authentication
- Organization/multi-tenant support
- Session management

Configuration in `src/lib/server/auth.ts`.

## Deployment

This template uses [svelte-adapter-bun](https://github.com/gornostay25/svelte-adapter-bun) for deployment.

Build for production:

```bash
bun run build
```

The built app will be in the `build/` directory, ready to deploy.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgres://user:password@localhost:5432/database"
BETTER_AUTH_SECRET="your-secret-key"
```

Generate a secret key:

```bash
openssl rand -base64 32
```

## Tech Stack

- **Runtime**: Bun
- **Framework**: SvelteKit 5
- **Database**: PostgreSQL with Kysely
- **Auth**: Better Auth
- **UI**: shadcn/ui for Svelte + TailwindCSS v4
- **Migrations**: Atlas
- **Type Safety**: TypeScript + Valibot

## License

MIT

## Learn More

- [SvelteKit Documentation](https://kit.svelte.dev)
- [Kysely Documentation](https://kysely.dev)
- [Better Auth Documentation](https://www.better-auth.com)
- [shadcn/ui Svelte](https://shadcn-svelte.com)
- [Bun Documentation](https://bun.sh)

---

Happy coding! 🚀

