---
name: SvelteKit Frontend Patterns
description: Build SvelteKit 5 frontend features with remote functions, Svelte 5 reactivity, shadcn/ui components, and proper data loading patterns. Use when creating pages, forms, components, or working with remote functions in the web app.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# SvelteKit Frontend Patterns

This skill covers SvelteKit 5 with remote functions, shadcn/ui, and TailwindCSS v4.

> **Note:** For detailed backend implementation of remote functions (query, form, command, prerender),
> see the **sveltekit-remote-functions** skill. This skill focuses on frontend usage patterns.

## Tech Stack

- **SvelteKit 5** with experimental features
- **Better Auth** for authentication
- **shadcn/ui for Svelte** components at `$lib/components/ui`
- **TailwindCSS v4**
- **Lucide icons** and **Tabler icons**

## Svelte 5 Reactivity

```svelte
<script>
  // State
  let count = $state(0);

  // Derived (simple expressions only)
  let doubled = $derived(count * 2);

  // Derived with complex logic
  let formatted = $derived.by(() => {
    if (count > 10) return 'High';
    return 'Low';
  });
</script>
```

## Data Loading with svelte:boundary (PREFERRED)

**Always use `<svelte:boundary>` with `{@const data = await ...}` for data loading.**

This pattern provides:

- Declarative loading/error states via snippets
- Automatic retry capability via `reset` function
- Clean separation of loading, error, and success states
- No manual state management

### Basic Pattern

```svelte
<script lang="ts">
  import { getItems } from '$lib/remote/items.remote';
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
  import { page } from '$app/state';

  // Reactive query params
  const queryParams = $derived({
    organizationSlug: page.params.organization_slug!,
    filters: filterStore.toArray()
  });
</script>

{#snippet ItemsSkeleton()}
  <div class="space-y-2">
    {#each Array(5) as _, i (i)}
      <Skeleton class="h-12 w-full" />
    {/each}
  </div>
{/snippet}

{#snippet ItemsList()}
  <svelte:boundary onerror={(e) => console.error('Items fetch failed:', e)}>
    {@const items = await getItems(queryParams)}

    {#if items.length > 0}
      {#each items as item (item.id)}
        <ItemCard {item} />
      {/each}
    {:else}
      <EmptyState message="No items yet" />
    {/if}

    {#snippet pending()}
      {@render ItemsSkeleton()}
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center py-8">
        <AlertCircleIcon class="h-12 w-12 text-destructive/50" />
        <p class="mt-4 font-medium text-destructive">Failed to load items</p>
        <Button variant="outline" size="sm" onclick={reset} class="mt-4">
          Try again
        </Button>
      </div>
    {/snippet}
  </svelte:boundary>
{/snippet}

{@render ItemsList()}
```

### With Derived Data Transformations

Use `{@const}` for any data transformations inside the boundary:

```svelte
{#snippet ChartData()}
  <svelte:boundary onerror={(e) => console.error('Chart fetch failed:', e)}>
    {@const rawData = await getActivityData()}
    {@const filteredData = rawData.slice(-daysToShow).map(normalize)}
    {@const totalCount = filteredData.reduce((sum, d) => sum + d.count, 0)}

    <ChartHeader count={totalCount} />
    <Chart data={filteredData} />

    {#snippet pending()}...{/snippet}
    {#snippet failed(error, reset)}...{/snippet}
  </svelte:boundary>
{/snippet}
```

### Reactivity with Boundary

When `queryParams` is `$derived`, the boundary automatically re-executes when dependencies change:

```svelte
<script>
  const queryParams = $derived({
    organizationSlug: page.params.organization_slug!,
    filters: filterStore.toArray()  // When filters change, boundary re-fetches
  });
</script>

{#snippet DataList()}
  <svelte:boundary>
    {@const data = await fetchData(queryParams)}
    <!-- Automatically updates when queryParams changes -->
  </svelte:boundary>
{/snippet}
```

## Using Remote Functions (Frontend)

### Refreshing Queries

After mutations, queries are automatically refreshed if called with `.refresh()` in the remote function.
You can also manually refresh:

```svelte
<button onclick={() => getItems().refresh()}>
  Refresh
</button>
```

### Using Forms

Forms are the primary way of action in the SvelteKit philosophy (web native):

