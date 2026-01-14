<script lang="ts" generics="TData">
	import XIcon from '@lucide/svelte/icons/x';
	import type { Table } from '@tanstack/table-core';
	import Button from '$lib/components/ui/button/button.svelte';
	import TodoDataTableViewOptions from './todo-data-table-view-options.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { priorities, statuses, labels } from './data.js';
	import { onMount } from 'svelte';
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import type { FilterStore } from '$lib/components/filter/filter-store.svelte';
	import type { FilterConfig } from '@/utils/filter';
	import FilterBuilder from '$lib/components/filter/filter-builder.svelte';
	import FilterBreadcrumbs from '$lib/components/filter/filter-breadcrumbs.svelte';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import TodoDataTableFacetedFilterForFilterStore from './todo-data-table-faceted-filter-store.svelte';
	import { Debounced } from 'runed';

	let {
		table,
		filterStore,
		todoFilterConfig
	}: {
		table: Table<TData>;
		filterStore: FilterStore;
		todoFilterConfig: FilterConfig[];
	} = $props();

	const isFiltered = $derived(
		table.getState().columnFilters.length > 0 || filterStore.hasAnyFilters
	);

	// Check if we should show simple or advanced filters
	const showAdvancedFilters = $derived(filterStore.currentMode === 'advanced');

	// Ref to the text filter input for focusing with '/'
	let filterRef = $state<HTMLInputElement | null>(null);
	let inputFocused = $state(false);

	onMount(() => {
		function shouldIgnoreTarget(target: EventTarget | null): boolean {
			const el = target as HTMLElement | null;
			if (!el) return false;
			const tag = el.tagName?.toLowerCase();
			return el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';
		}

		function handleKeydown(event: KeyboardEvent) {
			if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
				if (shouldIgnoreTarget(event.target)) return;
				event.preventDefault();
				filterRef?.focus();
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	// Helper functions for text filter
	function getTextFilterValue(): string {
		const textFilter = filterStore.filters.find(
			(f) => f.field === 'text' && f.operator === 'contains'
		);
		return (textFilter?.value as string) || '';
	}

	let textFilterValue = $state(getTextFilterValue());

	let debouncedTextFilterValue = new Debounced(() => textFilterValue, 500);

	$effect(() => {
		if (
			!debouncedTextFilterValue.pending &&
			debouncedTextFilterValue.current !== getTextFilterValue()
		) {
			updateTextFilter(debouncedTextFilterValue.current);
		}
	});

	function updateTextFilter(value: string) {
		console.log('updateTextFilter called with:', value);
		// Remove existing text filter
		filterStore.filters = filterStore.filters.filter(
			(f) => !(f.field === 'text' && f.operator === 'contains')
		);

		// Add new text filter if value is not empty
		if (value.trim()) {
			console.log('Adding text filter for:', value.trim());
			filterStore.addFilter({
				field: 'text',
				operator: 'contains',
				value: value.trim(),
				type: 'text'
			});
		}
		console.log('Current filters after text update:', filterStore.filters);
	}
</script>

<div class="space-y-3">
	<!-- Filter Mode Toggle -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Filters:</span>
			<Button
				variant={showAdvancedFilters ? 'ghost' : 'secondary'}
				size="sm"
				class="h-7 text-xs"
				onclick={() => filterStore.switchMode('simple')}
			>
				Simple
			</Button>
			<Button
				variant={showAdvancedFilters ? 'secondary' : 'ghost'}
				size="sm"
				class="h-7 text-xs"
				onclick={() => filterStore.switchMode('advanced')}
			>
				<SettingsIcon class="mr-1 h-3 w-3" />
				Advanced
			</Button>
		</div>
		<TodoDataTableViewOptions {table} />
	</div>

	{#if showAdvancedFilters}
		<!-- Advanced Filters UI -->
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<FilterBuilder config={todoFilterConfig} store={filterStore} placeholder="Add filter" />
				{#if filterStore.hasAdvancedFilters}
					<Button
						variant="ghost"
						size="sm"
						class="h-7 px-2 text-xs"
						onclick={() => filterStore.clearFilters()}
					>
						Clear all
						<XIcon class="ml-1 h-3 w-3" />
					</Button>
				{/if}
			</div>
			{#if filterStore.hasAdvancedFilters}
				<FilterBreadcrumbs store={filterStore} config={todoFilterConfig} />
			{/if}
		</div>
	{:else}
		<!-- Simple Filters UI (using FilterStore) -->
		<div class="flex items-center space-x-2">
			<div class="relative">
				<Input
					bind:ref={filterRef}
					placeholder="Filter tasks..."
					aria-keyshortcuts="/"
					title="Press / to focus"
					bind:value={textFilterValue}
					onfocus={() => (inputFocused = true)}
					onblur={() => (inputFocused = false)}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
							e.preventDefault();
							filterRef?.blur();
						}
					}}
					class="h-8 w-[150px] pr-8 lg:w-[250px]"
				/>
				{#if !inputFocused && !getTextFilterValue().length}
					<Kbd.Root class="absolute top-1/2 right-1.5 -translate-y-1/2" aria-hidden="true">/</Kbd.Root>
				{/if}
			</div>

			<TodoDataTableFacetedFilterForFilterStore
				field="status"
				title="Status"
				options={statuses}
				{filterStore}
			/>
			<TodoDataTableFacetedFilterForFilterStore
				field="priority"
				title="Priority"
				options={priorities}
				{filterStore}
			/>
			<TodoDataTableFacetedFilterForFilterStore
				field="label"
				title="Label"
				options={labels}
				{filterStore}
			/>

			{#if isFiltered}
				<Button
					variant="ghost"
					onclick={() => {
						filterStore.clearFilters();
					}}
					class="h-8 px-2 lg:px-3"
				>
					Reset
					<XIcon />
				</Button>
			{/if}
		</div>
	{/if}
</div>
