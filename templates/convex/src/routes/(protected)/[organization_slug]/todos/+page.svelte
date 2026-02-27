<script lang="ts">
	import TodoDataTable from './components/todo-data-table.svelte';
	import EditTodoDialog from './components/edit-todo-dialog.svelte';
	import CreateTodoDialog from './components/create-todo-dialog.svelte';
	import BulkOperationsDock from './components/bulk-operations-dock.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
	import type { Task } from '$lib/schemas/todo';
	import { FilterStore } from '$lib/components/filter/filter-store.svelte';
	import { todoFilterConfig } from './filter-config';
	import { page } from '$app/state';
	import { api } from '$convex/api';
	import { applyTaskFilters, toTasks, toTodoId, toTodoIds } from '$lib/convex/todos';
	import { useConvexClient, useQuery } from 'convex-svelte';

	const convex = useConvexClient();

	let editingTodo = $state<Task>();
	let showEditDialog = $state(false);
	let showCreateDialog = $state(false);
	let selectedTodos = $state<Task[]>([]);
	let clearSelectionSignal = $state(0);
	let isBulkOperationPending = $state(false);

	const filterStore = new FilterStore();
	const organizationSlug = $derived(page.params.organization_slug ?? '');

	const todosQuery = useQuery(
		api.todos.listTodos,
		() => (organizationSlug ? { organizationSlug } : 'skip'),
		() => ({ keepPreviousData: true })
	);

	const todos = $derived.by(() => {
		const parsed = toTasks(todosQuery.data);
		const filters = filterStore.toArray();
		return filters.length === 0 ? parsed : applyTaskFilters(parsed, filters);
	});

	function handleOpenCreateDialog() {
		showCreateDialog = true;
	}

	async function handleDeleteTodo(todoId: string) {
		if (!organizationSlug) return;
		try {
			const result = await convex.mutation(api.todos.deleteTodo, {
				organizationSlug,
				todoId: toTodoId(todoId)
			});
			if (!result.deleted) {
				console.error('Todo not found');
			}
		} catch (error) {
			console.error('Failed to delete todo:', error);
		}
	}

	function handleEditTodo(todo: Task) {
		editingTodo = { ...todo };
		showEditDialog = true;
	}

	function handleDuplicateTodo(todo: Task) {
		editingTodo = {
			...todo,
			text: `${todo.text} (copy)`
		};
		showCreateDialog = true;
	}

	function handleSelectionChange(selected: Task[]) {
		selectedTodos = selected;
	}

	async function handleBulkStatusChange(status: string) {
		if (!organizationSlug || selectedTodos.length === 0) return;

		isBulkOperationPending = true;
		try {
			const todoIds = selectedTodos.map((todo) => todo.docId);
			await convex.mutation(api.todos.bulkUpdateTodos, {
				organizationSlug,
				todoIds: toTodoIds(todoIds),
				updates: { status: status as 'backlog' | 'todo' | 'in progress' | 'done' | 'canceled' }
			});
			selectedTodos = [];
			clearSelectionSignal++;
		} catch (error) {
			console.error('Failed to bulk update status:', error);
		} finally {
			isBulkOperationPending = false;
		}
	}

	async function handleBulkPriorityChange(priority: string) {
		if (!organizationSlug || selectedTodos.length === 0) return;

		isBulkOperationPending = true;
		try {
			const todoIds = selectedTodos.map((todo) => todo.docId);
			await convex.mutation(api.todos.bulkUpdateTodos, {
				organizationSlug,
				todoIds: toTodoIds(todoIds),
				updates: { priority: priority as 'low' | 'medium' | 'high' }
			});
			selectedTodos = [];
			clearSelectionSignal++;
		} catch (error) {
			console.error('Failed to bulk update priority:', error);
		} finally {
			isBulkOperationPending = false;
		}
	}

	async function handleBulkLabelChange(label: string) {
		if (!organizationSlug || selectedTodos.length === 0) return;

		isBulkOperationPending = true;
		try {
			const todoIds = selectedTodos.map((todo) => todo.docId);
			await convex.mutation(api.todos.bulkUpdateTodos, {
				organizationSlug,
				todoIds: toTodoIds(todoIds),
				updates: { label: label as 'bug' | 'feature' | 'documentation' }
			});
			selectedTodos = [];
			clearSelectionSignal++;
		} catch (error) {
			console.error('Failed to bulk update label:', error);
		} finally {
			isBulkOperationPending = false;
		}
	}

	async function handleBulkDelete() {
		if (!organizationSlug || selectedTodos.length === 0) return;

		isBulkOperationPending = true;
		try {
			const todoIds = selectedTodos.map((todo) => todo.docId);
			const result = await convex.mutation(api.todos.bulkDeleteTodos, {
				organizationSlug,
				todoIds: toTodoIds(todoIds)
			});
			if (result.deletedCount === 0) {
				console.error('No todos were deleted');
			}
			selectedTodos = [];
			clearSelectionSignal++;
		} catch (error) {
			console.error('Failed to bulk delete todos:', error);
		} finally {
			isBulkOperationPending = false;
		}
	}

	function handleClearSelection() {
		selectedTodos = [];
		clearSelectionSignal++;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
			const target = e.target as HTMLElement;
			if (
				target.tagName !== 'INPUT' &&
				target.tagName !== 'TEXTAREA' &&
				!target.isContentEditable
			) {
				e.preventDefault();
				handleOpenCreateDialog();
			}
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

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
	{#if todosQuery.isLoading}
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
	{:else if todos.length > 0}
		<TodoDataTable
			data={todos}
			onEdit={handleEditTodo}
			onDelete={handleDeleteTodo}
			onDuplicate={handleDuplicateTodo}
			onSelectionChange={handleSelectionChange}
			{clearSelectionSignal}
			{filterStore}
			{todoFilterConfig}
		/>
	{:else}
		<div class="rounded-xl border bg-background py-16 text-center shadow-sm">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<CirclePlusIcon class="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 class="mt-4 text-sm font-semibold">No tasks yet</h3>
			<p class="mt-1 text-sm text-muted-foreground">Get started by creating your first task.</p>
			<div class="mt-6">
				<Button onclick={handleOpenCreateDialog}>
					<CirclePlusIcon class="mr-2 h-4 w-4" />
					Add Task
				</Button>
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
		<Button onclick={handleOpenCreateDialog} variant="default" class="group">
			<CirclePlusIcon class="mr-2 h-4 w-4" />
			Add Task
			<Kbd.Root class="ml-1.5 border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground">C</Kbd.Root>
		</Button>
	</div>
	{@render TodoList()}
</div>

<BulkOperationsDock
	selectedRows={selectedTodos}
	onBulkStatusChange={handleBulkStatusChange}
	onBulkPriorityChange={handleBulkPriorityChange}
	onBulkLabelChange={handleBulkLabelChange}
	onBulkDelete={handleBulkDelete}
	onClearSelection={handleClearSelection}
	isLoading={isBulkOperationPending}
/>

<CreateTodoDialog bind:open={showCreateDialog} />

<EditTodoDialog bind:open={showEditDialog} bind:todo={editingTodo} />
