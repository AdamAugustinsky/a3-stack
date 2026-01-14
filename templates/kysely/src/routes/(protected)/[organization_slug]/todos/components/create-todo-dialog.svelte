<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { labels, statuses, priorities } from './data.js';
	import { createTodo } from '$lib/remote/todo.remote';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import TextIcon from '@lucide/svelte/icons/text';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { isValidationError, extractFieldErrors } from '$lib/utils/validation-errors.js';
	import { page } from '$app/state';

	let {
		open = $bindable()
	}: {
		open: boolean;
	} = $props();

	let createTodoError = $state<string | undefined>();
	let fieldErrors = $state<Record<string, string>>({});
	let isLoading = $state(false);

	// Reset form state when dialog closes
	$effect(() => {
		if (!open) {
			createTodoError = undefined;
			fieldErrors = {};
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 p-0 sm:max-w-md">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">New Task</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Add a task to your list
			</Dialog.Description>
		</Dialog.Header>

		<form
			{...createTodo.enhance(async ({ submit }) => {
				createTodoError = undefined;
				fieldErrors = {};
				isLoading = true;
				try {
					await submit();
					open = false;
				} catch (error) {
					if (isHttpError(error)) {
						if (isValidationError(error.body)) {
							fieldErrors = extractFieldErrors(error.body.errors.nested);
							createTodoError = 'Please fix the errors below.';
						} else {
							createTodoError = error.body.message;
						}
					} else {
						createTodoError = 'An unexpected error occurred. Please try again.';
					}
				} finally {
					isLoading = false;
				}
			})}
			class="flex flex-col"
		>
			<input type="hidden" name="organizationSlug" value={page.params.organization_slug} />

			<div class="space-y-3.5 px-5 py-4">
				{#if createTodoError}
					<Alert.Root variant="destructive" class="py-2.5">
						<CircleAlertIcon class="size-4" />
						<Alert.Description class="text-sm">{createTodoError}</Alert.Description>
					</Alert.Root>
				{/if}

				<Field.Field class="gap-1.5">
					<Field.Label for="task-title" class="text-sm font-medium">
						Title
						<span class="text-destructive">*</span>
					</Field.Label>
					<InputGroup.Root
						class={fieldErrors.text ? 'border-destructive ring-destructive/20' : ''}
					>
						<InputGroup.Addon>
							<TextIcon class="size-4 text-muted-foreground" />
						</InputGroup.Addon>
						<InputGroup.Input
							id="task-title"
							placeholder="What needs to be done?"
							name="text"
						/>
					</InputGroup.Root>
					{#if fieldErrors.text}
						<Field.Error>{fieldErrors.text}</Field.Error>
					{/if}
				</Field.Field>

				<div class="grid grid-cols-3 gap-2.5">
					<Field.Field class="gap-1.5">
						<Field.Label for="label" class="text-sm font-medium">Label</Field.Label>
						<Select.Root type="single" allowDeselect={false} name="label" value="feature">
							<Select.Trigger
								class="w-full {fieldErrors.label ? 'border-destructive' : ''}"
								id="label"
							>
								<Badge variant="outline" class="font-normal">
									{labels.find((l) => l.value === 'feature')?.label}
								</Badge>
							</Select.Trigger>
							<Select.Content>
								{#each labels as label (label.value)}
									<Select.Item value={label.value}>
										<Badge variant="outline" class="font-normal">
											{label.label}
										</Badge>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if fieldErrors.label}
							<Field.Error>{fieldErrors.label}</Field.Error>
						{/if}
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="status" class="text-sm font-medium">Status</Field.Label>
						<Select.Root type="single" allowDeselect={false} name="status" value="todo">
							<Select.Trigger
								class="w-full {fieldErrors.status ? 'border-destructive' : ''}"
								id="status"
							>
								{@const currentStatus = statuses.find((s) => s.value === 'todo')}
								{#if currentStatus}
									<span class="flex items-center gap-2">
										<currentStatus.icon class="size-4 text-muted-foreground" />
										<span class="truncate">{currentStatus.label}</span>
									</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each statuses as status (status.value)}
									<Select.Item value={status.value}>
										<span class="flex items-center gap-2">
											<status.icon class="size-4 text-muted-foreground" />
											<span>{status.label}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if fieldErrors.status}
							<Field.Error>{fieldErrors.status}</Field.Error>
						{/if}
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="priority" class="text-sm font-medium">Priority</Field.Label>
						<Select.Root type="single" allowDeselect={false} name="priority" value="medium">
							<Select.Trigger
								class="w-full {fieldErrors.priority ? 'border-destructive' : ''}"
								id="priority"
							>
								{@const currentPriority = priorities.find((p) => p.value === 'medium')}
								{#if currentPriority}
									<span class="flex items-center gap-2">
										<currentPriority.icon class="size-4 text-muted-foreground" />
										<span class="truncate">{currentPriority.label}</span>
									</span>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each priorities as priority (priority.value)}
									<Select.Item value={priority.value}>
										<span class="flex items-center gap-2">
											<priority.icon class="size-4 text-muted-foreground" />
											<span>{priority.label}</span>
										</span>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if fieldErrors.priority}
							<Field.Error>{fieldErrors.priority}</Field.Error>
						{/if}
					</Field.Field>
				</div>
			</div>

			<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
				<Button type="button" variant="ghost" size="sm" onclick={() => (open = false)}>
					Cancel
				</Button>
				<Button type="submit" size="sm" disabled={isLoading}>
					{#if isLoading}
						<Spinner class="mr-2 size-4" />
						Creating...
					{:else}
						Create task
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
