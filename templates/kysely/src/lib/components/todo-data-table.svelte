<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import CircleIcon from '@lucide/svelte/icons/circle';

	interface Todo {
		id: number;
		text: string;
		status: 'backlog' | 'todo' | 'in progress' | 'done' | 'canceled';
		priority: 'low' | 'medium' | 'high';
		label: 'bug' | 'feature' | 'documentation';
		completed: boolean;
	}

	interface Props {
		todos: Todo[];
	}

	const { todos }: Props = $props();

	const statusColors = {
		backlog: 'text-gray-500',
		todo: 'text-blue-500',
		'in progress': 'text-yellow-500',
		done: 'text-green-500',
		canceled: 'text-red-500'
	};

	const priorityColors = {
		low: 'bg-gray-100 text-gray-800',
		medium: 'bg-yellow-100 text-yellow-800',
		high: 'bg-red-100 text-red-800'
	};

	const labelColors = {
		bug: 'bg-red-100 text-red-800',
		feature: 'bg-blue-100 text-blue-800',
		documentation: 'bg-purple-100 text-purple-800'
	};
</script>

<div class="px-4 lg:px-6">
	<h3 class="mb-4 text-lg font-semibold">Recent Todos</h3>
	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-12"></Table.Head>
					<Table.Head>Task</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Priority</Table.Head>
					<Table.Head>Label</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if todos.length > 0}
					{#each todos as todo (todo.id)}
						<Table.Row>
							<Table.Cell>
								{#if todo.completed}
									<CheckCircleIcon class="size-5 text-green-500" />
								{:else}
									<CircleIcon class="size-5 text-gray-400" />
								{/if}
							</Table.Cell>
							<Table.Cell class="font-medium">{todo.text}</Table.Cell>
							<Table.Cell>
								<span class={`font-medium ${statusColors[todo.status]}`}>
									{todo.status}
								</span>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary" class={priorityColors[todo.priority]}>
									{todo.priority}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary" class={labelColors[todo.label]}>
									{todo.label}
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground">
							No todos found
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</div>
