<script lang="ts">
  import { orpc } from "$lib/orpc";
  import { createQuery, createMutation } from "@tanstack/svelte-query";
  import TodoDataTable from "./components/todo-data-table.svelte";
  import EditTodoDialog from "./components/edit-todo-dialog.svelte";
  import CreateTodoDialog from "./components/create-todo-dialog.svelte";
  import BulkOperationsDock from "./components/bulk-operations-dock.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import CirclePlusIcon from "@lucide/svelte/icons/circle-plus";
  import type { Task } from "$lib/components/schemas";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let editingTodo = $state<Task>();
  let showEditDialog = $state(false);
  let showCreateDialog = $state(false);
  let selectedTodos = $state<Task[]>([]);
  let clearSelectionSignal = $state(0);

  const todosQuery = createQuery(orpc.todo.getAll.queryOptions());

  const deleteMutation = createMutation(
    orpc.todo.delete.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
      },
      onError: (error) => {
        console.error("Failed to delete todo:", error?.message ?? error);
      },
    }),
  );

  const bulkUpdateMutation = createMutation(
    orpc.todo.bulkUpdate.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
        selectedTodos = [];
        clearSelectionSignal++;
      },
      onError: (error) => {
        console.error("Failed to bulk update todos:", error?.message ?? error);
      },
    }),
  );

  const bulkDeleteMutation = createMutation(
    orpc.todo.bulkDelete.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
        selectedTodos = [];
        clearSelectionSignal++;
      },
      onError: (error) => {
        console.error("Failed to bulk delete todos:", error?.message ?? error);
      },
    }),
  );

  function handleOpenCreateDialog() {
    showCreateDialog = true;
  }

  function handleDeleteTodo(id: number) {
    $deleteMutation.mutate({ id });
  }

  function handleEditTodo(todo: Task) {
    editingTodo = { ...todo };
    showEditDialog = true;
  }

  function handleDuplicateTodo(todo: Task) {
    // Open create dialog with duplicated data
    showCreateDialog = true;
    // The form will be pre-filled in the create dialog
    data.createForm.data = {
      text: `${todo.text} (copy)`,
      label: todo.label,
      status: todo.status,
      priority: todo.priority,
    };
  }

  function handleSelectionChange(selected: Task[]) {
    selectedTodos = selected;
  }

  // Clear selection when any bulk operation completes
  $effect(() => {
    if (!$bulkUpdateMutation.isPending && !$bulkDeleteMutation.isPending) {
      // Selection is already cleared in the mutation onSuccess callbacks
    }
  });

  function handleBulkStatusChange(status: string) {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map(todo => todo.id);
      $bulkUpdateMutation.mutate({
        ids,
        updates: { status: status as any }
      });
    }
  }

  function handleBulkPriorityChange(priority: string) {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map(todo => todo.id);
      $bulkUpdateMutation.mutate({
        ids,
        updates: { priority: priority as any }
      });
    }
  }

  function handleBulkLabelChange(label: string) {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map(todo => todo.id);
      $bulkUpdateMutation.mutate({
        ids,
        updates: { label: label as any }
      });
    }
  }

  function handleBulkDelete() {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map(todo => todo.id);
      $bulkDeleteMutation.mutate({ ids });
    }
  }

  function handleClearSelection() {
    selectedTodos = [];
    clearSelectionSignal++; // Trigger table to clear selection
  }

  const isLoadingTodos = $derived($todosQuery.isLoading);
  const todos = $derived($todosQuery.data ?? []);
  const hasTodos = $derived(todos.length > 0);
</script>

<div class="md:hidden">
  <img
    src="/img/examples/tasks-light.png"
    alt="Tasks"
    class="block dark:hidden"
  />
  <img
    src="/img/examples/tasks-dark.png"
    alt="Tasks"
    class="hidden dark:block"
  />
</div>
<div class="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
  <div class="flex items-center justify-between gap-2">
    <div class="flex flex-col gap-1">
      <h2 class="text-2xl font-semibold tracking-tight">Welcome back!</h2>
      <p class="text-muted-foreground">
        Here&apos;s a list of your tasks for this month.
      </p>
    </div>
    <Button onclick={handleOpenCreateDialog}>
      <CirclePlusIcon class="mr-2 h-4 w-4" />
      Add Task
    </Button>
  </div>
  {#if hasTodos}
    <TodoDataTable
      data={todos}
      onEdit={handleEditTodo}
      onDelete={handleDeleteTodo}
      onDuplicate={handleDuplicateTodo}
      onSelectionChange={handleSelectionChange}
      clearSelectionSignal={clearSelectionSignal}
    />
  {:else}
    <div class="text-center py-8">
      <p class="text-muted-foreground">
        No tasks yet. Add one above to get started!
      </p>
    </div>
  {/if}
</div>

<BulkOperationsDock
  selectedRows={selectedTodos}
  onBulkStatusChange={handleBulkStatusChange}
  onBulkPriorityChange={handleBulkPriorityChange}
  onBulkLabelChange={handleBulkLabelChange}
  onBulkDelete={handleBulkDelete}
  onClearSelection={handleClearSelection}
  isLoading={$bulkUpdateMutation.isPending || $bulkDeleteMutation.isPending}
/>

<CreateTodoDialog
  bind:open={showCreateDialog}
  form={data.createForm}
/>

<EditTodoDialog
  bind:open={showEditDialog}
  bind:todo={editingTodo}
  form={data.updateForm}
/>