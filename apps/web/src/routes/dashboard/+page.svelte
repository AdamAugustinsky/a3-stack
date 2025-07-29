<script lang="ts">
  import data from "./data.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import SiteHeader from "$lib/components/site-header.svelte";
  import SectionCards from "$lib/components/section-cards.svelte";
  import ChartAreaInteractive from "$lib/components/chart-area-interactive.svelte";
  import DataTable from "$lib/components/data-table.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authClient } from "$lib/auth-client";
  import { orpc } from "$lib/orpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { get } from "svelte/store";

  const sessionQuery = authClient.useSession();

  const privateDataQuery = createQuery(orpc.privateData.queryOptions());

  onMount(() => {
    const { data: session, isPending } = get(sessionQuery);
    if (!session && !isPending) {
      goto("/sign-in");
    }
  });
</script>

{#if $sessionQuery.isPending}
  <div>Loading...</div>
{:else if !$sessionQuery.data}{:else}
  <!-- <div> -->
  <!--   <h1>Dashboard</h1> -->
  <!--   <p>Welcome {$sessionQuery.data.user.name}</p> -->
  <!--   <p>privateData: {$privateDataQuery.data?.message}</p> -->
  <!-- </div> -->

  <Sidebar.Provider
    style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
  >
    <AppSidebar variant="inset" />
    <Sidebar.Inset>
      <SiteHeader />
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col gap-2">
          <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div class="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable {data} />
          </div>
        </div>
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
