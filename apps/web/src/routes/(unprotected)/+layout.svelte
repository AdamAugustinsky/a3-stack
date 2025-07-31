<script lang="ts">
  import HomeHeader from "$lib/components/home-header.svelte";

  let { children } = $props();
</script>

<div class="flex flex-col h-screen">
  <HomeHeader />
  <main class="flex-1">
    {@render children()}
  </main>
</div>
