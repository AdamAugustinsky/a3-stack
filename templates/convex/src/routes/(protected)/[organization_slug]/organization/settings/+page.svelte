<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { toast } from 'svelte-sonner';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import BuildingIcon from '@tabler/icons-svelte/icons/building';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import ShieldIcon from '@tabler/icons-svelte/icons/shield';
	import UsersIcon from '@tabler/icons-svelte/icons/users';
	import MailIcon from '@tabler/icons-svelte/icons/mail';
	import TrashIcon from '@tabler/icons-svelte/icons/trash';
	import SendIcon from '@tabler/icons-svelte/icons/send';
	import XIcon from '@tabler/icons-svelte/icons/x';
	import CrownIcon from '@tabler/icons-svelte/icons/crown';
	import UserPlusIcon from '@tabler/icons-svelte/icons/user-plus';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { api } from '$convex/api';
	import { useConvexClient } from 'convex-sveltekit';

	type OrganizationRole = 'member' | 'admin' | 'owner';

	let { data }: { data: PageData } = $props();

	const convex = useConvexClient();
	const user = $derived(data.user);
	const organizationSlug = $derived(page.params.organization_slug ?? '');

	let activeOrganization = $state<PageData['activeOrganization']>(null);
	let organizationLoading = $state(false);
	let organizationError = $state<string | undefined>();

	let isEditing = $state(false);
	let showInviteDialog = $state(false);
	let showDeleteDialog = $state(false);
	let editName = $state('');
	let editSlug = $state('');
	let editLogo = $state('');
	let slugManuallyEdited = $state(false);
	let organizationFormPending = $state(false);
	let organizationFormError = $state<string | undefined>();
	let inviteEmail = $state('');
	let inviteRole = $state<OrganizationRole>('member');
	let invitePending = $state(false);
	let inviteError = $state<string | undefined>();

	const members = $derived(activeOrganization?.members ?? []);
	const invitations = $derived(activeOrganization?.invitations ?? []);

	$effect(() => {
		if (!activeOrganization && data.activeOrganization) {
			activeOrganization = data.activeOrganization;
		}
	});

	$effect(() => {
		if (isEditing && activeOrganization) {
			editName = activeOrganization.name;
			editSlug = activeOrganization.slug || '';
			editLogo = activeOrganization.logo || '';
			organizationFormError = undefined;
		}
	});

	$effect(() => {
		if (showInviteDialog) {
			inviteEmail = '';
			inviteRole = 'member';
			inviteError = undefined;
		}
	});

	$effect(() => {
		if (isEditing && !slugManuallyEdited && editName) {
			editSlug = generateSlug(editName);
		}
	});

	$effect(() => {
		if (
			organizationSlug &&
			activeOrganization?.slug &&
			activeOrganization.slug !== organizationSlug
		) {
			void refreshOrganization();
		}
	});

	const currentUserRole = $derived.by(() => {
		if (!activeOrganization || !user) return '';
		return members.find((m) => m.userId === user.id)?.role ?? '';
	});

	const isOwner = $derived(currentUserRole === 'owner');
	const isAdmin = $derived(currentUserRole === 'admin' || isOwner);

	function generateSlug(name: string): string {
		return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}

	function isValidSlug(value: string): boolean {
		return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
	}

	function formatDate(dateString: string | Date) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function copy(text: string) {
		navigator.clipboard?.writeText(text).then(
			() => toast.success('Copied to clipboard.'),
			() => toast.error('Failed to copy.')
		);
	}

	async function refreshOrganization() {
		if (!organizationSlug) return;
		organizationLoading = true;
		organizationError = undefined;
		try {
			activeOrganization = await convex.query(api.organizations.getOrganizationBySlug, {
				organizationSlug
			});
		} catch (error) {
			organizationError =
				error instanceof Error ? error.message : 'Failed to refresh organization.';
		} finally {
			organizationLoading = false;
		}
	}

	function handleCancelEdit() {
		isEditing = false;
		slugManuallyEdited = false;
		organizationFormError = undefined;
	}

	async function handleUpdateOrganization(event: SubmitEvent) {
		event.preventDefault();
		if (!activeOrganization) return;

		organizationFormError = undefined;
		const nextName = editName.trim();
		const nextSlug = editSlug.trim();
		const nextLogo = editLogo.trim();

		if (!nextName) {
			organizationFormError = 'Organization name is required.';
			return;
		}

		if (!nextSlug || !isValidSlug(nextSlug)) {
			organizationFormError = 'Slug must use lowercase letters, numbers, and hyphens.';
			return;
		}

		organizationFormPending = true;
		try {
			await convex.mutation(api.organizations.updateOrganization, {
				organizationId: activeOrganization.id,
				data: {
					name: nextName,
					slug: nextSlug,
					logo: nextLogo || undefined
				}
			});

			toast.success('Organization details updated successfully.');
			isEditing = false;
			slugManuallyEdited = false;

			if (nextSlug !== activeOrganization.slug) {
				await goto(
					resolve('/(protected)/[organization_slug]/organization/settings', {
						organization_slug: nextSlug
					})
				);
				return;
			}

			await refreshOrganization();
		} catch (error) {
			organizationFormError =
				error instanceof Error ? error.message : 'Failed to update organization details.';
			toast.error('Failed to update organization details.');
		} finally {
			organizationFormPending = false;
		}
	}

	async function handleUpdateMemberRole(memberId: string, newRole: OrganizationRole) {
		if (!activeOrganization) return;
		try {
			await convex.mutation(api.organizations.updateMemberRole, {
				memberId,
				role: newRole,
				organizationId: activeOrganization.id
			});
			toast.success('Member role updated.');
			await refreshOrganization();
		} catch {
			toast.error('Failed to update member role.');
		}
	}

	async function handleRemoveMember(memberId: string, userEmail: string | undefined) {
		if (!activeOrganization) return;
		try {
			await convex.mutation(api.organizations.removeMember, {
				memberIdOrEmail: userEmail ?? memberId,
				organizationId: activeOrganization.id
			});
			toast.success('Member removed from organization.');
			await refreshOrganization();
		} catch {
			toast.error('Failed to remove member.');
		}
	}

	async function handleCancelInvitation(invitationId: string) {
		try {
			await convex.mutation(api.organizations.cancelInvitation, { invitationId });
			toast.success('Invitation cancelled.');
			await refreshOrganization();
		} catch {
			toast.error('Failed to cancel invitation.');
		}
	}

	async function handleDeleteOrganization() {
		if (!activeOrganization) return;
		try {
			await convex.mutation(api.organizations.deleteOrganization, {
				organizationId: activeOrganization.id
			});
			await convex.mutation(api.organizations.setActiveOrganization, { organizationId: null });
			goto('/sign-in');
		} catch {
			toast.error('Failed to delete organization.');
		}
	}

	async function handleInviteMember(event: SubmitEvent) {
		event.preventDefault();
		if (!activeOrganization) return;
		inviteError = undefined;

		const email = inviteEmail.trim();
		if (!email) {
			inviteError = 'Email is required.';
			return;
		}

		invitePending = true;
		try {
			await convex.mutation(api.organizations.createInvitation, {
				email,
				role: inviteRole,
				organizationId: activeOrganization.id
			});
			showInviteDialog = false;
			toast.success('Invitation sent successfully.');
			await refreshOrganization();
		} catch (error) {
			inviteError = error instanceof Error ? error.message : 'Failed to send invitation.';
			toast.error('Failed to send invitation.');
		} finally {
			invitePending = false;
		}
	}

	function getRoleBadgeVariant(role: string) {
		return role === 'owner' ? 'default' : role === 'admin' ? 'secondary' : 'outline';
	}

	function getRoleIcon(role: string) {
		return role === 'owner' ? CrownIcon : ShieldIcon;
	}
