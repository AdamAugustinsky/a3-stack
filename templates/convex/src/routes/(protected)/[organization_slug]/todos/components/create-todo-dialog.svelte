<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { labels, statuses, priorities } from './data.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import TextIcon from '@lucide/svelte/icons/text';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { page } from '$app/state';
	import { api } from '$convex/api';
	import { convexForm } from 'convex-sveltekit';
	import * as v from 'valibot';

	let {
		open = $bindable()
	}: {
		open: boolean;
	} = $props();

	const organizationSlug = $derived(page.params.organization_slug ?? '');

	let text = $state('');
	let label = $state<'bug' | 'feature' | 'documentation'>('feature');
	let status = $state<'backlog' | 'todo' | 'in progress' | 'done' | 'canceled'>('todo');
	let priority = $state<'low' | 'medium' | 'high'>('medium');

	let createTodoError = $state<string | undefined>();

	const createTodoSchema = v.object({
		text: v.pipe(
			v.string('Task description is required'),
			v.trim(),
			v.nonEmpty('Task description is required')
		)
	});

	const createTodoForm = convexForm(createTodoSchema, api.todos.createTodo, (data) => {
		if (!organizationSlug) {
			throw new Error('Organization slug is required');
		}

		return {
			organizationSlug,
			text: data.text.trim(),
			completed: false,
			priority,
			status,
			label
		};
	});

	const createTodoSubmit = createTodoForm.enhance(async ({ submit }) => {
		createTodoError = undefined;
		try {
			await submit();
			open = false;
		} catch (error) {
			createTodoError =
				error instanceof Error
					? error.message
					: 'An unexpected error occurred. Please try again.';
		}
	});

	$effect(() => {
		if (!open) {
			text = '';
			label = 'feature';
			status = 'todo';
			priority = 'medium';
			createTodoError = undefined;
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

		<form {...createTodoSubmit} class="flex flex-col">
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
						class={
							createTodoForm.fields.text.issues()?.length
								? 'border-destructive ring-destructive/20'
								: ''
						}
					>
						<InputGroup.Addon>
							<TextIcon class="size-4 text-muted-foreground" />
						</InputGroup.Addon>
						<InputGroup.Input
							id="task-title"
							placeholder="What needs to be done?"
							name="text"
							required
							bind:value={text}
						/>
					</InputGroup.Root>
					{#if createTodoForm.fields.text.issues()?.[0]}
						<Field.Error>{createTodoForm.fields.text.issues()?.[0]?.message}</Field.Error>
					{/if}
				</Field.Field>

				<div class="grid grid-cols-3 gap-2.5">
					<Field.Field class="gap-1.5">
						<Field.Label for="label" class="text-sm font-medium">Label</Field.Label>
						<Select.Root type="single" allowDeselect={false} name="label" bind:value={label}>
							<Select.Trigger class="w-full" id="label">
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
					</Field.Field>

					<Field.Field class="gap-1.5">
						<Field.Label for="status" class="text-sm font-medium">Status</Field.Label>
						<Select.Root type="single" allowDeselect={false} name="status" bind:value={status}>
							<Select.Trigger class="w-full" id="status">
								{@const currentStatus = statuses.find((s) => s.value === status)}
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
						<Select.Root
							type="single"
							allowDeselect={false}
							name="priority"
							bind:value={priority}
						>
							<Select.Trigger
								class="w-full"
								id="priority"
							>
								{@const currentPriority = priorities.find((p) => p.value === priority)}
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
				<Button type="button" variant="ghost" size="sm" onclick={() => (open = false)}>
					Cancel
				</Button>
				<Button type="submit" size="sm" disabled={createTodoForm.pending > 0}>
					{#if createTodoForm.pending > 0}
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
