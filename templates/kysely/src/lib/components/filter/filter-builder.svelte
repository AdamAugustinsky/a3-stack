<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Calendar } from '$lib/components/ui/calendar';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import type { FilterConfig, FilterOperator, FilterValue } from '@/utils/filter';
	import {
		getOperatorsForType,
		OPERATOR_LABELS,
		operatorRequiresValue,
		operatorRequiresRange,
		operatorRequiresNumber
	} from '@/utils/filter';
	import type { FilterStore } from './filter-store.svelte';
	import { CalendarDate } from '@internationalized/date';
	import { cn } from '$lib/utils';

	interface Props {
		config: FilterConfig[];
		store: FilterStore;
		placeholder?: string;
		class?: string;
	}

	let { config, store, placeholder = 'Filter', class: className }: Props = $props();

	let open = $state(false);
	let selectedField = $state<FilterConfig | null>(null);
	let selectedOperator = $state<FilterOperator | null>(null);
	let filterValue = $state<string | null>(null);
	let rangeValue = $state<[number | null, number | null]>([null, null]);
	let numberValue = $state<number | null>(null);
	let multiSelectValue = $state<string[]>([]);

	// Calendar states for date pickers
	let dateValue = $state<CalendarDate | undefined>(undefined);
	let dateRangeStart = $state<CalendarDate | undefined>(undefined);
	let dateRangeEnd = $state<CalendarDate | undefined>(undefined);

	// Reset form state
	function resetForm() {
		selectedField = null;
		selectedOperator = null;
		filterValue = null;
		rangeValue = [null, null];
		numberValue = null;
		multiSelectValue = [];
		dateValue = undefined;
		dateRangeStart = undefined;
		dateRangeEnd = undefined;
	}

	// Handle field selection
	function selectField(field: FilterConfig) {
		selectedField = field;
		// Set default operator for the field type
		const operators = field.operators || getOperatorsForType(field.type);
		selectedOperator = field.defaultOperator || operators[0] || null;
		filterValue =
			typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number'
				? String(field.defaultValue)
				: null;
	}

	// Handle filter submission
	function submitFilter() {
		if (!selectedField || !selectedOperator) return;

		let value: FilterValue = null;

		if (operatorRequiresValue(selectedOperator)) {
			if (operatorRequiresRange(selectedOperator)) {
				if (selectedField.type === 'date') {
					const start = dateRangeStart
						? new Date(
								`${dateRangeStart.year}-${String(dateRangeStart.month).padStart(2, '0')}-${String(dateRangeStart.day).padStart(2, '0')}`
							)
						: new Date();
					const end = dateRangeEnd
						? new Date(
								`${dateRangeEnd.year}-${String(dateRangeEnd.month).padStart(2, '0')}-${String(dateRangeEnd.day).padStart(2, '0')}`
							)
						: new Date();
					value = [start, end] as [Date, Date];
				} else if (rangeValue[0] !== null && rangeValue[1] !== null) {
					value = rangeValue as [number, number];
				} else {
					value = [0, 0] as [number, number];
				}
			} else if (operatorRequiresNumber(selectedOperator)) {
				value = numberValue ?? 0;
			} else if (selectedField.type === 'date') {
				value = dateValue
					? new Date(
							`${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`
						)
					: null;
			} else if (selectedField.type === 'multiselect') {
				value = multiSelectValue;
			} else {
				value = filterValue
					? selectedField.type === 'number'
						? Number(filterValue)
						: filterValue
					: null;
			}
		}

		store.addFilter({
			field: selectedField.field,
			operator: selectedOperator,
			value,
			type: selectedField.type
		});

		resetForm();
		open = false;
	}

	// Get available operators for selected field
	let availableOperators = $derived.by(() => {
		if (!selectedField) return [];
		return selectedField.operators || getOperatorsForType(selectedField.type);
	});

	// Handle keyboard navigation
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			resetForm();
			open = false;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="sm"
				class={cn(
					'h-7 gap-1.5 rounded-md border px-2 text-xs font-normal transition-all',
					store.count > 0
						? 'border-primary/20 bg-primary/5 text-primary hover:border-primary/30 hover:bg-primary/10'
						: 'border-dashed border-border hover:border-solid hover:bg-muted/40',
					className
				)}
			>
				<FilterIcon class="h-3 w-3" />
				<span class="font-medium">{placeholder}</span>
				{#if store.count > 0}
					<span
						class="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
					>
						{store.count}
					</span>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content
		class="w-[320px] border-border/50 bg-background/95 p-0 shadow-lg backdrop-blur-sm"
		align="start"
		onkeydown={handleKeyDown}
	>
		{#if !selectedField}
			<!-- Field Selection -->
			<Command.Root>
				<Command.Input
					placeholder="Search fields..."
					class="flex h-9 w-full rounded-md bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
				/>
				<Command.List>
					<Command.Empty>No fields found.</Command.Empty>
					<Command.Group>
						{#each config as field (field.field)}
							<Command.Item
								onSelect={() => selectField(field)}
								class="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors hover:bg-muted/40 data-[selected]:bg-muted/60"
							>
								{#if field.icon}
									<field.icon class="h-4 w-4 text-muted-foreground/70" />
								{/if}
								<span class="flex-1 font-medium">{field.label}</span>
								{#if field.description}
									<span class="text-xs text-muted-foreground/70">
										{field.description}
									</span>
								{/if}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		{:else}
			<!-- Filter Configuration -->
			<div class="flex flex-col">
				<!-- Header -->
				<div
					class="flex items-center justify-between border-b border-border/50 bg-muted/20 px-3 py-2"
				>
					<Select.Root
						type="single"
						value={selectedField.field}
						onValueChange={(v: string | undefined) => {
							if (v) {
								const field = config.find((f) => f.field === v);
								if (field) selectField(field);
							}
						}}
					>
						<Select.Trigger
							class="h-6 gap-1.5 border-0 bg-transparent px-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted/40 focus:ring-0 [&>svg]:h-3 [&>svg]:w-3"
						>
							{#if selectedField.icon}
								<selectedField.icon class="h-3.5 w-3.5" />
							{/if}
							{selectedField.label}
						</Select.Trigger>
						<Select.Content>
							{#each config as field (field.field)}
								<Select.Item value={field.field} class="flex items-center gap-2 text-sm">
									{#if field.icon}
										<field.icon class="h-4 w-4 text-muted-foreground/70" />
									{/if}
									{field.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<Button
						variant="ghost"
						size="sm"
						class="h-5 px-1.5 text-xs hover:bg-muted/60"
						onclick={() => resetForm()}
					>
						Change
					</Button>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						submitFilter();
					}}
					class="space-y-3 p-3"
				>
					<!-- Operator and Value on same line for text/number/select -->
					{#if selectedField.type === 'text' || (selectedField.type === 'number' && (!selectedOperator || !operatorRequiresRange(selectedOperator))) || selectedField.type === 'select'}
						<div class="flex gap-2">
							<!-- Operator Selection -->
							<Select.Root
								type="single"
								value={selectedOperator || ''}
								onValueChange={(v: string | undefined) => {
									if (v) selectedOperator = v as FilterOperator;
								}}
							>
								<Select.Trigger class="h-8 min-w-[80px] text-sm">
									{OPERATOR_LABELS[selectedOperator || 'equals']}
								</Select.Trigger>
								<Select.Content>
									{#each availableOperators as op (op)}
										<Select.Item value={op} class="text-sm">
											{OPERATOR_LABELS[op]}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>

							<!-- Value Input -->
							{#if selectedOperator && operatorRequiresValue(selectedOperator)}
								{#if operatorRequiresNumber(selectedOperator)}
									<div class="flex flex-1 items-center gap-2">
										<Input
											type="number"
											placeholder="Number"
											bind:value={numberValue}
											class="h-8 flex-1 text-sm"
											autofocus
										/>
										<span class="text-xs text-muted-foreground">days</span>
									</div>
								{:else if selectedField.type === 'text'}
									<Input
										type="text"
										placeholder={selectedField.placeholder || 'Enter value...'}
										bind:value={filterValue}
										class="h-8 flex-1 text-sm"
										autofocus
									/>
								{:else if selectedField.type === 'number'}
									<Input
										type="number"
										placeholder={selectedField.placeholder || 'Enter number...'}
										bind:value={filterValue}
										min={typeof selectedField.min === 'number' ? selectedField.min : undefined}
										max={typeof selectedField.max === 'number' ? selectedField.max : undefined}
										step={selectedField.step}
										class="h-8 flex-1 text-sm"
										autofocus
									/>
								{:else if selectedField.type === 'select' && selectedField.options}
									<Select.Root
										type="single"
										value={filterValue || ''}
										onValueChange={(v: string | undefined) => {
											if (v) filterValue = v;
										}}
									>
										<Select.Trigger class="h-8 flex-1 text-sm">
											{filterValue
												? selectedField.options.find((o) => String(o.value) === filterValue)
														?.label || filterValue
												: 'Select...'}
										</Select.Trigger>
										<Select.Content>
											{#each selectedField.options as option (option.value)}
												<Select.Item value={String(option.value)} class="text-sm">
													{option.label}
												</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/if}
							{/if}
						</div>
					{:else}
						<!-- Separate layout for complex inputs -->
						<Select.Root
							type="single"
							value={selectedOperator || ''}
							onValueChange={(v: string | undefined) => {
								if (v) selectedOperator = v as FilterOperator;
							}}
						>
							<Select.Trigger class="h-8 text-sm">
								{OPERATOR_LABELS[selectedOperator || 'equals']}
							</Select.Trigger>
							<Select.Content>
								{#each availableOperators as op (op)}
									<Select.Item value={op} class="text-sm">
										{OPERATOR_LABELS[op]}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>

						{#if selectedOperator && operatorRequiresValue(selectedOperator)}
							{#if operatorRequiresRange(selectedOperator)}
								<!-- Range inputs -->
								{#if selectedField.type === 'number'}
									<div class="flex items-center gap-2">
										<Input
											type="number"
											placeholder="Min"
											bind:value={rangeValue[0]}
											class="h-8 text-sm"
										/>
										<span class="text-xs text-muted-foreground">to</span>
										<Input
											type="number"
											placeholder="Max"
											bind:value={rangeValue[1]}
											class="h-8 text-sm"
										/>
									</div>
								{:else if selectedField.type === 'date'}
									<div class="space-y-2">
										<div class="space-y-1">
											<span class="text-xs text-muted-foreground">From</span>
											<Calendar
												type="single"
												bind:value={dateRangeStart}
												class="rounded-md border"
												minValue={selectedField.min && selectedField.min instanceof Date
													? new CalendarDate(
															selectedField.min.getFullYear(),
															selectedField.min.getMonth() + 1,
															selectedField.min.getDate()
														)
													: undefined}
												maxValue={selectedField.max && selectedField.max instanceof Date
													? new CalendarDate(
															selectedField.max.getFullYear(),
															selectedField.max.getMonth() + 1,
															selectedField.max.getDate()
														)
													: undefined}
											/>
										</div>
										<div class="space-y-1">
											<span class="text-xs text-muted-foreground">To</span>
											<Calendar
												type="single"
												bind:value={dateRangeEnd}
												class="rounded-md border"
												minValue={dateRangeStart}
												maxValue={selectedField.max && selectedField.max instanceof Date
													? new CalendarDate(
															selectedField.max.getFullYear(),
															selectedField.max.getMonth() + 1,
															selectedField.max.getDate()
														)
													: undefined}
											/>
										</div>
									</div>
								{/if}
							{:else if selectedField.type === 'date'}
								<Calendar
									type="single"
									bind:value={dateValue}
									class="rounded-md border"
									minValue={selectedField.min && selectedField.min instanceof Date
										? new CalendarDate(
												selectedField.min.getFullYear(),
												selectedField.min.getMonth() + 1,
												selectedField.min.getDate()
											)
										: undefined}
									maxValue={selectedField.max && selectedField.max instanceof Date
										? new CalendarDate(
												selectedField.max.getFullYear(),
												selectedField.max.getMonth() + 1,
												selectedField.max.getDate()
											)
										: undefined}
								/>
							{:else if selectedField.type === 'multiselect' && selectedField.options}
								<div class="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
									{#each selectedField.options as option (option.value)}
										<label
											class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted/60"
										>
											<input
												type="checkbox"
												value={option.value}
												checked={multiSelectValue.includes(String(option.value))}
												onchange={(e) => {
													const target = e.currentTarget;
													if (target.checked) {
														multiSelectValue = [...multiSelectValue, String(option.value)];
													} else {
														multiSelectValue = multiSelectValue.filter(
															(v) => v !== String(option.value)
														);
													}
												}}
												class="h-3.5 w-3.5 rounded border-gray-300"
											/>
											<span class="flex-1">{option.label}</span>
										</label>
									{/each}
								</div>
							{/if}
						{/if}
					{/if}

					<!-- Actions -->
					<div
						class="flex items-center justify-end gap-1.5 border-t border-border/50 bg-muted/10 px-3 py-2"
					>
						<Button
							variant="ghost"
							size="sm"
							class="h-7 px-3 text-xs font-medium hover:bg-muted/40"
							onclick={() => {
								resetForm();
								open = false;
							}}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							class="h-7 bg-primary px-3 text-xs font-medium hover:bg-primary/90"
							disabled={!selectedField || !selectedOperator}
						>
							Apply
						</Button>
					</div>
				</form>
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