```svelte
<script>
  import { createItem } from './items.remote';
  import { toast } from 'svelte-sonner';

  let submitting = $state(false);
</script>

<form {...createItem.enhance(async ({ submit, form }) => {
  submitting = true;
  try {
    await submit();
    form.reset();
    toast.success('Created!');
  } catch (e) {
    toast.error('Failed');
  } finally {
    submitting = false;
  }
})}>
  <input {...createItem.fields.title.as('text')} />
  <button disabled={submitting}>Create</button>
</form>
```

### Displaying Validation Errors

```svelte
<form {...createItem}>
  <input {...createItem.fields.title.as('text')} />
  {#each createItem.fields.title.issues() as issue}
    <p class="text-xs text-destructive">{issue.message}</p>
  {/each}
</form>
```

### Using Commands

```svelte
<script>
  import { deleteItem } from './items.remote';
  import { toast } from 'svelte-sonner';
</script>

<button onclick={async () => {
  try {
    await deleteItem({ id: item.id });
    toast.success('Deleted');
  } catch (e) {
    toast.error('Failed');
  }
}}>
  Delete
</button>
```

## Forms with Shared Snippets

Reuse form UI between create and edit modes:

```svelte
<script lang="ts">
  import { createItemForm, updateItemForm } from './items.remote';
  import { toast } from 'svelte-sonner';

  let createDialogOpen = $state(false);
  let editDialogOpen = $state(false);
  let editingItem = $state<Item | undefined>();
  let submitting = $state(false);
</script>

{#snippet itemFormSnippet(formObj: typeof createItemForm | typeof updateItemForm, item?: Item)}
  <input type="hidden" name="organizationSlug" value={organizationSlug} />
  {#if item}
    <input type="hidden" name="itemId" value={item.id} />
  {/if}

  <Input name="title" value={item?.title ?? ''} />
  {#if formObj.issues?.title}
    {#each formObj.issues.title as issue}
      <p class="text-xs text-destructive">{issue.message}</p>
    {/each}
  {/if}
{/snippet}

<form {...createItemForm.enhance(async ({ submit }) => {
  submitting = true;
  try {
    await submit();
    createDialogOpen = false;
    toast.success('Created');
  } catch (e) {
    toast.error('Failed');
  } finally {
    submitting = false;
  }
})}>
  {@render itemFormSnippet(createItemForm)}
</form>
```

## Design Principles

### Layout

- Two-column grid for settings (2/3 main, 1/3 meta)
- Stack to single column on mobile
- Use `min-w-0` and `truncate` for overflow text
- Tight paddings to avoid micro-scroll: `pb-1`, `py-1`, `space-y-2`

### Responsiveness

- Create mobile alternatives for data tables (card lists)
- Use Sheet components for dropdowns on mobile
- Always test on small viewports

### Dividers vs Cards

**Dividers** for sequential/grouped content:

```svelte
<div class="divide-y divide-border/40">
  {#each items as item}
    <div class="py-4 first:pt-0">{item.name}</div>
  {/each}
</div>
```

**Cards** for independent, clickable items.

### Feedback

- Toast notifications for actions
- Inline alerts near page header
- Loading spinners during async ops
- Never leave actions without feedback

### Keyboard Shortcuts

Use `Kbd` component for hints:

```svelte
<Kbd content="/" />
<Kbd content="C" variant="onPrimary" />
```

Add shortcuts for: `/` (search), `C` (create), `CMD+K` (command palette).

## Path Aliases

- `$lib/*` → `./src/lib/*`
- `@/*` → `./src/lib/*`
- `@routes/*` → `./src/routes/*`

## Anti-Patterns

**NEVER use the old `.loading/.error/.current` pattern:**

```svelte
// ❌ DEPRECATED - Don't do this
const query = getItems();
{#if query.loading}...{:else if query.error}...{:else}...{/if}
```

**Always use `<svelte:boundary>` with `{@const}` instead:**

```svelte
// ✅ PREFERRED
<svelte:boundary>
  {@const items = await getItems()}
  <!-- render items -->
  {#snippet pending()}...{/snippet}
  {#snippet failed(error, reset)}...{/snippet}
</svelte:boundary>
```

Other anti-patterns:

- Separate create/edit form UIs (use snippets)
- Missing keys in `{#each}` blocks
- Forgetting `.refresh()` or `.updates()` after mutations
- State mutations inside boundary template (causes `state_unsafe_mutation` error)
