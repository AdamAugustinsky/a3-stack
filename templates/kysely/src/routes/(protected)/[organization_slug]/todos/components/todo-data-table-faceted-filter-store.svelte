<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import PlusCircleIcon from '@lucide/svelte/icons/plus-circle';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn } from '$lib/utils.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { FilterStore } from '$lib/components/filter/filter-store.svelte';

	interface Option {
		label: string;
		value: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon?: any;
	}

	let {
		field,
		title,
		options,
		filterStore
	}: {
		field: string;
		title?: string;
		options: Option[];
		filterStore: FilterStore;
	} = $props();

	// Get currently selected values for this field
	const selectedValues = $derived.by(() => {
		const fieldFilters = filterStore.filters.filter(
			(f) => f.field === field && (f.operator === 'is' || f.operator === 'is_any_of')
		);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const values = new Set<string>();

		for (const filter of fieldFilters) {
			if (Array.isArray(filter.value)) {
				filter.value.forEach((v) => values.add(String(v)));
			} else if (filter.value !== null && filter.value !== undefined) {
				values.add(String(filter.value));
			}
		}

		return values;
	});

	function toggleValue(value: string) {
		// Get current values and toggle the clicked value
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const currentValues = new Set(selectedValues);
		if (currentValues.has(value)) {
			currentValues.delete(value);
		} else {
			currentValues.add(value);
		}

		// Remove existing filters for this field with 'is' or 'is_any_of' operators
		filterStore.filters = filterStore.filters.filter(
			(f) => !(f.field === field && (f.operator === 'is' || f.operator === 'is_any_of'))
		);

		// Add new filter if we have values
		if (currentValues.size > 0) {
			const valuesArray = Array.from(currentValues);
			filterStore.addFilter({
				field,
				operator: valuesArray.length === 1 ? 'is' : 'is_any_of',
				value: valuesArray.length === 1 ? valuesArray[0] : valuesArray,
				type: valuesArray.length === 1 ? 'select' : 'multiselect'
			});
		}
	}

	function clearFilters() {
		filterStore.filters = filterStore.filters.filter(
			(f) => !(f.field === field && (f.operator === 'is' || f.operator === 'is_any_of'))
		);
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm" class="h-8 border-dashed">
				<PlusCircleIcon class="mr-2 h-4 w-4" />
				{title}
				{#if selectedValues.size > 0}
					<Separator orientation="vertical" class="mx-2 h-4" />
					<Badge variant="secondary" class="rounded-sm px-1 font-normal lg:hidden">
						{selectedValues.size}
					</Badge>
					<div class="hidden space-x-1 lg:flex">
						{#if selectedValues.size > 2}
							<Badge variant="secondary" class="rounded-sm px-1 font-normal">
								{selectedValues.size} selected
							</Badge>
						{:else}
							{#each Array.from(selectedValues) as value (value)}
								{@const option = options.find((opt) => opt.value === value)}
								{#if option}
									<Badge variant="secondary" class="rounded-sm px-1 font-normal">
										{option.label}
									</Badge>
								{/if}
							{/each}
						{/if}
					</div>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0" align="start">
		<Command.Root>
			<Command.Input placeholder={title} />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>
				<Command.Group>
					{#each options as option (option.value)}
						<Command.Item onSelect={() => toggleValue(option.value)} class="cursor-pointer">
							<div
								class={cn(
									'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
									selectedValues.has(option.value)
										? 'bg-primary text-primary-foreground'
										: 'opacity-50 [&_svg]:invisible'
								)}
							>
								<CheckIcon class="h-4 w-4" />
							</div>
							{#if option.icon}
								<option.icon class="mr-2 h-4 w-4 text-muted-foreground" />
							{/if}
							<span>{option.label}</span>
						</Command.Item>
					{/each}
				</Command.Group>
				{#if selectedValues.size > 0}
					<Command.Separator />
					<Command.Group>
						<Command.Item onSelect={clearFilters} class="cursor-pointer justify-center text-center">
							Clear filters
						</Command.Item>
					</Command.Group>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