</script>

<svelte:head>
	<title>Organization Settings</title>
</svelte:head>

<div class="@container/main hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Organization</h2>
			<p class="text-muted-foreground">Manage your organization, members, and permissions.</p>
		</div>
		{#if isAdmin && !isEditing}
			<Button
				variant="outline"
				size="sm"
				onclick={() => {
					slugManuallyEdited = false;
					isEditing = true;
				}}
			>
				<BuildingIcon class="mr-2 size-4 shrink-0" />
				<span class="truncate">Edit organization</span>
			</Button>
		{/if}
	</div>

	{#if organizationLoading && !activeOrganization}
		<p class="text-sm text-muted-foreground">Loading organization...</p>
	{:else if organizationError && !activeOrganization}
		<p class="text-sm text-destructive">{organizationError}</p>
	{:else if activeOrganization}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<Card class="gap-4 py-4 shadow-xs md:col-span-2">
				<CardHeader class="px-5 pb-0">
					<div class="flex items-center gap-4">
						<Avatar class="size-16 shrink-0 sm:size-20">
							{#if activeOrganization.logo}
								<AvatarImage src={activeOrganization.logo} alt={activeOrganization.name} />
							{/if}
							<AvatarFallback class="text-base sm:text-lg">
								{activeOrganization.name.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div class="min-w-0 space-y-1">
							<CardTitle class="truncate text-lg font-semibold">{activeOrganization.name}</CardTitle>
							{#if activeOrganization.slug}
								<CardDescription class="truncate font-mono text-sm text-muted-foreground">
									/{activeOrganization.slug}
								</CardDescription>
							{/if}
						</div>
					</div>
				</CardHeader>

				<CardContent class="space-y-4 px-5">
					<Separator />
					<div class="space-y-1">
						<h3 class="text-lg font-medium">Organization Details</h3>
						<p class="text-sm text-muted-foreground">Basic information for your organization.</p>
					</div>

					{#if isEditing}
						<form onsubmit={handleUpdateOrganization} class="grid gap-4">
							{#if organizationFormError}
								<p class="text-xs text-destructive">{organizationFormError}</p>
							{/if}

							<div class="grid gap-2">
								<Label for="name">Organization Name</Label>
								<Input
									id="name"
									placeholder="Enter organization name"
									disabled={organizationFormPending}
									bind:value={editName}
								/>
							</div>

							<div class="grid gap-2">
								<Label for="slug">Organization Slug</Label>
								<Input
									id="slug"
									placeholder="organization-slug"
									disabled={organizationFormPending}
									bind:value={editSlug}
									oninput={() => (slugManuallyEdited = true)}
								/>
								<p class="text-xs text-muted-foreground">
									Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens.
								</p>
							</div>

							<div class="grid gap-2">
								<Label for="logo">Logo URL</Label>
								<Input
									id="logo"
									placeholder="https://example.com/logo.png"
									disabled={organizationFormPending}
									bind:value={editLogo}
								/>
								<p class="text-xs text-muted-foreground">Provide a URL to your organization's logo.</p>
							</div>

							<div class="flex flex-col gap-2 pt-2 sm:flex-row">
								<Button type="submit" size="sm" disabled={organizationFormPending}>
									{organizationFormPending ? 'Saving...' : 'Save changes'}
								</Button>
								<Button type="button" size="sm" variant="outline" onclick={handleCancelEdit} disabled={organizationFormPending}>
									Cancel
								</Button>
							</div>
						</form>
					{:else}
						<div class="grid gap-4">
							<div class="grid gap-2">
								<Label for="name">Organization Name</Label>
								<div class="flex items-center space-x-2 py-1">
									<BuildingIcon class="size-4 shrink-0 text-muted-foreground" />
									<span class="truncate text-sm">{activeOrganization.name}</span>
								</div>
							</div>

							<div class="grid gap-2">
								<Label for="slug">Organization Slug</Label>
								<div class="flex items-center space-x-2 py-1">
									<span class="truncate font-mono text-sm">/{activeOrganization.slug || 'no-slug'}</span>
								</div>
							</div>

							<div class="grid gap-2">
								<Label for="logo">Logo URL</Label>
								{#if activeOrganization.logo}
									<div class="flex items-center space-x-2 py-1">
										<span class="truncate text-sm">{activeOrganization.logo}</span>
									</div>
								{:else}
									<span class="text-sm text-muted-foreground">No logo set</span>
								{/if}
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>

			<div class="space-y-6">
				<Card class="gap-4 py-4 shadow-xs">
					<CardHeader class="px-5 pb-0">
						<CardTitle>Organization Info</CardTitle>
						<CardDescription>Identifiers and metadata.</CardDescription>
					</CardHeader>
					<CardContent class="space-y-2 px-5">
						<div class="flex items-center justify-between gap-3 py-1">
							<div class="flex min-w-0 items-center space-x-2">
								<CalendarIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="text-sm font-medium">Created</span>
							</div>
							<span class="truncate text-sm text-muted-foreground">{formatDate(activeOrganization.createdAt)}</span>
						</div>

						<div class="flex items-center justify-between gap-3 py-1">
							<div class="flex min-w-0 items-center space-x-2">
								<ShieldIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="text-sm font-medium">Org ID</span>
							</div>
							<div class="flex max-w-[65%] items-center gap-2">
								<span class="truncate font-mono text-xs text-muted-foreground">{activeOrganization.id}</span>
								<Button size="sm" variant="outline" class="shrink-0" onclick={() => copy(activeOrganization?.id ?? '')}>
									Copy
								</Button>
							</div>
						</div>

						<div class="flex items-center justify-between gap-3 py-1">
							<div class="flex min-w-0 items-center space-x-2">
								<UsersIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="text-sm font-medium">Members</span>
							</div>
							<span class="text-sm font-medium whitespace-nowrap">
								{members.length}
								{members.length === 1 ? 'member' : 'members'}
							</span>
						</div>

						{@const RoleIcon = getRoleIcon(currentUserRole)}
						<div class="flex items-center justify-between gap-3 py-1">
							<div class="flex min-w-0 items-center space-x-2">
								<RoleIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="text-sm font-medium">Your Role</span>
							</div>
							<Badge variant={getRoleBadgeVariant(currentUserRole)}>{currentUserRole}</Badge>
						</div>
					</CardContent>
				</Card>

				{#if isOwner}
					<Card class="border-destructive gap-4 py-4 shadow-xs">
						<CardHeader class="px-5 pb-0">
							<CardTitle class="text-destructive">Danger Zone</CardTitle>
							<CardDescription>Irreversible and destructive actions.</CardDescription>
						</CardHeader>
						<CardContent class="px-5">
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-sm font-medium">Delete Organization</p>
									<p class="text-xs text-muted-foreground">Permanently delete this organization and all data.</p>
								</div>
								<Button size="sm" variant="destructive" onclick={() => (showDeleteDialog = true)}>Delete</Button>
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>

		<Card class="gap-4 py-4 shadow-xs">
			<CardHeader class="px-5 pb-0">
				<div class="flex items-center justify-between">
					<div>
						<CardTitle>Members</CardTitle>
						<CardDescription>Manage organization members and their roles.</CardDescription>
					</div>
					{#if isAdmin}
						<Button size="sm" onclick={() => (showInviteDialog = true)}>
							<UserPlusIcon class="mr-2 size-4" />
							Invite Member
						</Button>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				{#if members.length > 0}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Member</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Joined</TableHead>
								{#if isAdmin}<TableHead class="text-right">Actions</TableHead>{/if}
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each members as member (member.id)}
								<TableRow>
									<TableCell>
										<div class="flex items-center gap-3">
											<Avatar class="size-8">
												{#if member.user?.image}
													<AvatarImage src={member.user.image} alt={member.user.name} />
												{/if}
												<AvatarFallback class="text-xs">
													{(member.user?.name || member.user?.email || 'U').slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium">{member.user?.name || 'Unknown'}</p>
												<p class="truncate text-xs text-muted-foreground">{member.user?.email}</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										{#if isOwner && member.userId !== user?.id && member.role !== 'owner'}
											<select
												value={member.role}
												onchange={(e) => handleUpdateMemberRole(member.id, e.currentTarget.value as OrganizationRole)}
												class="flex h-8 w-25 items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
											>
												<option value="member">Member</option>
												<option value="admin">Admin</option>
												{#if isOwner}<option value="owner">Owner</option>{/if}
											</select>
										{:else}
											<Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
										{/if}
									</TableCell>
									<TableCell>
										<span class="text-sm text-muted-foreground">{formatDate(member.createdAt)}</span>
									</TableCell>
									{#if isAdmin}
										<TableCell class="text-right">
											{#if member.userId !== user?.id && member.role !== 'owner'}
												<Button
													size="sm"
													variant="ghost"
													onclick={() => handleRemoveMember(member.id, member.user?.email)}
												>
													<TrashIcon class="size-4" />
												</Button>
											{/if}
										</TableCell>
									{/if}
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{:else}
					<p class="py-8 text-center text-sm text-muted-foreground">No members yet.</p>
				{/if}
			</CardContent>
		</Card>

		{#if invitations.length > 0}
			<Card class="gap-4 py-4 shadow-xs">
				<CardHeader class="px-5 pb-0">
					<CardTitle>Pending invitations</CardTitle>
					<CardDescription>Manage pending member invitations.</CardDescription>
				</CardHeader>
				<CardContent class="px-5">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Expires</TableHead>
								{#if isAdmin}<TableHead class="text-right">Actions</TableHead>{/if}
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each invitations as invitation (invitation.id)}
								<TableRow>
									<TableCell>
										<div class="flex items-center gap-2">
											<MailIcon class="size-4 text-muted-foreground" />
											<span class="truncate text-sm">{invitation.email}</span>
										</div>
									</TableCell>
									<TableCell><Badge variant="outline">{invitation.role}</Badge></TableCell>
									<TableCell><span class="text-sm text-muted-foreground">{formatDate(invitation.expiresAt)}</span></TableCell>
									{#if isAdmin}
										<TableCell class="text-right">
											<Button size="sm" variant="ghost" onclick={() => handleCancelInvitation(invitation.id)}>
												<XIcon class="size-4" />
											</Button>
										</TableCell>
									{/if}
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>

<Dialog.Root bind:open={showInviteDialog}>
	<Dialog.Content class="gap-0 p-0 sm:max-w-md">
		<Dialog.Header class="border-b px-5 py-3.5">
			<Dialog.Title class="text-base font-semibold">Invite member</Dialog.Title>
			<Dialog.Description class="text-sm text-muted-foreground">
				Send an invitation to add someone to your organization.
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleInviteMember} class="contents">
			<div class="space-y-3.5 px-5 py-4">
				{#if inviteError}
					<p class="text-xs text-destructive">{inviteError}</p>
				{/if}

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="colleague@example.com"
						disabled={invitePending}
						bind:value={inviteEmail}
					/>
				</div>

				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<select
						id="role"
						disabled={invitePending}
						bind:value={inviteRole}
						class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
						{#if isOwner}<option value="owner">Owner</option>{/if}
					</select>
				</div>
			</div>

			<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
				<Button type="button" size="sm" variant="ghost" onclick={() => (showInviteDialog = false)} disabled={invitePending}>
					Cancel
				</Button>
				<Button type="submit" size="sm" disabled={invitePending}>
					{#if invitePending}
						Sending...
					{:else}
						<SendIcon class="mr-2 size-4" />
						Send invitation
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the organization
				<span class="font-semibold">{activeOrganization?.name}</span> and remove all associated data.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDeleteOrganization} class="text-destructive-foreground bg-destructive hover:bg-destructive/90">
				Delete Organization
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
