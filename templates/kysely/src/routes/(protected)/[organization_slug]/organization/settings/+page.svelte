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
	import {
		updateOrganizationForm,
		inviteMemberForm,
		deleteOrganization,
		updateMemberRole,
		removeMember,
		cancelInvitation,
		setActiveOrganization
	} from '$lib/remote/organization.remote';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const activeOrganization = $derived(data.activeOrganization);
	const user = $derived(data.user);

	let isEditing = $state(false);
	let showInviteDialog = $state(false);
	let showDeleteDialog = $state(false);

	// Initialize form fields when editing starts
	$effect(() => {
		if (isEditing && activeOrganization) {
			updateOrganizationForm.fields.organizationId.set(activeOrganization.id);
			updateOrganizationForm.fields.name.set(activeOrganization.name);
			updateOrganizationForm.fields.slug.set(activeOrganization.slug || '');
			updateOrganizationForm.fields.logo.set(activeOrganization.logo || '');
		}
	});

	// Initialize invite form when dialog opens
	$effect(() => {
		if (showInviteDialog && activeOrganization) {
			inviteMemberForm.fields.organizationId.set(activeOrganization.id);
			inviteMemberForm.fields.email.set('');
			inviteMemberForm.fields.role.set('member');
		}
	});

	// Auto-generate slug from name
	function generateSlug(name: string): string {
		return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}

	let slugManuallyEdited = $state(false);
	const nameValue = $derived(updateOrganizationForm.fields.name.value());

	$effect(() => {
		if (isEditing && !slugManuallyEdited && nameValue) {
			updateOrganizationForm.fields.slug.set(generateSlug(nameValue));
		}
	});

	const currentUserRole = $derived.by(() => {
		if (!activeOrganization || !user) return '';
		return activeOrganization.members?.find((m) => m.userId === user.id)?.role ?? '';
	});

	const isOwner = $derived(currentUserRole === 'owner');
	const isAdmin = $derived(currentUserRole === 'admin' || isOwner);

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
	}

	async function handleUpdateMemberRole(memberId: string, newRole: 'member' | 'admin' | 'owner') {
		if (!activeOrganization) return;
		try {
			await updateMemberRole({ memberId, role: newRole, organizationId: activeOrganization.id });
			toast.success('Member role updated.');
			await invalidateAll();
		} catch {
			toast.error('Failed to update member role.');
		}
	}

	async function handleRemoveMember(memberId: string, userEmail: string) {
		if (!activeOrganization) return;
		try {
			await removeMember({ memberIdOrEmail: userEmail, organizationId: activeOrganization.id });
			toast.success('Member removed from organization.');
			await invalidateAll();
		} catch {
			toast.error('Failed to remove member.');
		}
	}

	async function handleCancelInvitation(invitationId: string) {
		try {
			await cancelInvitation({ invitationId });
			toast.success('Invitation cancelled.');
			await invalidateAll();
		} catch {
			toast.error('Failed to cancel invitation.');
		}
	}

	async function handleDeleteOrganization() {
		if (!activeOrganization) return;
		try {
			await deleteOrganization({ organizationId: activeOrganization.id });
			await setActiveOrganization({ organizationId: null });
			await invalidateAll();
			goto('/sign-in');
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

	{#if activeOrganization}
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
						<form
							{...updateOrganizationForm.enhance(async ({ submit }) => {
								const oldSlug = activeOrganization?.slug;
								try {
									await submit();
									if (updateOrganizationForm.result?.success) {
										toast.success('Organization details updated successfully.');
										isEditing = false;
										slugManuallyEdited = false;
										const newSlug = updateOrganizationForm.result.newSlug;
										if (newSlug && newSlug !== oldSlug) {
											goto(resolve('/(protected)/[organization_slug]/organization/settings', { organization_slug: newSlug }));
										} else {
											await invalidateAll();
										}
									}
								} catch {
									toast.error('Failed to update organization details.');
								}
							})}
							class="grid gap-4"
						>
							<input type="hidden" {...updateOrganizationForm.fields.organizationId.as('text')} />

							<div class="grid gap-2">
								<Label for="name">Organization Name</Label>
								<Input
									{...updateOrganizationForm.fields.name.as('text')}
									id="name"
									placeholder="Enter organization name"
									disabled={!!updateOrganizationForm.pending}
								/>
								{#each updateOrganizationForm.fields.name.issues() ?? [] as issue}
									<p class="text-xs text-destructive">{issue.message}</p>
								{/each}
							</div>

							<div class="grid gap-2">
								<Label for="slug">Organization Slug</Label>
								<Input
									{...updateOrganizationForm.fields.slug.as('text')}
									id="slug"
									placeholder="organization-slug"
									disabled={!!updateOrganizationForm.pending}
									oninput={() => (slugManuallyEdited = true)}
								/>
								{#each updateOrganizationForm.fields.slug.issues() ?? [] as issue}
									<p class="text-xs text-destructive">{issue.message}</p>
								{/each}
								<p class="text-xs text-muted-foreground">
									Used in URLs and must be unique. Only lowercase letters, numbers, and hyphens.
								</p>
							</div>

							<div class="grid gap-2">
								<Label for="logo">Logo URL</Label>
								<Input
									{...updateOrganizationForm.fields.logo.as('text')}
									id="logo"
									placeholder="https://example.com/logo.png"
									disabled={!!updateOrganizationForm.pending}
								/>
								<p class="text-xs text-muted-foreground">Provide a URL to your organization's logo.</p>
							</div>

							<div class="flex flex-col gap-2 pt-2 sm:flex-row">
								<Button type="submit" size="sm" disabled={!!updateOrganizationForm.pending}>
									{updateOrganizationForm.pending ? 'Saving...' : 'Save changes'}
								</Button>
								<Button type="button" size="sm" variant="outline" onclick={handleCancelEdit} disabled={!!updateOrganizationForm.pending}>
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
								{activeOrganization?.members.length}
								{activeOrganization?.members.length === 1 ? 'member' : 'members'}
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
					<Card class="gap-4 py-4 shadow-xs border-destructive">
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
				{#if activeOrganization?.members.length > 0}
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
							{#each activeOrganization?.members as member (member.id)}
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
												onchange={(e) => handleUpdateMemberRole(member.id, e.currentTarget.value as 'member' | 'admin' | 'owner')}
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
												<Button size="sm" variant="ghost" onclick={() => handleRemoveMember(member.id, member.user?.email)}>
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

		{#if activeOrganization.invitations.length > 0}
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
							{#each activeOrganization.invitations as invitation (invitation.id)}
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

		<form
			{...inviteMemberForm.enhance(async ({ submit, form }) => {
				try {
					await submit();
					if (inviteMemberForm.result?.success) {
						showInviteDialog = false;
						form.reset();
						toast.success('Invitation sent successfully.');
						await invalidateAll();
					}
				} catch {
					toast.error('Failed to send invitation.');
				}
			})}
			class="contents"
		>
			<input type="hidden" {...inviteMemberForm.fields.organizationId.as('text')} />

			<div class="space-y-3.5 px-5 py-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						{...inviteMemberForm.fields.email.as('email')}
						id="email"
						placeholder="colleague@example.com"
						disabled={!!inviteMemberForm.pending}
					/>
					{#each inviteMemberForm.fields.email.issues() ?? [] as issue}
						<p class="text-xs text-destructive">{issue.message}</p>
					{/each}
				</div>

				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<select
						{...inviteMemberForm.fields.role.as('select')}
						id="role"
						disabled={!!inviteMemberForm.pending}
						class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="member">Member</option>
						<option value="admin">Admin</option>
						{#if isOwner}<option value="owner">Owner</option>{/if}
					</select>
				</div>
			</div>

			<Dialog.Footer class="border-t bg-muted/30 px-5 py-3">
				<Button type="button" size="sm" variant="ghost" onclick={() => (showInviteDialog = false)} disabled={!!inviteMemberForm.pending}>
					Cancel
				</Button>
				<Button type="submit" size="sm" disabled={!!inviteMemberForm.pending}>
					{#if inviteMemberForm.pending}
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
