<script lang="ts">
	import TrendingDownIcon from '@tabler/icons-svelte/icons/trending-down';
	import TrendingUpIcon from '@tabler/icons-svelte/icons/trending-up';
	import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { getDashboardStats } from '$lib/remote/dashboard.remote';
</script>

{#snippet StatsSkeleton()}
	<div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
		{#each Array(4) as _, i (i)}
			<Card.Root class="@container/card gap-4 py-4 shadow-xs">
				<Card.Header class="px-5">
					<Skeleton class="h-3 w-16" />
					<Skeleton class="mt-2 h-7 w-12" />
				</Card.Header>
				<Card.Content class="px-5">
					<Skeleton class="h-4 w-32" />
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
{/snippet}

{#snippet StatsCards()}
	<svelte:boundary onerror={(e) => console.error('Stats fetch failed:', e)}>
		{@const stats = await getDashboardStats()}

		<div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<Card.Root class="@container/card relative gap-4 py-4 shadow-xs">
				<div class="absolute left-5 right-5 top-0 h-px rounded-full bg-sky-500/35"></div>
				<Card.Header class="px-5">
					<Card.Description class="text-xs">Total tasks</Card.Description>
					<Card.Title class="text-2xl font-semibold tabular-nums">
						{stats.totalTodos}
					</Card.Title>
					<Card.Action>
						<Badge variant="outline">
							<TrendingUpIcon />
							Active
						</Badge>
					</Card.Action>
				</Card.Header>
				<Card.Content class="px-5">
					<p class="text-sm text-muted-foreground">All tasks in this workspace.</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="@container/card relative gap-4 py-4 shadow-xs">
				<div class="absolute left-5 right-5 top-0 h-px rounded-full bg-emerald-500/35"></div>
				<Card.Header class="px-5">
					<Card.Description class="text-xs">Completed</Card.Description>
					<Card.Title class="text-2xl font-semibold tabular-nums">
						{stats.completedTodos}
					</Card.Title>
					<Card.Action>
						<Badge variant="outline">
							<TrendingUpIcon />
							{stats.completionRate}%
						</Badge>
					</Card.Action>
				</Card.Header>
				<Card.Content class="px-5">
					<p class="text-sm text-muted-foreground">Tasks marked as done.</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="@container/card relative gap-4 py-4 shadow-xs">
				<div class="absolute left-5 right-5 top-0 h-px rounded-full bg-violet-500/35"></div>
				<Card.Header class="px-5">
					<Card.Description class="text-xs">In progress</Card.Description>
					<Card.Title class="text-2xl font-semibold tabular-nums">
						{stats.inProgressTodos}
					</Card.Title>
					<Card.Action>
						<Badge variant="outline">
							<TrendingUpIcon />
							Active
						</Badge>
					</Card.Action>
				</Card.Header>
				<Card.Content class="px-5">
					<p class="text-sm text-muted-foreground">Currently being worked on.</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="@container/card relative gap-4 py-4 shadow-xs">
				<div class="absolute left-5 right-5 top-0 h-px rounded-full bg-amber-500/40"></div>
				<Card.Header class="px-5">
					<Card.Description class="text-xs">High priority</Card.Description>
					<Card.Title class="text-2xl font-semibold tabular-nums">
						{stats.highPriorityTodos}
					</Card.Title>
					<Card.Action>
						<Badge variant="outline">
							{#if stats.highPriorityTodos > 5}
								<TrendingUpIcon />
								Urgent
							{:else}
								<TrendingDownIcon />
								Manageable
							{/if}
						</Badge>
					</Card.Action>
				</Card.Header>
				<Card.Content class="px-5">
					<p class="text-sm text-muted-foreground">High priority tasks pending.</p>
				</Card.Content>
			</Card.Root>
		</div>

		{#snippet pending()}
			{@render StatsSkeleton()}
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
				<Card.Root class="@container/card col-span-full gap-4 py-4 shadow-xs">
					<Card.Header class="px-5">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
								<AlertCircleIcon class="h-5 w-5 text-destructive" />
							</div>
							<div>
								<Card.Title class="text-base font-semibold text-destructive">Failed to load statistics</Card.Title>
								<Card.Description class="text-sm">There was an error loading dashboard stats.</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="px-5">
						<Button variant="outline" size="sm" onclick={reset}>
							Try again
						</Button>
					</Card.Content>
				</Card.Root>
			</div>
		{/snippet}
	</svelte:boundary>
{/snippet}

{@render StatsCards()}
