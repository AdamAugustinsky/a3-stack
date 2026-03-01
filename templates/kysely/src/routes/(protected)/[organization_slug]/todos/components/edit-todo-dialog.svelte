<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { labels, statuses, priorities } from './data.js';
	import type { Task } from '$lib/schemas/todo';
	import { updateTodo } from '$lib/remote/todo.remote';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { page } from '$app/state';

	let {
		open = $bindable(),
		todo = $bindable()
	}: {
		open: boolean;
		todo: Task | undefined;
	} = $props();

	type TaskFields = Pick<Task, 'text' | 'label' | 'status' | 'priority'>;

	let fields = $state<TaskFields>({
		text: '',
		label: 'feature',
		status: 'todo',
		priority: 'medium'
	});

	let updateTodoError = $state<string | undefined>();
	let isLoading = $state(false);

	$effect(() => {
		if (!open || !todo) return;
		fields = {
			text: todo.text,
			label: todo.label,
			status: todo.status,
			priority: todo.priority
		};
		updateTodoError = undefined;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-md">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Edit Task</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Update your task details below.
			</Dialog.Description>
		</Dialog.Header>

		{#if todo}
			<form
				{...updateTodo.enhance(async ({ submit }) => {
					updateTodoError = undefined;
					isLoading = true;
					try {
						await submit();
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
				class="flex flex-col"
			>
				<input type="hidden" name="id" value={todo.id} />
				<input type="hidden" name="organizationSlug" value={page.params.organization_slug} />

				<div class="space-y-3.5 px-5 py-4">
					{#if updateTodoError}
						<Alert.Root variant="destructive" class="py-2.5">
							<CircleAlertIcon class="size-4" />
							<Alert.Description class="text-sm">{updateTodoError}</Alert.Description>
						</Alert.Root>
					{/if}

					<Field.Field class="gap-1.5">
						<Field.Label for="task-title" class="text-sm font-medium">
							Title
							<span class="text-destructive">*</span>
						</Field.Label>
						<Textarea
							id="task-title"
							name="text"
							bind:value={fields.text}
							placeholder="What needs to be done?"
							rows={2}
							class="resize-none"
						/>
					</Field.Field>

					<div class="grid grid-cols-3 gap-2.5">
						<Field.Field class="gap-1.5">
							<Field.Label for="label" class="text-sm font-medium">Label</Field.Label>
							<Select.Root type="single" allowDeselect={false} name="label" bind:value={fields.label}>
								<Select.Trigger class="w-full" id="label">
									<Badge variant="outline" class="font-normal">
										{labels.find((l) => l.value === fields.label)?.label}
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
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="status" class="text-sm font-medium">Status</Field.Label>
							<Select.Root type="single" allowDeselect={false} name="status" bind:value={fields.status}>
								<Select.Trigger class="w-full" id="status">
									{@const currentStatus = statuses.find((s) => s.value === fields.status)}
									{#if currentStatus}
										<span class="flex items-center gap-2">
											<currentStatus.icon class="size-4 text-muted-foreground" />
											<span class="truncate">{currentStatus.label}</span>
										</span>
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each statuses as statusOption (statusOption.value)}
										<Select.Item value={statusOption.value}>
											<span class="flex items-center gap-2">
												<statusOption.icon class="size-4 text-muted-foreground" />
												<span>{statusOption.label}</span>
											</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Field>

						<Field.Field class="gap-1.5">
							<Field.Label for="priority" class="text-sm font-medium">Priority</Field.Label>
							<Select.Root type="single" allowDeselect={false} name="priority" bind:value={fields.priority}>
								<Select.Trigger class="w-full" id="priority">
									{@const currentPriority = priorities.find((p) => p.value === fields.priority)}
									{#if currentPriority}
										<span class="flex items-center gap-2">
											<currentPriority.icon class="size-4 text-muted-foreground" />
											<span class="truncate">{currentPriority.label}</span>
										</span>
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each priorities as priorityOption (priorityOption.value)}
										<Select.Item value={priorityOption.value}>
											<span class="flex items-center gap-2">
												<priorityOption.icon class="size-4 text-muted-foreground" />
												<span>{priorityOption.label}</span>
											</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Field>
					</div>
				</div>

				<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={() => {
							open = false;
							todo = undefined;
						}}
					>
						Cancel
					</Button>
					<Button type="submit" size="sm" disabled={isLoading}>
						{#if isLoading}
							<Spinner class="mr-2 size-4" />
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
