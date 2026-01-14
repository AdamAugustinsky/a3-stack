<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { labels, statuses, priorities } from './data.js';
	import type { Task } from '$lib/schemas/todo';
	import { updateTodo } from '$lib/remote/todo.remote';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import Label from '@/components/ui/label/label.svelte';
	import { page } from '$app/state';

	let {
		open = $bindable(),
		todo = $bindable()
	}: {
		open: boolean;
		todo: Task | undefined;
	} = $props();

	let updateTodoError = $state<string | undefined>();
	let isLoading = $state(false);

	// Form state that tracks the edited values
	let text = $state('');
	let label = $state<'bug' | 'feature' | 'documentation'>('feature');
	let status = $state<'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'>('todo');
	let priority = $state<'low' | 'medium' | 'high'>('medium');

	// Update form when todo changes
	$effect(() => {
		if (todo && open) {
			text = todo.text;
			label = todo.label;
			status = todo.status;
			priority = todo.priority;
		}
	});

	// Reset form when dialog closes
	$effect(() => {
		if (!open) {
			updateTodoError = undefined;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[525px]">
		<Dialog.Header>
			<Dialog.Title>Edit Task</Dialog.Title>
			<Dialog.Description>
				Update your task details below. Click save when you're done.
			</Dialog.Description>
		</Dialog.Header>

		{#if todo}
			<form
				{...updateTodo.enhance(async ({ submit }) => {
					updateTodoError = undefined;
					isLoading = true;
					try {
						await submit();
						// Success - close dialog
						open = false;
						todo = undefined;
					} catch (error) {
						if (isHttpError(error)) {
							updateTodoError = error.body.message;
						} else {
							updateTodoError = 'An unexpected error occurred. Please try again.';
						}
					} finally {
						isLoading = false;
					}
				})}
				class="mt-6 space-y-6"
			>
				<input type="hidden" name="id" value={todo.id} />
				<input type="hidden" name="organizationSlug" value={page.params.organization_slug} />

				{#if updateTodoError}
					<Alert.Root variant="destructive">
						<CircleAlertIcon class="size-4" />
						<Alert.Title>Error</Alert.Title>
						<Alert.Description>{updateTodoError}</Alert.Description>
					</Alert.Root>
				{/if}

				<div>
					<Label for="task-title">Task Title <span class="text-destructive">*</span></Label>
					<Textarea
						id="task-title"
						name="text"
						bind:value={text}
						placeholder="What needs to be done?"
						rows={2}
						class="resize-none"
					/>
					<p class="text-sm text-muted-foreground">Give your task a clear, descriptive title.</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-3">
					<div>
						<Label for="label">Label</Label>
						<Select.Root type="single" allowDeselect={false} name="label" bind:value={label}>
							<Select.Trigger class="w-full">
								<Badge variant="outline" class="font-normal">
									{labels.find((l) => l.value === label)?.label}
								</Badge>
							</Select.Trigger>
							<Select.Content>
								{#each labels as labelOption (labelOption.value)}
									<Select.Item value={labelOption.value}>
										<Badge variant="outline" class="font-normal">
											{labelOption.label}
										</Badge>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="status">Status</Label>
						<Select.Root type="single" allowDeselect={false} name="status" bind:value={status}>
							<Select.Trigger class="w-full">
								{@const currentStatus = statuses.find((s) => s.value === status)}
								{#if currentStatus}
									<div class="flex items-center">
										<currentStatus.icon class="mr-2 h-4 w-4 text-muted-foreground" />
										<span>{currentStatus.label}</span>
									</div>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each statuses as statusOption (statusOption.value)}
									<Select.Item value={statusOption.value}>
										<div class="flex items-center">
											<statusOption.icon class="mr-2 h-4 w-4 text-muted-foreground" />
											<span>{statusOption.label}</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div>
						<Label for="priority">Priority</Label>
						<Select.Root type="single" allowDeselect={false} name="priority" bind:value={priority}>
							<Select.Trigger class="w-full">
								{@const currentPriority = priorities.find((p) => p.value === priority)}
								{#if currentPriority}
									<div class="flex items-center">
										<currentPriority.icon class="mr-2 h-4 w-4 text-muted-foreground" />
										<span>{currentPriority.label}</span>
									</div>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each priorities as priorityOption (priorityOption.value)}
									<Select.Item value={priorityOption.value}>
										<div class="flex items-center">
											<priorityOption.icon class="mr-2 h-4 w-4 text-muted-foreground" />
											<span>{priorityOption.label}</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<Dialog.Footer class="gap-2 sm:gap-0">
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							open = false;
							todo = undefined;
						}}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading || !text?.trim()}>
						{#if isLoading}
							<div
								class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
							></div>
							Saving...
						{:else}
							Save changes
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
