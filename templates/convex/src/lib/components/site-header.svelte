<script lang="ts">
	import { page } from '$app/state';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	const pageTitle = $derived.by(() => {
		const pathname = page.url.pathname;
		if (pathname.endsWith('/todos')) return 'Todos';
		if (pathname.endsWith('/dashboard')) return 'Dashboard';
		if (pathname.endsWith('/account')) return 'Account';
		if (pathname === '/') return 'Home';
		return 'Documents';
	});
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
