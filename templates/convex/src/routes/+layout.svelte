<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex, setupConvexAuth } from 'convex-sveltekit';
	import { authClient } from '$lib/auth-client';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	setupConvexAuth({ authClient, initialToken: data.convexToken });
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
