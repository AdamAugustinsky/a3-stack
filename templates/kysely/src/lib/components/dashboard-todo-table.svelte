<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { getTodos } from '$lib/remote/todo.remote';
	import {
		labels,
		statuses,
		priorities
	} from '@routes/(protected)/[organization_slug]/todos/components/data';
	import { ExternalLinkIcon } from '@lucide/svelte';
	import AlertCircleIcon from '@tabler/icons-svelte/icons/alert-circle';
	import { page } from '$app/state';

	// Stable reference for filters to prevent infinite re-renders
	const emptyFilters: [] = [];

	// Use $derived to get the organization slug reactively
	const organizationSlug = $derived(page.params.organization_slug!);
	const queryParams = $derived({ organizationSlug, filters: emptyFilters });

	function getStatusInfo(status: string) {
		return statuses.find((s) => s.value === status) || statuses[0];
	}

	function getPriorityInfo(priority: string) {
		return priorities.find((p) => p.value === priority) || priorities[0];
	}

	function getLabelInfo(label: string) {
		return labels.find((l) => l.value === label) || labels[0];
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high':
				return 'destructive';
			case 'medium':
				return 'secondary';
			case 'low':
				return 'outline';
			default:
				return 'outline';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'done':
				return 'default';
			case 'in progress':
				return 'secondary';
			case 'todo':
				return 'outline';
			case 'backlog':
				return 'outline';
			case 'canceled':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

{#snippet TodoTableSkeleton()}
	<div class="space-y-2.5">
		{#each Array(5) as _, i (i)}
			<div class="flex items-center gap-3 rounded-md border px-3 py-2.5">
				<Skeleton class="h-4 w-4" />
				<div class="flex-1 space-y-2">
					<Skeleton class="h-4 w-3/4" />
					<Skeleton class="h-3 w-1/2" />
				</div>
				<Skeleton class="h-6 w-16 rounded-md" />
			</div>
		{/each}
	</div>
{/snippet}

{#snippet RecentTasks()}
	<svelte:boundary onerror={(e) => console.error('Todos fetch failed:', e)}>
		{@const todos = await getTodos(queryParams)}

		{#if todos.length > 0}
			<div class="space-y-2.5">
				{#each todos.slice(0, 8) as todo (todo.id)}
					{@const statusInfo = getStatusInfo(todo.status)}
					{@const priorityInfo = getPriorityInfo(todo.priority)}
					{@const labelInfo = getLabelInfo(todo.label)}
					<div
						class="flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/40"
					>
						<div class="flex h-4 w-4 items-center justify-center">
							<statusInfo.icon class="h-4 w-4 text-muted-foreground" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<Badge variant="outline" class="text-xs">{labelInfo.label}</Badge>
								<Badge variant={getPriorityColor(todo.priority)} class="text-xs">
									<priorityInfo.icon class="mr-1 h-3 w-3" />
									{priorityInfo.label}
								</Badge>
							</div>
							<p class="mt-1 truncate text-sm leading-none font-medium">{todo.text}</p>
						</div>
						<Badge variant={getStatusColor(todo.status)} class="text-xs">{statusInfo.label}</Badge>
					</div>
				{/each}
			</div>

			{#if todos.length > 8}
				<div class="mt-4 text-center">
					<Button variant="ghost" size="sm" href={'/' + page.params.organization_slug + '/todos'}>
						View {todos.length - 8} more
					</Button>
				</div>
			{/if}
		{:else}
			<div class="py-6 text-center">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<ExternalLinkIcon class="h-6 w-6 text-muted-foreground" />
				</div>
				<h3 class="mt-2 text-sm font-semibold text-muted-foreground">No tasks yet</h3>
				<p class="mt-1 text-sm text-muted-foreground">Create your first task to get started.</p>
				<div class="mt-4">
					<Button size="sm" href={'/' + page.params.organization_slug + '/todos'}>Create task</Button>
				</div>
			</div>
		{/if}

		{#snippet pending()}
			{@render TodoTableSkeleton()}
		{/snippet}

		{#snippet failed(error, reset)}
			<div class="py-6 text-center">
				<div
					class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"
				>
					<AlertCircleIcon class="h-6 w-6 text-destructive" />
				</div>
				<h3 class="mt-2 text-sm font-semibold text-destructive">Failed to load tasks</h3>
				<p class="mt-1 text-sm text-muted-foreground">There was an error loading your tasks.</p>
				<div class="mt-4">
					<Button variant="outline" size="sm" onclick={reset}>
						Try again
					</Button>
				</div>
			</div>
		{/snippet}
	</svelte:boundary>
{/snippet}

<Card.Root class="gap-4 py-4 shadow-xs">
	<Card.Header class="px-5">
		<div class="space-y-1">
			<Card.Title class="text-base font-semibold">Recent tasks</Card.Title>
			<Card.Description class="text-sm">Latest tasks and their current status</Card.Description>
		</div>
		<Card.Action>
			<Button variant="outline" size="sm" href={'/' + page.params.organization_slug + '/todos'}>
				View all
				<ExternalLinkIcon class="ml-2 h-4 w-4" />
			</Button>
		</Card.Action>
	</Card.Header>

	<Card.Content class="px-5">
		{@render RecentTasks()}
	</Card.Content>
</Card.Root>
