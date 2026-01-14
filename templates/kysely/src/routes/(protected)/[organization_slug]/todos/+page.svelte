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
	import { getTodos, deleteTodo, bulkUpdateTodos, bulkDeleteTodos } from '$lib/remote/todo.remote';
	import { FilterStore } from '$lib/components/filter/filter-store.svelte';
	import { todoFilterConfig } from './filter-config';
	import { page } from '$app/state';

	let editingTodo = $state<Task>();
	let showEditDialog = $state(false);
	let showCreateDialog = $state(false);
	let selectedTodos = $state<Task[]>([]);
	let clearSelectionSignal = $state(0);
	let isBulkOperationPending = $state(false);

	// Create filter store instance
	const filterStore = new FilterStore();

	// Query params reactive to filter changes
	const queryParams = $derived({
		organizationSlug: page.params.organization_slug!,
		filters: filterStore.toArray()
	});

	function handleOpenCreateDialog() {
		showCreateDialog = true;
	}

	async function handleDeleteTodo(id: number) {
		try {
			await deleteTodo({
				organizationSlug: page.params.organization_slug!,
				id,
				filters: filterStore.toArray()
			});
		} catch (error) {
			console.error('Failed to delete todo:', error);
		}
	}

	function handleEditTodo(todo: Task) {
		editingTodo = { ...todo };
		showEditDialog = true;
	}

	function handleDuplicateTodo(todo: Task) {
		// Open create dialog with duplicated data
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
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkUpdateTodos({
					organizationSlug: page.params.organization_slug!,
					ids,
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
	}

	async function handleBulkPriorityChange(priority: string) {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkUpdateTodos({
					organizationSlug: page.params.organization_slug!,
					ids,
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
	}

	async function handleBulkLabelChange(label: string) {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkUpdateTodos({
					organizationSlug: page.params.organization_slug!,
					ids,
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
	}

	async function handleBulkDelete() {
		if (selectedTodos.length > 0) {
			isBulkOperationPending = true;
			try {
				const ids = selectedTodos.map((todo) => todo.id);
				await bulkDeleteTodos({
					organizationSlug: page.params.organization_slug!,
					ids,
					filters: filterStore.toArray()
				});
				selectedTodos = [];
				clearSelectionSignal++;
			} catch (error) {
				console.error('Failed to bulk delete todos:', error);
			} finally {
				isBulkOperationPending = false;
			}
		}
	}

	function handleClearSelection() {
		selectedTodos = [];
		clearSelectionSignal++; // Trigger table to clear selection
	}

	function handleKeydown(e: KeyboardEvent) {
		// Only trigger if 'c' is pressed without modifiers and not typing in an input
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
	<svelte:boundary onerror={(e) => console.error('TodoList fetch failed:', e)}>
		{@const todos = await getTodos(queryParams)}

		{#if todos.length > 0}
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

		{#snippet pending()}
			{@render TodoTableSkeleton()}
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="rounded-xl border bg-background py-16 text-center shadow-sm">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
					<AlertCircleIcon class="h-6 w-6 text-destructive" />
				</div>
				<h3 class="mt-4 text-sm font-semibold text-destructive">Failed to load tasks</h3>
				<p class="mt-1 text-sm text-muted-foreground">There was an error loading your tasks. Please try again.</p>
				<div class="mt-6">
					<Button variant="outline" onclick={reset}>
						Try again
					</Button>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
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
			<Kbd.Root class="ml-1.5 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">C</Kbd.Root>
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
