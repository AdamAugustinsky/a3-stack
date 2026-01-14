<script lang="ts">
	import { page } from '$app/state';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let pageTitle = $state('Documents');
	switch (page.url.pathname) {
		case '/todos':
			pageTitle = 'Todos';
			break;
		case '/dashboard':
			pageTitle = 'Dashboard';
			break;
		case '/account':
			pageTitle = 'Account';
			break;
		case '/':
			pageTitle = 'Home';
			break;
	}
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">{pageTitle}</h1>
	</div>
</header>
