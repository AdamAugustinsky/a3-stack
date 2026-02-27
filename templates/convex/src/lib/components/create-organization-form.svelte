<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { api } from '$convex/api';
	import { useConvexClient } from 'convex-svelte';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

	const convex = useConvexClient();

	let name = $state('');
	let slug = $state('');
	let slugManuallyEdited = $state(false);
	let nameError = $state<string | undefined>();
	let slugError = $state<string | undefined>();
	let errorValue = $state<string | undefined>();
	let isLoading = $state(false);

	function generateSlug(value: string): string {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function isValidSlug(value: string): boolean {
		return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
	}

	function extractSlug(value: unknown): string | null {
		if (!value || typeof value !== 'object') {
			return null;
		}
		const maybeSlug = (value as { slug?: unknown }).slug;
		return typeof maybeSlug === 'string' && maybeSlug.length > 0 ? maybeSlug : null;
	}

	$effect(() => {
		if (!slugManuallyEdited) {
			slug = generateSlug(name);
		}
	});

	function validate(): boolean {
		nameError = undefined;
		slugError = undefined;

		const trimmedName = name.trim();
		const trimmedSlug = slug.trim();

		if (!trimmedName) {
			nameError = 'Organization name is required';
		}

		if (!trimmedSlug) {
			slugError = 'Organization slug is required';
		} else if (!isValidSlug(trimmedSlug)) {
			slugError = 'Slug must use lowercase letters, numbers, and hyphens';
		}

		return !nameError && !slugError;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorValue = undefined;

		if (!validate()) {
			return;
		}

		isLoading = true;

		try {
			const nextName = name.trim();
			const nextSlug = slug.trim();
			const result = await convex.mutation(api.organizations.createOrganization, {
				name: nextName,
				slug: nextSlug
			});

			name = '';
			slug = '';
			slugManuallyEdited = false;

			const createdSlug = extractSlug(result) ?? nextSlug;
			await goto(
				resolve('/(protected)/[organization_slug]/dashboard', { organization_slug: createdSlug })
			);
		} catch (error) {
			errorValue =
				error instanceof Error ? error.message : 'Failed to create organization';
		} finally {
			isLoading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col">
	<div class="space-y-3.5 px-5 py-4">
		{#if errorValue}
			<Alert.Root variant="destructive" class="py-2.5">
				<CircleAlertIcon class="size-4" />
				<Alert.Description class="text-sm">{errorValue}</Alert.Description>
			</Alert.Root>
		{/if}

		<Field.Field class="gap-1.5">
			<Field.Label for="name" class="text-sm font-medium">Organization name</Field.Label>
			<InputGroup.Root class={nameError ? 'border-destructive ring-destructive/20' : ''}>
				<InputGroup.Addon>
					<BuildingIcon class="size-4 text-muted-foreground" />
				</InputGroup.Addon>
				<InputGroup.Input
					id="name"
					name="name"
					placeholder="Acme Inc"
					disabled={isLoading}
					bind:value={name}
				/>
			</InputGroup.Root>
			{#if nameError}
				<Field.Error>{nameError}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field class="gap-1.5">
			<Field.Label for="slug" class="text-sm font-medium">Organization slug</Field.Label>
			<InputGroup.Root class={slugError ? 'border-destructive ring-destructive/20' : ''}>
				<InputGroup.Addon>
					<LinkIcon class="size-4 text-muted-foreground" />
				</InputGroup.Addon>
				<InputGroup.Input
					id="slug"
					name="slug"
					placeholder="acme-inc"
					disabled={isLoading}
					bind:value={slug}
					oninput={() => (slugManuallyEdited = true)}
				/>
			</InputGroup.Root>
			{#if slugError}
				<Field.Error>{slugError}</Field.Error>
			{/if}
			<Field.Description>Used in URLs. Lowercase, numbers and hyphens only.</Field.Description>
		</Field.Field>
	</div>

	<div class="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">
		<Button type="submit" size="sm" disabled={isLoading}>
			{#if isLoading}
				<Spinner class="mr-2 size-4" />
				Creating...
			{:else}
				Create organization
			{/if}
		</Button>
	</div>
</form>
