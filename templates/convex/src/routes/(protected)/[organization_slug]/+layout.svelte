<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { api } from '$convex/api';
	import { convexCommand, convexQuery } from 'convex-sveltekit';

	const { children, data }: { children: Snippet; data: LayoutData } = $props();
	const organizationsQuery = convexQuery(api.organizations.listOrganizations, {});
	const organizations = $derived(organizationsQuery.data ?? []);
	const setActiveOrganization = convexCommand(api.organizations.setActiveOrganization);

	// Track what we've already set to avoid duplicate calls
	let lastSetOrgId: string | null = null;

	// Set active organization when URL slug changes
	$effect(() => {
		const slug = page.params.organization_slug;
		// Untrack organizations to prevent re-running when the list refreshes
		const orgs = untrack(() => organizations);
		const organization = orgs.find((org) => org.slug === slug);
		if (organization && organization.id !== lastSetOrgId) {
			lastSetOrgId = organization.id;
			void setActiveOrganization({
				organizationId: organization.id
			})
				.catch((error) => {
					console.error('Failed to set active organization:', error);
				});
		}
	});
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" user={data.user} {organizationsQuery} />
	<Sidebar.Inset>
		<SiteHeader />
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
