# Svelte 5 Boundary + Async/Await Refactoring Guide

This guide documents the pattern for refactoring SvelteKit pages to use Svelte 5's `<svelte:boundary>` with async/await and snippets. It replaces the old `query.loading` / `query.error` / `query.current` pattern with a cleaner, more declarative approach.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [The Pattern](#the-pattern)
- [Step-by-Step Refactoring Guide](#step-by-step-refactoring-guide)
- [Common Pitfalls](#common-pitfalls)
- [Before/After Examples](#beforeafter-examples)
- [Skeleton Components](#skeleton-components)
- [Refactoring Checklist](#refactoring-checklist)

---

## Overview

### Why This Pattern?

The `<svelte:boundary>` pattern offers several advantages:

1. **Declarative data loading** - Data fetching is colocated with rendering
2. **Built-in loading states** - `{#snippet pending()}` handles loading UI automatically
3. **Built-in error handling** - `{#snippet failed()}` provides error recovery with reset
4. **No manual state management** - No need for `isLoading`, `error`, `data` state variables
5. **Automatic synchronization** - UI updates are coordinated to prevent inconsistent states

### When to Use

Use this pattern when:

- Loading data from remote functions on page load
- You need loading skeleton states
- You want automatic error handling with retry capability
- Data depends on reactive URL params or filters

---

## Prerequisites

### Svelte Configuration

Enable experimental async in your `svelte.config.js`:

```js
// svelte.config.js
export default {
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};
```

> **Note**: The `experimental` flag will be removed in Svelte 6 when this becomes the default.

### Required Imports

```svelte
<script lang="ts">
  import { Skeleton } from '$lib/components/ui/skeleton/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

  // Your remote function
  import { getData } from '$lib/remote/data.remote';
</script>
```

---

## The Pattern

### Basic Structure

```svelte
{#snippet DataList()}
  <svelte:boundary onerror={(e) => console.error('DataList fetch failed:', e)}>
    {@const data = await fetchRemoteFunction(queryParams)}

    <!-- Render data directly - NO state mutations here -->
    {#if data.length > 0}
      {#each data as item}
        <ItemCard {item} />
      {/each}
    {:else}
      <EmptyState />
    {/if}

    {#snippet pending()}
      <LoadingSkeleton />
    {/snippet}

    {#snippet failed(error, reset)}
      <ErrorState onRetry={reset} />
    {/snippet}
  </svelte:boundary>
{/snippet}

<!-- Render the snippet -->
{@render DataList()}
```

### Key Components

| Component                         | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `<svelte:boundary>`               | Wraps async content, catches errors            |
| `onerror`                         | Handler called when errors occur (for logging) |
| `{@const data = await ...}`       | Async data fetching inside boundary            |
| `{#snippet pending()}`            | UI shown during initial load                   |
| `{#snippet failed(error, reset)}` | UI shown on error, with retry function         |

### Data Flow

```
1. Component mounts
2. Boundary shows `pending` snippet
3. `await fetchRemoteFunction()` executes
4. On success: Main content renders with data
5. On error: `failed` snippet renders, `onerror` called
6. On retry: `reset()` re-executes the boundary
```

---

## Step-by-Step Refactoring Guide

### Step 1: Identify the Data Query

**Before:**

```svelte
<script>
  const dataQuery = $derived(getData({ organizationSlug }));
  const data = $derived(dataQuery.current ?? []);
  const isLoading = $derived(dataQuery.loading);
  const error = $derived(dataQuery.error);
</script>
```

**After:**

```svelte
<script>
  // Just define the query params - no query object needed
  const queryParams = $derived({
    organizationSlug: page.params.organization_slug!
  });
</script>
```

### Step 2: Create the Skeleton Snippet

Define a skeleton that matches your content layout:

```svelte
{#snippet TableSkeleton()}
  <div class="rounded-xl border bg-background shadow-sm">
    <div class="p-4 border-b">
      <div class="flex items-center gap-4">
        <Skeleton class="h-9 w-64" />
        <Skeleton class="h-9 w-32" />
      </div>
    </div>
    {#each Array(6) as _, i (i)}
      <div class="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
        <Skeleton class="h-5 w-5" />
        <Skeleton class="h-4 flex-1" />
        <Skeleton class="h-6 w-20 rounded-md" />
      </div>
    {/each}
  </div>
{/snippet}
```

### Step 3: Create the Main Content Snippet

Wrap your data loading and rendering in a snippet with boundary:

```svelte
{#snippet DataList()}
  <svelte:boundary onerror={(e) => console.error('DataList fetch failed:', e)}>
    {@const data = await getData(queryParams)}

    {#if data.length > 0}
      <DataTable {data} />
    {:else}
      <div class="flex flex-col items-center justify-center py-16">
        <p class="font-medium">No data yet</p>
        <Button variant="outline" onclick={handleCreate}>
          Add First Item
        </Button>
      </div>
    {/if}

    {#snippet pending()}
      {@render TableSkeleton()}
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center justify-center py-16">
        <AlertCircleIcon class="h-12 w-12 text-destructive/50" />
        <p class="mt-4 font-medium text-destructive">Failed to load data</p>
        <Button variant="outline" size="sm" onclick={reset} class="mt-4">
          Try again
        </Button>
      </div>
    {/snippet}
  </svelte:boundary>
{/snippet}
```

### Step 4: Render the Snippet

Replace your old conditional rendering:

**Before:**

```svelte
{#if isLoading}
  <LoadingSkeleton />
{:else if error}
  <ErrorState />
{:else}
  <DataTable {data} />
{/if}
```

**After:**

```svelte
{@render DataList()}
```

### Step 5: Handle Derived/Computed Data

Use `{@const}` for any data transformations inside the boundary:

```svelte
{#snippet VslList()}
  <svelte:boundary onerror={(e) => console.error('VslList fetch failed:', e)}>
    {@const rawVsls = await getVsls(vslQueryParams)}
    {@const vslsWithStatuses = applyStatusOverrides(rawVsls)}
    {@const vsls = filterByNiche(vslsWithStatuses)}
    {@const totalVslCount = vslsWithStatuses.length}
    {@const completedCount = vslsWithStatuses.filter(v => v.debriefingStatus === 'completed').length}

    <!-- Use computed values directly -->
    <Header count={totalVslCount} completed={completedCount} />
    <VslGrid {vsls} />

    {#snippet pending()}...{/snippet}
    {#snippet failed(error, reset)}...{/snippet}
  </svelte:boundary>
{/snippet}
```

---

## Common Pitfalls

### CRITICAL: No State Mutations Inside Boundary Template

This is the most important rule. **Never mutate state inside a boundary's template area.**

#### The Error

```
state_unsafe_mutation: Updating state inside `$derived(...)`, `$inspect(...)`
or a template expression is forbidden.
```

#### What Causes It

```svelte
<!-- WRONG - causes runtime error -->
<svelte:boundary>
  {@const data = await fetchData()}
  {(() => { myState = data; return ''; })()} <!-- STATE MUTATION! -->

  {#each data as item}...{/each}
{/snippet}
```

Or more subtly:

```svelte
<!-- WRONG - also causes runtime error -->
<svelte:boundary>
  {@const data = await fetchData()}
  {(cachedData = data, '')} <!-- STATE MUTATION! -->

  {#each data as item}...{/each}
{/snippet}
```

#### Why It Happens

Svelte 5's reactivity system forbids state mutations during template evaluation. The boundary's content area is evaluated like a derived expression - it should be pure and side-effect free.

#### The Fix

If you need cached data for other purposes (like export to CSV), use a different approach:

**Option A: Move header inside boundary (Recommended)**

```svelte
{#snippet DataList()}
  <svelte:boundary>
    {@const data = await fetchData()}

    <!-- Header is INSIDE the boundary, has access to data -->
    <Header count={data.length} />

    {#each data as item}...{/each}

    {#snippet pending()}
      <HeaderSkeleton />
      <TableSkeleton />
    {/snippet}
  </svelte:boundary>
{/snippet}
```

**Option B: Derive count from metadata (for counts outside boundary)**

If you have metadata queries that return counts:

```svelte
<script>
  // Lightweight query just for counts
  const sessionsQuery = $derived(getSessions({ organizationSlug }));
  const sessions = $derived(sessionsQuery.current ?? []);

  // Calculate count from metadata
  const totalCopiesCount = $derived(
    sessions.reduce((sum, s) => sum + (s.generatedCopyIds?.length ?? 0), 0)
  );
</script>

<!-- Header outside boundary uses metadata-derived count -->
<Header count={totalCopiesCount} />

{#snippet CopiesList()}
  <svelte:boundary>
    {@const copies = await getCopies(queryParams)}
    <!-- ... -->
  </svelte:boundary>
{/snippet}
```

### Polling Logic with Cached Data

**Problem:** VSLs page had polling that needed to detect status changes.

**Old approach (broken):**

```svelte
{@const vsls = await getVsls(params)}
{(cachedVsls = vsls, '')} <!-- Can't do this! -->
```

**Solution:** Use a separate lightweight status query for polling:

```svelte
<script>
  // Lightweight query just for statuses - used for polling
  const statusesQuery = $derived(getVslStatuses({ organizationSlug }));
  const statuses = $derived(statusesQuery.current ?? []);

  // Polling effect uses statuses, not full VSL objects
  $effect(() => {
    if (hasProcessingVsls && !pollInterval && statusesQuery) {
      pollInterval = setInterval(() => {
        statusesQuery.refresh();
      }, POLL_INTERVAL);
    }
  });

  // Apply status updates to rendered data
  function applyStatusOverrides(vsls: Vsl[]): Vsl[] {
    return vsls.map(vsl => {
      const override = statusOverrides.get(vsl.id);
      if (override) {
        return { ...vsl, debriefingStatus: override.debriefingStatus };
      }
      return vsl;
    });
  }
</script>

{#snippet VslList()}
  <svelte:boundary>
    {@const rawVsls = await getVsls(vslQueryParams)}
    {@const vsls = applyStatusOverrides(rawVsls)}
    <!-- render vsls -->
  </svelte:boundary>
{/snippet}
```

### Finding Selected Item from URL

**Problem:** When URL has `?copyId=X`, you want to show details for that copy.

**Old approach:** Try to find it in already-loaded list to avoid extra fetch.

**New approach:** Just always fetch the single item - simpler and the overhead is minimal:

```svelte
<script>
  const copyIdFromUrl = $derived(page.url.searchParams.get('copyId') ?? '');

  // Separate query for the selected item
  const singleCopyQuery = $derived(
    copyIdFromUrl
      ? getCopyById({ organizationSlug, id: copyIdFromUrl })
      : null
  );
  const selectedCopy = $derived(singleCopyQuery?.current ?? null);
</script>
```

---

## Before/After Examples

### Example 1: Simple List Page

**Before (Old Pattern):**

```svelte
<script lang="ts">
  import { getTodos } from '$lib/remote/todo.remote';

  const todosQuery = $derived(getTodos({ organizationSlug }));
  const todos = $derived(todosQuery.current ?? []);
  const isLoading = $derived(todosQuery.loading);
  const error = $derived(todosQuery.error);
</script>

{#if isLoading}
  <div class="space-y-2">
    {#each Array(5) as _}
      <Skeleton class="h-12 w-full" />
    {/each}
  </div>
{:else if error}
  <div class="text-destructive">
    <p>Failed to load todos</p>
    <Button onclick={() => todosQuery.refresh()}>Retry</Button>
  </div>
{:else if todos.length === 0}
  <p>No todos yet</p>
{:else}
  <TodoList {todos} />
{/if}
```

**After (New Pattern):**

```svelte
<script lang="ts">
  import { getTodos } from '$lib/remote/todo.remote';

  const queryParams = $derived({
    organizationSlug: page.params.organization_slug!,
    filters: filterStore.toArray()
  });
</script>

{#snippet TodoTableSkeleton()}
  <div class="rounded-xl border bg-background shadow-sm">
    {#each Array(6) as _, i (i)}
      <div class="flex items-center gap-4 border-b px-4 py-3">
        <Skeleton class="h-5 w-5" />
        <Skeleton class="h-4 flex-1" />
        <Skeleton class="h-6 w-20 rounded-md" />
      </div>
    {/each}
  </div>
{/snippet}

{#snippet TodoList()}
  <svelte:boundary onerror={(e) => console.error('TodoList fetch failed:', e)}>
    {@const todos = await getTodos(queryParams)}

    {#if todos.length > 0}
      <TodoDataTable data={todos} />
    {:else}
      <div class="flex flex-col items-center py-16">
        <ClipboardListIcon class="h-8 w-8 text-muted-foreground/50" />
        <p class="mt-4 font-medium">No tasks yet</p>
      </div>
    {/if}

    {#snippet pending()}
      {@render TodoTableSkeleton()}
    {/snippet}

    {#snippet failed(error, reset)}
      <div class="flex flex-col items-center py-16">
        <AlertCircleIcon class="h-12 w-12 text-destructive/50" />
        <p class="mt-4 font-medium text-destructive">Failed to load tasks</p>
        <Button variant="outline" size="sm" onclick={reset} class="mt-4">
          Try again
        </Button>
      </div>
    {/snippet}
  </svelte:boundary>
{/snippet}

{@render TodoList()}
```

### Example 2: Page with Multiple Data Sections

**After (Multiple Boundaries):**

```svelte
{#snippet StatsOverview()}
  <svelte:boundary onerror={(e) => console.error('Stats fetch failed:', e)}>
    {@const stats = await getStats(statsParams)}

    <div class="grid grid-cols-4 gap-4">
      <StatCard label="Total" value={stats.total} />
      <StatCard label="Winners" value={stats.winners} />
      <!-- ... -->
    </div>

    {#snippet pending()}
      {@render StatsSkeleton()}
    {/snippet}

    {#snippet failed(error, reset)}
      <Card class="col-span-full">
        <AlertCircleIcon />
        <p>Failed to load stats</p>
        <Button onclick={reset}>Retry</Button>
      </Card>
    {/snippet}
  </svelte:boundary>
{/snippet}

{#snippet PatternsList()}
  <svelte:boundary onerror={(e) => console.error('Patterns fetch failed:', e)}>
    {@const patterns = await getPatterns(patternParams)}
    <!-- render patterns -->
    {#snippet pending()}...{/snippet}
    {#snippet failed(error, reset)}...{/snippet}
  </svelte:boundary>
{/snippet}

<!-- Each section loads independently -->
{@render StatsOverview()}
{@render PatternsList()}
```

---

## Skeleton Components

### Available Reusable Skeletons

Located in `$lib/components/ui/skeletons/`:

```ts
import {
	TableSkeleton, // Table rows with icon, text, action
	CardGridSkeleton, // Grid of cards with image placeholders
	ListSkeleton, // List items with avatar and text
	StatCardsSkeleton, // Grid of stat cards
	ErrorState, // Error UI with retry button
	EmptyState // Empty state with icon and action
} from '$lib/components/ui/skeletons';
```

### Creating Custom Skeletons

Match your skeleton to your content layout:

```svelte
{#snippet CustomSkeleton()}
  <div class="rounded-xl border bg-background p-4">
    <!-- Match your actual content structure -->
    <div class="flex items-center gap-4 mb-4">
      <Skeleton class="h-12 w-12 rounded-xl" /> <!-- Icon -->
      <div class="space-y-2">
        <Skeleton class="h-5 w-48" />  <!-- Title -->
        <Skeleton class="h-4 w-32" />  <!-- Subtitle -->
      </div>
    </div>

    <!-- Match your list/grid structure -->
    {#each Array(6) as _, i (i)}
      <div class="flex items-center gap-4 py-3 border-t">
        <Skeleton class="h-4 flex-1" />
        <Skeleton class="h-6 w-20 rounded-md" />
      </div>
    {/each}
  </div>
{/snippet}
```

---

## Refactoring Checklist

Use this checklist for each page you refactor:

### Pre-Refactor

- [ ] Identify all data queries on the page
- [ ] Note any data that needs to be available outside the boundary (headers, exports)
- [ ] Check for polling/refresh logic that needs cached data
- [ ] Identify if header counts come from loaded data or can be derived elsewhere

### Implementation

- [ ] Enable `experimental.async` in svelte.config.js (if not already)
- [ ] Create skeleton snippet matching content layout
- [ ] Create main content snippet with `<svelte:boundary>`
- [ ] Use `{@const}` for async data fetch
- [ ] Use additional `{@const}` for any derived/computed values
- [ ] Add `{#snippet pending()}` with skeleton
- [ ] Add `{#snippet failed(error, reset)}` with error UI
- [ ] Add `onerror` handler for logging
- [ ] Handle empty state inside the boundary

### Post-Refactor Verification

- [ ] Loading skeleton appears on initial load
- [ ] Data renders correctly after load
- [ ] Error state shows on network failure
- [ ] Retry button works (calls `reset`)
- [ ] Reactive params (filters, search) trigger reload
- [ ] No `state_unsafe_mutation` errors in console
- [ ] Header/counts display correctly (if outside boundary)
- [ ] Polling still works (if applicable)

### Clean Up

- [ ] Remove old `query.loading`, `query.error`, `query.current` patterns
- [ ] Remove manual `isLoading`, `error`, `data` state variables
- [ ] Remove old conditional rendering (`{#if isLoading}...`)
- [ ] Remove any workarounds for the old pattern

---

## Reference Implementation

The cleanest reference implementation is the **todos page**:

```
src/routes/(protected)/[organization_slug]/todos/+page.svelte
```

Key patterns demonstrated:

- Single boundary for main content
- Skeleton snippet with realistic placeholder structure
- Empty state inside boundary
- Error state with retry
- Reactive query params from URL/filters
- Clean separation between UI state and data fetching

---

## Troubleshooting

### "state_unsafe_mutation" Error

**Cause:** You're mutating state inside the boundary template.

**Fix:** Move any state mutations outside the boundary, or restructure to not need cached data.

### Skeleton Flashes Briefly Then Content Appears

**This is expected.** The pending state shows until async work completes. If it's too fast, consider if you need a minimum display time (usually not recommended).

### Error Boundary Doesn't Catch Error

**Check:** Errors in event handlers or `setTimeout` callbacks are NOT caught by boundaries. Only errors during rendering or effects are caught.

### Data Doesn't Update When Params Change

**Check:** Make sure your `queryParams` is derived (`$derived`) and includes all reactive dependencies. The boundary will re-execute when dependencies change.

---

## Further Reading

- [Svelte 5 Boundary Documentation](https://svelte.dev/docs/svelte/svelte-boundary)
- [Svelte 5 Await Expressions](https://svelte.dev/docs/svelte/await-expressions)
- [Svelte 5 Runtime Errors](https://svelte.dev/docs/svelte/runtime-errors)
