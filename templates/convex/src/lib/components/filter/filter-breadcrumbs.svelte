<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import XIcon from '@lucide/svelte/icons/x';
	import type { FilterStore } from './filter-store.svelte';
	import type { FilterConfig, FilterOperator } from '@/utils/filter';
	import {
		OPERATOR_LABELS,
		getOperatorsForType,
		operatorRequiresValue,
		operatorRequiresRange,
		operatorRequiresNumber
	} from '@/utils/filter';
	import { cn } from '$lib/utils';

	interface Props {
		store: FilterStore;
		config: FilterConfig[];
		onClear?: () => void;
		class?: string;
	}

	let { store, config, onClear, class: className }: Props = $props();

	// State for editing filters
	let editingFilterId = $state<string | null>(null);
	let editingPart = $state<'field' | 'operator' | 'value' | null>(null);
	let tempValue = $state<unknown>(null);
	let tempOperator = $state<FilterOperator | null>(null);
	let tempField = $state<string | null>(null);

	// Get config for a field
	function getFieldConfig(field: string): FilterConfig | undefined {
		return config.find((c) => c.field === field);
	}

	// Format filter value for display
	function formatValue(value: unknown, type: string, fieldConfig?: FilterConfig): string {
		if (value === null || value === undefined) return '';

		if (Array.isArray(value)) {
			if (type === 'date') {
				return `${value[0]} → ${value[1]}`;
			}
			if (type === 'multiselect' && fieldConfig?.options) {
				const labels = value.map((v) => {
					const option = fieldConfig.options?.find((o) => String(o.value) === String(v));
					return option?.label || v;
				});
				return labels.join(', ');
			}
			return `${value[0]} - ${value[1]}`;
		}

		if (type === 'date') {
			const date = value instanceof Date ? value : new Date(value as string);
			return date.toLocaleDateString();
		}

		if (type === 'select' && fieldConfig?.options) {
			const option = fieldConfig.options.find((o) => String(o.value) === String(value));
			return option?.label || String(value);
		}

		return String(value);
	}

	// Start editing a filter part
	function startEdit(filterId: string, part: 'field' | 'operator' | 'value') {
		editingFilterId = filterId;
		editingPart = part;

		const filter = store.getFilter(filterId);
		if (filter) {
			tempValue = filter.value;
			tempOperator = filter.operator;
			tempField = filter.field;
		}
	}

	// Save edit
	function saveEdit() {
		if (!editingFilterId) return;

		const updates: Record<string, unknown> = {};
		if (editingPart === 'field' && tempField) {
			const newConfig = getFieldConfig(tempField);
			if (newConfig) {
				updates.field = tempField;
				updates.type = newConfig.type;
				// Reset operator to default for new field type
				updates.operator = getOperatorsForType(newConfig.type)[0];
				updates.value = null;
			}
		} else if (editingPart === 'operator' && tempOperator) {
			updates.operator = tempOperator;
			// Reset value if operator doesn't require it
			if (!operatorRequiresValue(tempOperator)) {
				updates.value = null;
			}
		} else if (editingPart === 'value') {
			updates.value = tempValue;
		}

		store.updateFilter(editingFilterId, updates);
		cancelEdit();
	}

	// Cancel edit
	function cancelEdit() {
		editingFilterId = null;
		editingPart = null;
		tempValue = null;
		tempOperator = null;
		tempField = null;
	}

	// Remove a filter
	function removeFilter(id: string) {
		store.removeFilter(id);
	}

	// Clear all filters
	function clearAll() {
		store.clearFilters();
		onClear?.();
	}
</script>

