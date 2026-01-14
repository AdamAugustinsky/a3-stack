<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
	import { scaleUtc } from 'd3-scale';
	import { Area, AreaChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import { getRecentActivity } from '$lib/remote/dashboard.remote';

	type RangeKey = '30d' | '14d' | '7d';

	let timeRange = $state<RangeKey>('30d');

	const LABEL: Record<RangeKey, string> = {
		'30d': 'Last 30 days',
		'14d': 'Last 14 days',
		'7d': 'Last 7 days'
	};

	const RANGE_TO_DAYS: Record<RangeKey, number> = {
		'30d': 30,
		'14d': 14,
		'7d': 7
	};

	const selectedLabel = $derived.by(() => LABEL[timeRange]);

	const chartConfig = {
		completed: { label: 'Completed', color: 'var(--chart-1)' },
		inProgress: { label: 'In Progress', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;

	function normalizeActivityData(rawData: Array<{ date: Date; completed: number; inProgress: number; total: number }>, daysToShow: number) {
		if (!Array.isArray(rawData)) return [];
		return rawData.slice(-daysToShow).map((d) => ({
			date: d.date instanceof Date ? d.date : new Date(d.date),
			completed: +d.completed || 0,
			inProgress: +d.inProgress || 0,
			total: +d.total || 0
		}));
	}
</script>

{#snippet ChartSkeleton()}
	<div class="flex h-[220px] w-full flex-col items-center justify-center gap-3">
		<Skeleton class="h-4 w-4 rounded-full" />
		<Skeleton class="h-3 w-24" />
	</div>
{/snippet}

{#snippet ActivityChart()}
	<svelte:boundary onerror={(e) => console.error('Activity fetch failed:', e)}>
		{@const rawActivity = await getRecentActivity()}
		{@const filteredData = normalizeActivityData(rawActivity, RANGE_TO_DAYS[timeRange])}

		{#if filteredData.length > 0}
			<Chart.Container config={chartConfig} class="aspect-auto h-[220px] w-full">
				<AreaChart
					legend
					data={filteredData}
					x="date"
					xScale={scaleUtc()}
					series={[
						{
							key: 'inProgress',
							label: 'In Progress',
							color: chartConfig.inProgress.color
						},
						{
							key: 'completed',
							label: 'Completed',
							color: chartConfig.completed.color
						}
					]}
					seriesLayout="stack"
					props={{
						area: {
							curve: curveNatural,
							'fill-opacity': 0.4,
							line: { class: 'stroke-1' },
							motion: 'tween'
						},
						xAxis: {
							ticks: timeRange === '7d' ? 7 : undefined,
							format: (v) => {
								return v.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric'
								});
							}
						},
						yAxis: { format: () => '' }
					}}
				>
					{#snippet marks({ series, getAreaProps })}
						<defs>
							<linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stop-color="var(--color-completed)" stop-opacity={1.0} />
								<stop offset="95%" stop-color="var(--color-completed)" stop-opacity={0.1} />
							</linearGradient>
							<linearGradient id="fillInProgress" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stop-color="var(--color-inProgress)" stop-opacity={0.8} />
								<stop offset="95%" stop-color="var(--color-inProgress)" stop-opacity={0.1} />
							</linearGradient>
						</defs>
						{#each series as s, i (s.key)}
							<Area
								{...getAreaProps(s, i)}
								fill={s.key === 'completed' ? 'url(#fillCompleted)' : 'url(#fillInProgress)'}
							/>
						{/each}
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip
							labelFormatter={(v: Date) => {
								return v.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric'
								});
							}}
							indicator="line"
						/>
					{/snippet}
				</AreaChart>
			</Chart.Container>
		{:else}
			<div class="flex h-[220px] w-full items-center justify-center">
				<div class="text-center">
					<p class="text-sm text-muted-foreground">No activity yet</p>
					<p class="mt-1 text-xs text-muted-foreground">Create a few tasks to see trends.</p>
				</div>
			</div>
		{/if}

		{#snippet pending()}
			{@render ChartSkeleton()}
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="flex h-[220px] w-full items-center justify-center">
				<div class="flex flex-col items-center gap-3 text-center">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircleIcon class="h-5 w-5 text-destructive" />
					</div>
					<div>
						<p class="text-sm font-medium text-destructive">Failed to load activity</p>
						<p class="mt-1 text-xs text-muted-foreground">Try refreshing the page.</p>
					</div>
					<Button variant="outline" size="sm" onclick={reset}>
						Try again
					</Button>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
{/snippet}

<Card.Root class="@container/card gap-4 py-4 shadow-xs">
	<Card.Header class="px-5">
		<div class="space-y-1">
			<Card.Title class="text-base font-semibold">Task activity</Card.Title>
			<Card.Description class="text-sm">
				<span class="hidden @[540px]/card:block">Task completion trends over time</span>
				<span class="@[540px]/card:hidden">Task trends</span>
			</Card.Description>
		</div>
		<Card.Action>
			<ToggleGroup.Root
				type="single"
				bind:value={timeRange}
				variant="outline"
				size="sm"
				class="hidden @[767px]/card:flex"
			>
				<ToggleGroup.Item value="30d">30d</ToggleGroup.Item>
				<ToggleGroup.Item value="14d">14d</ToggleGroup.Item>
				<ToggleGroup.Item value="7d">7d</ToggleGroup.Item>
			</ToggleGroup.Root>
			<Select.Root type="single" bind:value={timeRange}>
				<Select.Trigger
					size="sm"
					class="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
					aria-label="Select a value"
				>
					<span data-slot="select-value">{selectedLabel}</span>
				</Select.Trigger>
				<Select.Content class="rounded-xl">
					<Select.Item value="30d" class="rounded-lg">Last 30 days</Select.Item>
					<Select.Item value="14d" class="rounded-lg">Last 14 days</Select.Item>
					<Select.Item value="7d" class="rounded-lg">Last 7 days</Select.Item>
				</Select.Content>
			</Select.Root>
		</Card.Action>
	</Card.Header>

	<Card.Content class="px-5">
		{@render ActivityChart()}
	</Card.Content>
</Card.Root>
