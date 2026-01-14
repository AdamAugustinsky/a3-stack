<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { labels, statuses, priorities } from './data.js';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import CheckIcon from '@lucide/svelte/icons/check';
	import TagIcon from '@lucide/svelte/icons/tag';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import type { Task } from '$lib/schemas/todo';

	let {
		selectedRows,
		onBulkStatusChange,
		onBulkPriorityChange,
		onBulkLabelChange,
		onBulkDelete,
		onClearSelection,
		isLoading = false
	}: {
		selectedRows: Task[];
		onBulkStatusChange: (status: string) => void;
		onBulkPriorityChange: (priority: string) => void;
		onBulkLabelChange: (label: string) => void;
		onBulkDelete: () => void;
		onClearSelection: () => void;
		isLoading?: boolean;
	} = $props();

	let selectedCount = $derived(selectedRows.length);
	let isVisible = $derived(selectedCount > 0);

	function handleStatusChange(value: string | undefined) {
		if (value && !isLoading) {
			onBulkStatusChange(value);
		}
	}

	function handlePriorityChange(value: string | undefined) {
		if (value && !isLoading) {
			onBulkPriorityChange(value);
		}
	}

	function handleLabelChange(value: string | undefined) {
		if (value && !isLoading) {
			onBulkLabelChange(value);
		}
	}

	function handleDelete() {
		if (!isLoading) {
			onBulkDelete();
		}
	}

	function handleClear() {
		if (!isLoading) {
			onClearSelection();
		}
	}
</script>

{#if isVisible}
	<div
		class="fixed bottom-6 left-1/2 z-50 w-full max-w-screen-lg -translate-x-1/2 animate-in px-4 duration-300 slide-in-from-bottom-4"
	>
		<div
			class="mx-auto w-fit rounded-xl border bg-background bg-background/95 px-4 py-3 shadow-xl backdrop-blur-sm"
		>
			<div class="flex flex-wrap items-center gap-3">
				<!-- Selection count -->
				<div class="flex shrink-0 items-center gap-2">
					<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
						<CheckIcon class="h-3 w-3 text-primary" />
					</div>
					<span class="text-sm font-medium">
						{selectedCount} selected
					</span>
				</div>

				<Separator orientation="vertical" class="hidden h-6 sm:block" />

				<!-- Actions -->
				<div class="flex flex-wrap items-center gap-2">
					<!-- Status update -->
					<Select.Root
						type="single"
						allowDeselect={false}
						onValueChange={handleStatusChange}
						disabled={isLoading}
					>
						<Select.Trigger class="h-9 w-fit min-w-[140px] gap-2" disabled={isLoading}>
							<CircleDotIcon class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">Status</span>
						</Select.Trigger>
						<Select.Content>
							{#each statuses as status (status.value)}
								<Select.Item value={status.value}>
									<div class="flex items-center">
										<status.icon class="mr-2 h-4 w-4 text-muted-foreground" />
										<span>{status.label}</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<!-- Priority update -->
					<Select.Root
						type="single"
						allowDeselect={false}
						onValueChange={handlePriorityChange}
						disabled={isLoading}
					>
						<Select.Trigger class="h-9 w-fit min-w-[140px] gap-2" disabled={isLoading}>
							<TrendingUpIcon class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">Priority</span>
						</Select.Trigger>
						<Select.Content>
							{#each priorities as priority (priority.value)}
								<Select.Item value={priority.value}>
									<div class="flex items-center">
										<priority.icon class="mr-2 h-4 w-4 text-muted-foreground" />
										<span>{priority.label}</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<!-- Label update -->
					<Select.Root
						type="single"
						allowDeselect={false}
						onValueChange={handleLabelChange}
						disabled={isLoading}
					>
						<Select.Trigger class="h-9 w-fit min-w-[140px] gap-2" disabled={isLoading}>
							<TagIcon class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">Label</span>
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
				</div>

				<Separator orientation="vertical" class="hidden h-6 sm:block" />

				<!-- Action buttons -->
				<div class="flex shrink-0 items-center gap-2">
					<Button
						variant="destructive"
						size="sm"
						onclick={handleDelete}
						disabled={isLoading}
						class="h-9 gap-2"
					>
						{#if isLoading}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							></div>
						{:else}
							<TrashIcon class="h-4 w-4" />
						{/if}
						Delete
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onclick={handleClear}
						disabled={isLoading}
						class="h-9 w-9 p-0"
					>
						<XIcon class="h-4 w-4" />
						<span class="sr-only">Clear selection</span>
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
