<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { getConvexClient } from 'convex-sveltekit';
	import { authClient } from '$lib/auth-client';
	import { setupConvexAuthBridge } from '$lib/convex/auth.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const stopSessionSync = setupConvexAuthBridge({
		client: getConvexClient(),
		authClient,
		getInitialToken: () => data.convexToken ?? null
	});

	$effect(() => {
		return stopSessionSync;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />
<ModeWatcher />
<div class="flex h-screen flex-col">
	<!-- <HomeHeader /> -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>
