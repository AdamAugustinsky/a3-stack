<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import CirclePlusIcon from '@lucide/svelte/icons/circle-plus';
	import SectionCards from '$lib/components/section-cards.svelte';
	import ChartAreaInteractive from '$lib/components/chart-area-interactive.svelte';
	import DashboardTodoTable from '$lib/components/dashboard-todo-table.svelte';
</script>

<div class="@container/main hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Dashboard</h2>
			<p class="text-muted-foreground">A quick pulse check on your workspace.</p>
		</div>
		<Button variant="default" class="group" href={'/' + page.params.organization_slug + '/todos'}>
			<CirclePlusIcon class="mr-2 h-4 w-4" />
			Add Task
		</Button>
	</div>

	<SectionCards />
	<ChartAreaInteractive />
	<DashboardTodoTable />
</div>
