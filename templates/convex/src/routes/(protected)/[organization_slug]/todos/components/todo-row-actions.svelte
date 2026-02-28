<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import type { Task } from '$lib/schemas/todo';
	import EditTodoDialog from './edit-todo-dialog.svelte';
	import CreateTodoDialog from './create-todo-dialog.svelte';

	let {
		task,
		onDelete
	}: {
		task: Task;
		onDelete: () => void | Promise<void>;
	} = $props();

	let showEditDialog = $state(false);
	let showDuplicateDialog = $state(false);
</script>

<EditTodoDialog bind:open={showEditDialog} todo={task} />
<CreateTodoDialog bind:open={showDuplicateDialog} initialTodo={task} />

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" class="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
				<EllipsisIcon />
				<span class="sr-only">Open Menu</span>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-40" align="end">
		<DropdownMenu.Item onclick={() => (showEditDialog = true)}>
			Edit
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => (showDuplicateDialog = true)}>
			Make a copy
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item onclick={() => void onDelete()}>
			Delete
			<DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
