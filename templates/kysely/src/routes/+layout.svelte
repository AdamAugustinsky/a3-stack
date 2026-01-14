<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();
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