{#if store.count > 0}
	<div class={cn('flex flex-wrap items-center gap-2', className)}>
		{#each store.filters as filter (filter.id)}
			{@const fieldConfig = getFieldConfig(filter.field)}
			<div
				class="group inline-flex items-center overflow-hidden rounded-md border border-border/50 bg-muted/10 text-xs transition-all hover:border-border hover:bg-muted/20"
			>
				<!-- Field -->
				<Popover.Root open={editingFilterId === filter.id && editingPart === 'field'}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								onclick={() => startEdit(filter.id, 'field')}
								class="flex items-center gap-1.5 px-2 py-1 font-medium text-foreground/90 transition-colors hover:bg-muted/40"
							>
								{#if fieldConfig?.icon}
									<fieldConfig.icon class="h-3 w-3 text-muted-foreground/70" />
								{/if}
								{fieldConfig?.label || filter.field}
							</button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content
						class="w-[200px] border-border/50 bg-background/95 p-2 shadow-lg backdrop-blur-sm"
					>
						<Select.Root
							type="single"
							value={tempField || ''}
							onValueChange={(v: string | undefined) => {
								if (v) {
									tempField = v;
									saveEdit();
								}
							}}
						>
							<Select.Trigger class="h-8 text-sm">
								<div class="flex items-center gap-1.5">
									{#if getFieldConfig(tempField || '')?.icon}
										{@const IconComponent = getFieldConfig(tempField || '')?.icon}
										{#if IconComponent}
											<IconComponent class="h-3.5 w-3.5 text-muted-foreground/70" />
										{/if}
									{/if}
									{getFieldConfig(tempField || '')?.label || 'Select field'}
								</div>
							</Select.Trigger>
							<Select.Content>
								{#each config as field (field.field)}
									<Select.Item value={field.field} class="flex items-center gap-2 text-sm">
										{#if field.icon}
											<field.icon class="h-3.5 w-3.5 text-muted-foreground/70" />
										{/if}
										{field.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Popover.Content>
				</Popover.Root>

				<!-- Operator -->
				<Popover.Root open={editingFilterId === filter.id && editingPart === 'operator'}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								onclick={() => startEdit(filter.id, 'operator')}
								class="border-l border-border/30 px-2 py-1 text-muted-foreground transition-colors hover:bg-muted/40"
							>
								{OPERATOR_LABELS[filter.operator]}
							</button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content
						class="w-[200px] border-border/50 bg-background/95 p-2 shadow-lg backdrop-blur-sm"
					>
						<Select.Root
							type="single"
							value={tempOperator || ''}
							onValueChange={(v: string | undefined) => {
								if (v) {
									tempOperator = v as FilterOperator;
									saveEdit();
								}
							}}
						>
							<Select.Trigger class="h-8 text-sm">
								{OPERATOR_LABELS[tempOperator || filter.operator]}
							</Select.Trigger>
							<Select.Content>
								{#each getOperatorsForType(filter.type) as op (op)}
									<Select.Item value={op} class="text-sm">
										{OPERATOR_LABELS[op]}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Popover.Content>
				</Popover.Root>

				<!-- Value -->
				{#if operatorRequiresValue(filter.operator)}
					<Popover.Root open={editingFilterId === filter.id && editingPart === 'value'}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<button
									{...props}
									onclick={() => startEdit(filter.id, 'value')}
									class="border-l border-border/30 px-2 py-1 font-semibold text-foreground transition-colors hover:bg-muted/40"
								>
									{formatValue(filter.value, filter.type, fieldConfig)}
								</button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content
							class="w-[250px] border-border/50 bg-background/95 p-3 shadow-lg backdrop-blur-sm"
						>
							<form
								onsubmit={(e) => {
									e.preventDefault();
									saveEdit();
								}}
							>
								{#if operatorRequiresRange(filter.operator)}
									{#if filter.type === 'number'}
										<div class="flex items-center gap-2">
											<Input
												type="number"
												placeholder="Min"
												value={Array.isArray(tempValue) ? tempValue[0] : ''}
												oninput={(e) => {
													const val = e.currentTarget.value;
													tempValue = [
														val ? Number(val) : null,
														Array.isArray(tempValue) ? tempValue[1] : null
													];
												}}
												class="h-8 text-sm"
											/>
											<span class="text-xs">to</span>
											<Input
												type="number"
												placeholder="Max"
												value={Array.isArray(tempValue) ? tempValue[1] : ''}
												oninput={(e) => {
													const val = e.currentTarget.value;
													tempValue = [
														Array.isArray(tempValue) ? tempValue[0] : null,
														val ? Number(val) : null
													];
												}}
												class="h-8 text-sm"
											/>
										</div>
									{/if}
								{:else if operatorRequiresNumber(filter.operator)}
									<Input
										type="number"
										placeholder="Days"
										value={typeof tempValue === 'number' ? tempValue.toString() : ''}
										oninput={(e) => {
											tempValue = e.currentTarget.value ? Number(e.currentTarget.value) : null;
										}}
										class="h-8 text-sm"
									/>
								{:else if filter.type === 'text'}
									<Input
										type="text"
										value={typeof tempValue === 'string' ? tempValue : ''}
										oninput={(e) => {
											tempValue = e.currentTarget.value;
										}}
										class="h-8 text-sm"
										autofocus
									/>
								{:else if filter.type === 'number'}
									<Input
										type="number"
										value={typeof tempValue === 'number' ? tempValue.toString() : ''}
										oninput={(e) => {
											tempValue = e.currentTarget.value ? Number(e.currentTarget.value) : null;
										}}
										class="h-8 text-sm"
										autofocus
									/>
								{:else if filter.type === 'select' && fieldConfig?.options}
									<Select.Root
										type="single"
										value={typeof tempValue === 'string' ? tempValue : ''}
										onValueChange={(v: string | undefined) => {
											if (v) tempValue = v;
										}}
									>
										<Select.Trigger class="h-8 text-sm">
											{tempValue
												? fieldConfig.options.find((o) => String(o.value) === tempValue)?.label ||
													tempValue
												: 'Select...'}
										</Select.Trigger>
										<Select.Content>
											{#each fieldConfig.options as option (option.value)}
												<Select.Item value={String(option.value)} class="text-sm">
													{option.label}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/if}
								<div class="mt-3 flex justify-end gap-2">
									<Button
										type="button"
										size="sm"
										variant="ghost"
										class="h-7 px-2 text-xs"
										onclick={cancelEdit}
									>
										Cancel
									</Button>
									<Button type="submit" size="sm" class="h-7 px-2 text-xs">Save</Button>
								</div>
							</form>
						</Popover.Content>
					</Popover.Root>
				{/if}

				<!-- Remove button -->
				<button
					onclick={() => removeFilter(filter.id)}
					class="border-l border-border/50 px-1.5 py-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
					aria-label="Remove filter"
				>
					<XIcon class="h-3 w-3" />
				</button>
			</div>
		{/each}

		{#if store.count > 1}
			<Button
				variant="ghost"
				size="sm"
				onclick={clearAll}
				class="h-6 px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
			>
				Clear all
			</Button>
		{/if}
	</div>
{/if}
