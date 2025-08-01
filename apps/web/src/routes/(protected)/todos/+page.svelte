<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { enhance } from "$app/forms";
  import { createMutation } from "@tanstack/svelte-query";
  import { edenTreaty } from "$lib/eden";
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
  let deletingId = $state<number | null>(null);

  // Use the todos from server load function
  let todos = $derived(data.todos);

  // Use svelte-query for bulk operations where forms aren't convenient
  const bulkUpdateMutation = createMutation({
    mutationFn: async ({ ids, updates }: { ids: number[], updates: any }) => {
      const response = await edenTreaty.api.todo.bulk.patch({ ids, updates });
      if (response.error) {
        const errorMessage = response.error.value?.message || 'Failed to bulk update';
        throw new Error(errorMessage);
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateAll();
      selectedTodos = [];
      clearSelectionSignal++;
    },
    onError: (error) => {
      console.error("Failed to bulk update todos:", error?.message ?? error);
    },
  });

  const bulkDeleteMutation = createMutation({
    mutationFn: async ({ ids }: { ids: number[] }) => {
      const response = await edenTreaty.api.todo.bulk.delete({ ids });
      if (response.error) {
        const errorMessage = response.error.value?.message || 'Failed to bulk delete';
        throw new Error(errorMessage);
      }
      return response.data;
    },
    onSuccess: () => {
      invalidateAll();
      selectedTodos = [];
      clearSelectionSignal++;
    },
    onError: (error) => {
      console.error("Failed to bulk delete todos:", error?.message ?? error);
    },
  });

  function handleOpenCreateDialog() {
    showCreateDialog = true;
  }

  function handleDeleteTodo(id: number) {
    deletingId = id;
    // Submit the hidden form
    const form = document.getElementById(`delete-form-${id}`) as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
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

  function handleBulkStatusChange(status: string) {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map((todo) => todo.id);
      $bulkUpdateMutation.mutate({
        ids,
        updates: { status: status as any },
      });
    }
  }

  function handleBulkPriorityChange(priority: string) {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map((todo) => todo.id);
      $bulkUpdateMutation.mutate({
        ids,
        updates: { priority: priority as any },
      });
    }
  }

  function handleBulkLabelChange(label: string) {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map((todo) => todo.id);
      $bulkUpdateMutation.mutate({
        ids,
        updates: { label: label as any },
      });
    }
  }

  function handleBulkDelete() {
    if (selectedTodos.length > 0) {
      const ids = selectedTodos.map((todo) => todo.id);
      $bulkDeleteMutation.mutate({ ids });
    }
  }

  function handleClearSelection() {
    selectedTodos = [];
    clearSelectionSignal++; // Trigger table to clear selection
  }

  const isLoadingTodos = $derived(false); // We're loading from server
  const hasTodos = $derived(todos.length > 0);
  const isBulkOperationPending = $derived($bulkUpdateMutation.isPending || $bulkDeleteMutation.isPending);
</script>

<!-- <div class="md:hidden"> -->
<!--   <img -->
<!--     src="/img/examples/tasks-light.png" -->
<!--     alt="Tasks" -->
<!--     class="block dark:hidden" -->
<!--   /> -->
<!--   <img -->
<!--     src="/img/examples/tasks-dark.png" -->
<!--     alt="Tasks" -->
<!--     class="hidden dark:block" -->
<!--   /> -->
<!-- </div> -->
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
      {clearSelectionSignal}
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
  isLoading={isBulkOperationPending}
/>

<CreateTodoDialog bind:open={showCreateDialog} form={data.createForm} />

<EditTodoDialog
  bind:open={showEditDialog}
  bind:todo={editingTodo}
  form={data.updateForm}
/>

<!-- Hidden delete forms for each todo -->
{#each todos as todo}
  <form
    id="delete-form-{todo.id}"
    method="POST"
    action="?/delete"
    use:enhance={() => {
      return async ({ result, update }) => {
        if (result.type === 'success') {
          deletingId = null;
        }
        await update();
      };
    }}
    class="hidden"
  >
    <input type="hidden" name="id" value={todo.id} />
  </form>
{/each}

