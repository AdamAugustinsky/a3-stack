<script lang="ts" generics="TData">
  import XIcon from "@lucide/svelte/icons/x";
  import type { Table } from "@tanstack/table-core";
  import Button from "$lib/components/ui/button/button.svelte";
  import TodoDataTableViewOptions from "./todo-data-table-view-options.svelte";
  import TodoDataTableFacetedFilter from "./todo-data-table-faceted-filter.svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import { priorities, statuses } from "./data.js";

  let { table }: { table: Table<TData> } = $props();

  const isFiltered = $derived(table.getState().columnFilters.length > 0);
  const statusCol = $derived(table.getColumn("status"));
  const priorityCol = $derived(table.getColumn("priority"));
</script>

<div class="flex items-center justify-between">
  <div class="flex flex-1 items-center space-x-2">
    <Input
      placeholder="Filter tasks..."
      value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
      oninput={(e) => {
        table.getColumn("text")?.setFilterValue(e.currentTarget.value);
      }}
      onchange={(e) => {
        table.getColumn("text")?.setFilterValue(e.currentTarget.value);
      }}
      class="h-8 w-[150px] lg:w-[250px]"
    />

    {#if statusCol}
      <TodoDataTableFacetedFilter
        column={statusCol}
        title="Status"
        options={statuses}
      />
    {/if}
    {#if priorityCol}
      <TodoDataTableFacetedFilter
        column={priorityCol}
        title="Priority"
        options={priorities}
      />
    {/if}

    {#if isFiltered}
      <Button
        variant="ghost"
        onclick={() => table.resetColumnFilters()}
        class="h-8 px-2 lg:px-3"
      >
        Reset
        <XIcon />
      </Button>
    {/if}
  </div>
  <TodoDataTableViewOptions {table} />
</div>
