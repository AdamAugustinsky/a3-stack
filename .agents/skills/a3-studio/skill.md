---
name: A3 Studio
description: Build the A3 Studio desktop app using SvelteKit 5 + Tauri 2. Use when working on the studio package.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# A3 Studio

## Scope
- Studio app in `packages/a3-studio/`
- SvelteKit frontend in `packages/a3-studio/src/`
- Tauri backend configuration

## Tech Stack
- **SvelteKit 5** with static adapter (for Tauri)
- **Tauri 2** for desktop app shell
- **TailwindCSS v4** for styling
- **bits-ui** for headless UI components
- **mode-watcher** for dark/light theme
- **tailwind-variants** + **tailwind-merge** for component variants

## Key Constraints
- Uses `@sveltejs/adapter-static` — no server-side rendering
- All data access goes through Tauri plugin APIs (`@tauri-apps/api`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-opener`)
- No remote functions (those are for the template, not the studio)

## Development

```bash
# Frontend dev server
bun run dev:studio

# Tauri desktop app
cd packages/a3-studio && bun run tauri dev

# Build
cd packages/a3-studio && bun run tauri build
```

## SvelteKit Static App Patterns

Since this is a static SvelteKit app for Tauri:

```ts
// src/routes/+layout.ts
export const prerender = true;
export const ssr = false;
```

All pages are client-rendered. No `+page.server.ts` or server-only modules.

## Tauri Integration

Access Tauri APIs from SvelteKit:

```svelte
<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { openUrl } from '@tauri-apps/plugin-opener';

  async function selectFolder() {
    const selected = await open({ directory: true });
    if (selected) {
      // handle selected path
    }
  }
</script>
```

## Anti-Patterns

- Using server-side SvelteKit features (load functions, server routes)
- Direct filesystem access without Tauri APIs
- Importing from `$lib/server/` (doesn't exist in studio)
