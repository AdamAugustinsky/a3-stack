<script lang="ts">
  import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
  import DatabaseIcon from "@tabler/icons-svelte/icons/database";
  import FileWordIcon from "@tabler/icons-svelte/icons/file-word";
  import HelpIcon from "@tabler/icons-svelte/icons/help";
  import InnerShadowTopIcon from "@tabler/icons-svelte/icons/inner-shadow-top";
  import ListDetailsIcon from "@tabler/icons-svelte/icons/list-details";
  import ReportIcon from "@tabler/icons-svelte/icons/report";
  import SearchIcon from "@tabler/icons-svelte/icons/search";
  import SettingsIcon from "@tabler/icons-svelte/icons/settings";
  import NavMain from "./nav-main.svelte";
  import NavSecondary from "./nav-secondary.svelte";
  import NavUser from "./nav-user.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";
  import type { User } from "better-auth";

  let {
    user,
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> & { user: User } = $props();

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: DashboardIcon,
      },
      {
        title: "Todos",
        url: "/todos",
        icon: ListDetailsIcon,
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: SettingsIcon,
      },
      {
        title: "Get Help",
        url: "#",
        icon: HelpIcon,
      },
      {
        title: "Search",
        url: "#",
        icon: SearchIcon,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: DatabaseIcon,
      },
      {
        name: "Reports",
        url: "#",
        icon: ReportIcon,
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: FileWordIcon,
      },
    ],
  };
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
          {#snippet child({ props })}
            <a href="##" {...props}>
              <InnerShadowTopIcon class="!size-5" />
              <span class="text-base font-semibold">Acme Inc.</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavMain items={data.navMain} />
    <!-- <NavDocuments items={data.documents} /> -->
    <NavSecondary items={data.navSecondary} class="mt-auto" />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser {user} />
  </Sidebar.Footer>
</Sidebar.Root>
