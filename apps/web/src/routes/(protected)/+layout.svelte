<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import SiteHeader from "$lib/components/site-header.svelte";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  const { children } = $props();

  const session = authClient.useSession();

  if (!session) {
    goto("/sign-in");
  }
</script>

<Sidebar.Provider
  style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
  {#if $session.data}
    <AppSidebar variant="inset" user={$session.data.user} />
  {/if}
  <Sidebar.Inset>
    <SiteHeader />
    {@render children()}
  </Sidebar.Inset>
</Sidebar.Provider>
