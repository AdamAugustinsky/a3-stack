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
	import UserIcon from '@tabler/icons-svelte/icons/user';
	import MailIcon from '@tabler/icons-svelte/icons/mail';
	import CalendarIcon from '@tabler/icons-svelte/icons/calendar';
	import ShieldIcon from '@tabler/icons-svelte/icons/shield';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import { api } from '$convex/api';
	import { useConvexClient } from 'convex-svelte';

	const { data }: { data: PageData } = $props();
	const convex = useConvexClient();

	let isEditing = $state(false);
	let isSaving = $state(false);
	let name = $state('');
	let nameError = $state<string | undefined>();

	$effect(() => {
		if (!isEditing) {
			name = data.user.name;
			nameError = undefined;
		}
	});

	const initials = $derived(
		data.user.name
			.split(' ')
			.map((word) => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	function validateName(value: string): string | undefined {
		const trimmed = value.trim();
		if (trimmed.length < 2) return 'Name must be at least 2 characters';
		if (trimmed.length > 100) return 'Name must be less than 100 characters';
		return undefined;
	}

	function handleCancel() {
		isEditing = false;
	}

	function startEdit() {
		isEditing = true;
	}

	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		nameError = validateName(name);
		if (nameError) return;

		isSaving = true;
		try {
			await convex.mutation(api.users.updateProfile, { name: name.trim() });
			toast.success('Profile updated successfully.');
			await invalidateAll();
			isEditing = false;
		} catch {
			toast.error('Failed to save profile. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	function copy(text: string) {
		try {
			navigator.clipboard?.writeText(text);
			toast.success('Copied to clipboard.');
		} catch {
			toast.error('Failed to copy.');
		}
	}
</script>

<svelte:head>
	<title>Account - Profile Settings</title>
</svelte:head>

<div class="@container/main hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h2 class="text-2xl font-semibold tracking-tight">Account</h2>
			<p class="text-muted-foreground">Manage your profile and security.</p>
		</div>
		{#if !isEditing}
			<Button variant="outline" size="sm" onclick={startEdit} class="max-w-full truncate">
				<UserIcon class="mr-2 size-4 shrink-0" />
				<span class="truncate">Edit profile</span>
			</Button>
		{/if}
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<Card class="gap-4 py-4 shadow-xs md:col-span-2">
			<CardHeader class="px-5 pb-0">
				<div class="flex items-center gap-4">
					<Avatar class="size-16 shrink-0 sm:size-20">
						<AvatarImage src={data.user.image} alt={data.user.name} />
						<AvatarFallback class="text-base sm:text-lg">{initials}</AvatarFallback>
					</Avatar>
					<div class="min-w-0 space-y-1">
						<CardTitle class="truncate text-lg font-semibold">{data.user.name}</CardTitle>
						<CardDescription class="truncate text-sm text-muted-foreground">{data.user.email}</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent class="space-y-4 px-5">
				<Separator />
				<div class="space-y-1">
					<h3 class="text-lg font-medium">Profile</h3>
					<p class="text-sm text-muted-foreground">Basic information for your account.</p>
				</div>

				{#if isEditing}
					<form onsubmit={handleSave} class="grid gap-4">
						<div class="grid gap-2">
							<Label for="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="Enter your full name"
								disabled={isSaving}
								bind:value={name}
							/>
							{#if nameError}
								<p class="text-xs text-destructive">{nameError}</p>
							{/if}
							<p class="text-xs text-muted-foreground">
								Use your real name so people can recognize you.
							</p>
						</div>

						<div class="grid gap-2">
							<Label for="email">Email Address</Label>
							<div class="flex items-center space-x-2 py-1">
								<MailIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="truncate text-sm">{data.user.email}</span>
								<span class="text-xs whitespace-nowrap text-muted-foreground"
									>(Email cannot be changed)</span
								>
							</div>
						</div>

						<div class="flex flex-col gap-2 pt-2 sm:flex-row">
							<Button type="submit" disabled={isSaving}>
								{isSaving ? 'Saving...' : 'Save Changes'}
							</Button>
							<Button type="button" variant="outline" onclick={handleCancel} disabled={isSaving}>
								Cancel
							</Button>
						</div>
					</form>
				{:else}
					<div class="grid gap-4">
						<div class="grid gap-2">
							<Label for="name">Full Name</Label>
							<div class="flex items-center space-x-2 py-1">
								<UserIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="truncate text-sm">{data.user.name}</span>
							</div>
						</div>

						<div class="grid gap-2">
							<Label for="email">Email Address</Label>
							<div class="flex items-center space-x-2 py-1">
								<MailIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="truncate text-sm">{data.user.email}</span>
								<span class="text-xs whitespace-nowrap text-muted-foreground"
									>(Email cannot be changed)</span
								>
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<div class="space-y-6">
			<Card class="gap-4 py-4 shadow-xs">
				<CardHeader class="px-5 pb-0">
					<CardTitle>Account</CardTitle>
					<CardDescription>Identifiers and status.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-2 px-5">
					<div class="flex items-center justify-between gap-3 py-1">
						<div class="flex min-w-0 items-center space-x-2">
							<CalendarIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="text-sm font-medium">Created</span>
						</div>
						<span class="truncate text-sm text-muted-foreground">
							{formatDate(data.user.createdAt.toString())}
						</span>
					</div>

					<div class="flex items-center justify-between gap-3 py-1">
						<div class="flex min-w-0 items-center space-x-2">
							<ShieldIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="text-sm font-medium">User ID</span>
						</div>
						<div class="flex max-w-[65%] items-center gap-2">
							<span class="truncate font-mono text-xs text-muted-foreground">{data.user.id}</span>
							<Button
								size="sm"
								variant="outline"
								class="shrink-0"
								onclick={() => copy(data.user.id)}
							>
								Copy
							</Button>
						</div>
					</div>

					<div class="flex items-center justify-between gap-3 py-1">
						<div class="flex min-w-0 items-center space-x-2">
							<MailIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="text-sm font-medium">Email Verified</span>
						</div>
						<span class="text-sm whitespace-nowrap">
							{#if data.user.emailVerified}
								<span class="font-medium text-green-600">✓ Verified</span>
							{:else}
								<span class="font-medium text-orange-600">⚠ Not Verified</span>
							{/if}
						</span>
					</div>
				</CardContent>
			</Card>

			<Card class="gap-4 py-4 shadow-xs">
				<CardHeader class="px-5 pb-0">
					<CardTitle>Security</CardTitle>
					<CardDescription>Password and protection.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-3 px-5">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">Password</p>
							<p class="text-xs text-muted-foreground">
								Last updated: {formatDate(data.user.updatedAt.toString())}
							</p>
						</div>
						<Button
							size="sm"
							variant="outline"
							onclick={() => window.alert('Change password functionality coming soon!')}
						>
							Change Password
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
