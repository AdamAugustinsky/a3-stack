<script lang="ts">
  import { orpc } from "$lib/orpc";
  import { createQuery, createMutation } from "@tanstack/svelte-query";
  import TodoDataTable from "./components/todo-data-table.svelte";
  import type { NewTask } from "$lib/components/schemas";

  let newTodo = $state<NewTask>();

  const todosQuery = createQuery(orpc.todo.getAll.queryOptions());

  const addMutation = createMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
        newTodo = undefined;
      },
      onError: (error) => {
        console.error("Failed to create todo:", error?.message ?? error);
      },
    }),
  );

  const toggleMutation = createMutation(
    orpc.todo.toggle.mutationOptions({
      onSuccess: () => {
        $todosQuery.refetch();
      },
      onError: (error) => {
        console.error("Failed to toggle todo:", error?.message ?? error);
      },
    }),
  );

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

  function handleAddTodo(event: SubmitEvent) {
    event.preventDefault();
    if (newTodo) {
      $addMutation.mutate(newTodo);
    }
  }

  function handleToggleTodo(id: number, completed: boolean) {
    $toggleMutation.mutate({ id, completed: !completed });
  }

  function handleDeleteTodo(id: number) {
    $deleteMutation.mutate({ id });
  }

  const isAdding = $derived($addMutation.isPending);
  const canAdd = $derived(
    !isAdding && newTodo && newTodo.text.trim().length > 0,
  );
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
  </div>
  {#if hasTodos}
    <TodoDataTable data={todos} />
  {:else}
    <div class="text-center py-8">
      <p class="text-muted-foreground">
        No tasks yet. Add one above to get started!
      </p>
    </div>
  {/if}
</div>
