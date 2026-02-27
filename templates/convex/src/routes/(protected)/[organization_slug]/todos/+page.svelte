<script lang="ts">
	import TodoDataTable from './components/todo-data-table.svelte';
	import CreateTodoDialog from './components/create-todo-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
	import { FilterStore } from '$lib/components/filter/filter-store.svelte';
	import { todoFilterConfig } from './filter-config';
	import { page } from '$app/state';
	import { toTasks } from '$lib/convex/todos';
	import { convexQuery } from 'convex-sveltekit';
	import { api } from '$convex/api';

	const filterStore = new FilterStore();
	const organizationSlug = $derived(page.params.organization_slug ?? '');
	const todosQuery = convexQuery(api.todos.listTodos, () => {
		if (!organizationSlug) {
			return 'skip';
		}
		const filters = page.url.searchParams.get('filters');
		return filters ? { organizationSlug, filters } : { organizationSlug };
	}, {
		keepPreviousData: true
	});
	const todos = $derived(toTasks(todosQuery.data));
	const showInitialSkeleton = $derived(todosQuery.isLoading && todosQuery.current === undefined);
	const isRefreshingFilters = $derived(todosQuery.isStale);

	const hasActiveFilters = $derived(filterStore.toArray().length > 0);
</script>

{#snippet TodoTableSkeleton()}
	<div class="rounded-xl border bg-background shadow-sm">
		<div class="flex items-center justify-between gap-2 border-b p-4">
			<div class="flex flex-1 items-center gap-2">
				<Skeleton class="h-9 w-64" />
				<Skeleton class="h-9 w-24" />
				<Skeleton class="h-9 w-24" />
				<Skeleton class="h-9 w-24" />
			</div>
			<Skeleton class="h-9 w-28" />
		</div>
		{#each Array(8) as _, i (i)}
			<div class="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
				<Skeleton class="h-4 w-4" />
				<Skeleton class="h-4 w-20" />
				<Skeleton class="h-4 flex-1" />
				<Skeleton class="h-6 w-16 rounded-md" />
				<Skeleton class="h-6 w-20 rounded-md" />
				<Skeleton class="h-6 w-16 rounded-md" />
			</div>
		{/each}
		<div class="flex items-center justify-between border-t px-4 py-3">
			<Skeleton class="h-4 w-32" />
			<div class="flex items-center gap-2">
				<Skeleton class="h-8 w-8" />
				<Skeleton class="h-8 w-8" />
			</div>
		</div>
	</div>
{/snippet}

{#snippet TodoList()}
	{#if showInitialSkeleton}
		{@render TodoTableSkeleton()}
	{:else if todosQuery.error}
		<div class="rounded-xl border bg-background py-16 text-center shadow-sm">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
				<AlertCircleIcon class="h-6 w-6 text-destructive" />
			</div>
			<h3 class="mt-4 text-sm font-semibold text-destructive">Failed to load tasks</h3>
			<p class="mt-1 text-sm text-muted-foreground">There was an error loading your tasks. Please try again.</p>
			<div class="mt-6">
				<Button variant="outline" onclick={() => window.location.reload()}>
					Try again
				</Button>
			</div>
		</div>
	{:else if todos.length > 0 || hasActiveFilters}
			<TodoDataTable
				data={todos}
				{organizationSlug}
				{filterStore}
				{todoFilterConfig}
				isRefreshing={isRefreshingFilters}
			/>
	{:else}
		<div class="rounded-xl border bg-background py-16 text-center shadow-sm">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<CirclePlusIcon class="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-sm font-semibold">No tasks yet</h3>
			<p class="mt-1 text-sm text-muted-foreground">Get started by creating your first task.</p>
			<div class="mt-6">
				<CreateTodoDialog>
					{#snippet trigger({ props }: { props: Record<string, unknown> })}
						<Button {...props} type="button">
							<CirclePlusIcon class="mr-2 h-4 w-4" />
							Add Task
						</Button>
					{/snippet}
				</CreateTodoDialog>
			</div>
		</div>
	{/if}
{/snippet}

<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Todos!</h2>
			<p class="text-muted-foreground">Here&apos;s a list of your tasks for this month.</p>
		</div>
		<CreateTodoDialog enableShortcut={true}>
			{#snippet trigger({ props }: { props: Record<string, unknown> })}
				<Button {...props} type="button" variant="default" class="group">
					<CirclePlusIcon class="mr-2 h-4 w-4" />
					Add Task
					<Kbd.Root class="ml-1.5 border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground">C</Kbd.Root>
				</Button>
			{/snippet}
		</CreateTodoDialog>
	</div>
	{@render TodoList()}
</div>
