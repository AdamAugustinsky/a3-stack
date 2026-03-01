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
	import * as Alert from '$lib/components/ui/alert';
	import * as Field from '$lib/components/ui/field/index.js';
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
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { api } from '$convex/api';
	import { convexCommand, convexForm, convexQuery } from 'convex-sveltekit';
	import * as v from 'valibot';

	type OrganizationRole = 'member' | 'admin' | 'owner';

	let { data }: { data: PageData } = $props();
	const user = $derived(data.user);
	const activeOrganizationQuery = convexQuery(api.organizations.getOrganizationBySlug, () => {
		const organizationSlug = page.params.organization_slug;
		return organizationSlug ? { organizationSlug } : 'skip';
	});
	const activeOrganization = $derived(activeOrganizationQuery.data ?? null);

	let isEditing = $state(false);
	let showInviteDialog = $state(false);
	let showDeleteDialog = $state(false);
	let slugManuallyEdited = $state(false);
	let organizationFormError = $state<string | undefined>();
	let inviteError = $state<string | undefined>();

	type EditFields = { name: string; slug: string; logo: string };
	let editFields = $state<EditFields>({ name: '', slug: '', logo: '' });

	type InviteFields = { email: string; role: OrganizationRole };
	let inviteFields = $state<InviteFields>({ email: '', role: 'member' });

	const members = $derived(activeOrganization?.members ?? []);
	const invitations = $derived(activeOrganization?.invitations ?? []);

	$effect(() => {
		if (!isEditing || !activeOrganization) return;
		editFields = {
			name: activeOrganization.name,
			slug: activeOrganization.slug || '',
			logo: activeOrganization.logo || ''
		};
		organizationFormError = undefined;
	});

	$effect(() => {
		if (!showInviteDialog) return;
		inviteFields = { email: '', role: 'member' };
		inviteError = undefined;
	});

	$effect(() => {
		if (isEditing && !slugManuallyEdited && editFields.name) {
			editFields.slug = generateSlug(editFields.name);
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

	function handleCancelEdit() {
		isEditing = false;
		slugManuallyEdited = false;
		organizationFormError = undefined;
	}
	const updateMemberRoleCommand = convexCommand(api.organizations.updateMemberRole);
	const removeMemberCommand = convexCommand(api.organizations.removeMember);
	const cancelInvitationCommand = convexCommand(api.organizations.cancelInvitation);
	const deleteOrganizationCommand = convexCommand(api.organizations.deleteOrganization);
	const setActiveOrganizationCommand = convexCommand(api.organizations.setActiveOrganization);

	const updateOrganizationSchema = v.object({
		name: v.pipe(
			v.string('Organization name is required.'),
			v.trim(),
			v.nonEmpty('Organization name is required.')
		),
		slug: v.pipe(
			v.string('Slug is required.'),
			v.trim(),
			v.nonEmpty('Slug is required.'),
			v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens.')
		),
		logo: v.optional(v.string())
	});

	const updateOrganizationForm = convexForm(
		updateOrganizationSchema,
		api.organizations.updateOrganization,
		(formData) => {
			if (!activeOrganization) {
				throw new Error('Organization not found.');
			}

			return {
				organizationId: activeOrganization.id,
				data: {
					name: formData.name.trim(),
					slug: formData.slug.trim(),
					logo: formData.logo?.trim() ? formData.logo.trim() : undefined
				}
			};
		}
	);

	const inviteMemberSchema = v.object({
		email: v.pipe(
			v.string('Email is required.'),
			v.trim(),
			v.nonEmpty('Email is required.'),
			v.email('Please enter a valid email.')
		),
		role: v.union([v.literal('member'), v.literal('admin'), v.literal('owner')], 'Invalid role')
	});

	const inviteMemberForm = convexForm(inviteMemberSchema, api.organizations.createInvitation, (formData) => {
		if (!activeOrganization) {
			throw new Error('Organization not found.');
		}

		return {
			email: formData.email.trim(),
			role: formData.role as OrganizationRole,
			organizationId: activeOrganization.id
		};
	});

	async function handleUpdateMemberRole(memberId: string, newRole: OrganizationRole) {
		if (!activeOrganization) return;
		try {
			await updateMemberRoleCommand({
				memberId,
				role: newRole,
				organizationId: activeOrganization.id
			});
			toast.success('Member role updated.');
		} catch {
			toast.error('Failed to update member role.');
		}
	}

	async function handleRemoveMember(memberId: string, userEmail: string | undefined) {
		if (!activeOrganization) return;
		try {
			await removeMemberCommand({
				memberIdOrEmail: userEmail ?? memberId,
				organizationId: activeOrganization.id
			});
			toast.success('Member removed from organization.');
		} catch {
			toast.error('Failed to remove member.');
		}
	}

	async function handleCancelInvitation(invitationId: string) {
		try {
			await cancelInvitationCommand({ invitationId });
			toast.success('Invitation cancelled.');
		} catch {
			toast.error('Failed to cancel invitation.');
		}
	}

	async function handleDeleteOrganization() {
		if (!activeOrganization) return;
		try {
			await deleteOrganizationCommand({
				organizationId: activeOrganization.id
			});
			await setActiveOrganizationCommand({ organizationId: null });
			await goto('/sign-in');
		} catch {
			toast.error('Failed to delete organization.');
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

	{#if activeOrganizationQuery.isLoading && !activeOrganization}
		<p class="text-sm text-muted-foreground">Loading organization...</p>
	{:else if activeOrganizationQuery.error && !activeOrganization}
		<p class="text-sm text-destructive">Failed to load organization settings.</p>
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
						<form {...updateOrganizationForm.enhance(async ({ submit }) => {
								if (!activeOrganization) return;

								organizationFormError = undefined;
								const nextSlug = editFields.slug.trim();

								if (!nextSlug || !isValidSlug(nextSlug)) {
									return;
								}

								try {
									await submit();
									toast.success('Organization details updated successfully.');
									isEditing = false;
									slugManuallyEdited = false;

									if (nextSlug !== activeOrganization.slug) {
										await goto(
											resolve('/(protected)/[organization_slug]/organization/settings', {
												organization_slug: nextSlug
											})
										);
									}
								} catch (error) {
									organizationFormError =
										error instanceof Error ? error.message : 'Failed to update organization details.';
									toast.error('Failed to update organization details.');
								}
							})} class="grid gap-4">
							{#if organizationFormError}
								<Alert.Root variant="destructive" class="py-2.5">
									<CircleAlertIcon class="size-4" />
									<Alert.Description class="text-sm">{organizationFormError}</Alert.Description>
								</Alert.Root>
							{/if}

							<div class="grid gap-2">
								<Label for="name">Organization Name</Label>
								<Input
									id="name"
									name="name"
									required
									placeholder="Enter organization name"
									disabled={updateOrganizationForm.pending > 0}
									bind:value={editFields.name}
								/>
								{#if updateOrganizationForm.fields.name.issues()?.[0]}
									<Field.Error>{updateOrganizationForm.fields.name.issues()?.[0]?.message}</Field.Error>
								{/if}
							</div>

							<div class="grid gap-2">
								<Label for="slug">Organization Slug</Label>
								<Input
									id="slug"
									name="slug"
									required
									placeholder="organization-slug"
									disabled={updateOrganizationForm.pending > 0}
									bind:value={editFields.slug}
									oninput={() => (slugManuallyEdited = true)}
								/>
								{#if updateOrganizationForm.fields.slug.issues()?.[0]}
									<Field.Error>{updateOrganizationForm.fields.slug.issues()?.[0]?.message}</Field.Error>
								{/if}
								<p class="text-xs text-muted-foreground">
									Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens.
								</p>
							</div>

							<div class="grid gap-2">
								<Label for="logo">Logo URL</Label>
								<Input
									id="logo"
									name="logo"
									placeholder="https://example.com/logo.png"
									disabled={updateOrganizationForm.pending > 0}
									bind:value={editFields.logo}
								/>
								<p class="text-xs text-muted-foreground">Provide a URL to your organization's logo.</p>
							</div>

							<div class="flex flex-col gap-2 pt-2 sm:flex-row">
								<Button type="submit" size="sm" disabled={updateOrganizationForm.pending > 0}>
									{updateOrganizationForm.pending > 0 ? 'Saving...' : 'Save changes'}
								</Button>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onclick={handleCancelEdit}
									disabled={updateOrganizationForm.pending > 0}
								>
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

		<form {...inviteMemberForm.enhance(async ({ submit }) => {
				if (!activeOrganization) return;

				inviteError = undefined;

				try {
					await submit();
					showInviteDialog = false;
					toast.success('Invitation sent successfully.');
				} catch (error) {
					inviteError = error instanceof Error ? error.message : 'Failed to send invitation.';
					toast.error('Failed to send invitation.');
				}
			})} class="contents">
			<div class="space-y-3.5 px-5 py-4">
				{#if inviteError}
					<Alert.Root variant="destructive" class="py-2.5">
						<CircleAlertIcon class="size-4" />
						<Alert.Description class="text-sm">{inviteError}</Alert.Description>
					</Alert.Root>
				{/if}

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						required
						placeholder="colleague@example.com"
						disabled={inviteMemberForm.pending > 0}
						bind:value={inviteFields.email}
					/>
					{#if inviteMemberForm.fields.email.issues()?.[0]}
						<Field.Error>{inviteMemberForm.fields.email.issues()?.[0]?.message}</Field.Error>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<select
						id="role"
						name="role"
						disabled={inviteMemberForm.pending > 0}
						bind:value={inviteFields.role}
						class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
						{#if isOwner}<option value="owner">Owner</option>{/if}
					</select>
					{#if inviteMemberForm.fields.role.issues()?.[0]}
						<Field.Error>{inviteMemberForm.fields.role.issues()?.[0]?.message}</Field.Error>
					{/if}
				</div>
			</div>

			<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onclick={() => (showInviteDialog = false)}
					disabled={inviteMemberForm.pending > 0}
				>
					Cancel
				</Button>
				<Button type="submit" size="sm" disabled={inviteMemberForm.pending > 0}>
					{#if inviteMemberForm.pending > 0}
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
