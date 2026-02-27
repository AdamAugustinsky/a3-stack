<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { api } from '$convex/api';
	import { convexForm } from 'convex-sveltekit';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as v from 'valibot';

	let name = $state('');
	let slug = $state('');
	let slugManuallyEdited = $state(false);
	let errorValue = $state<string | undefined>();

	const createOrganizationSchema = v.object({
		name: v.pipe(v.string('Organization name is required'), v.trim(), v.nonEmpty('Organization name is required')),
		slug: v.pipe(
			v.string('Organization slug is required'),
			v.trim(),
			v.nonEmpty('Organization slug is required'),
			v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens')
		)
	});

	const createOrganizationForm = convexForm(
		createOrganizationSchema,
		api.organizations.createOrganization,
		(data) => ({
			name: data.name.trim(),
			slug: data.slug.trim()
		})
	);

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

	const submitCreateOrganization = createOrganizationForm.enhance(async ({ submit }) => {
		errorValue = undefined;

		const nextSlug = slug.trim();
		if (!nextSlug || !isValidSlug(nextSlug)) {
			return;
		}

		try {
			const result = await submit();
			name = '';
			slug = '';
			slugManuallyEdited = false;

			const createdSlug = extractSlug(result) ?? nextSlug;
			await goto(
				resolve('/(protected)/[organization_slug]/dashboard', { organization_slug: createdSlug })
			);
		} catch (error) {
			errorValue = error instanceof Error ? error.message : 'Failed to create organization';
		}
	});
</script>

<form {...submitCreateOrganization} class="flex flex-col">
	<div class="space-y-3.5 px-5 py-4">
		{#if errorValue}
			<Alert.Root variant="destructive" class="py-2.5">
				<CircleAlertIcon class="size-4" />
				<Alert.Description class="text-sm">{errorValue}</Alert.Description>
			</Alert.Root>
		{/if}

		<Field.Field class="gap-1.5">
			<Field.Label for="name" class="text-sm font-medium">Organization name</Field.Label>
			<InputGroup.Root
				class={createOrganizationForm.fields.name.issues()?.length ? 'border-destructive ring-destructive/20' : ''}
			>
				<InputGroup.Addon>
					<BuildingIcon class="size-4 text-muted-foreground" />
				</InputGroup.Addon>
				<InputGroup.Input
					id="name"
					name="name"
					required
					placeholder="Acme Inc"
					disabled={createOrganizationForm.pending > 0}
					bind:value={name}
				/>
			</InputGroup.Root>
			{#if createOrganizationForm.fields.name.issues()?.[0]}
				<Field.Error>{createOrganizationForm.fields.name.issues()?.[0]?.message}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field class="gap-1.5">
			<Field.Label for="slug" class="text-sm font-medium">Organization slug</Field.Label>
			<InputGroup.Root
				class={createOrganizationForm.fields.slug.issues()?.length ? 'border-destructive ring-destructive/20' : ''}
			>
				<InputGroup.Addon>
					<LinkIcon class="size-4 text-muted-foreground" />
				</InputGroup.Addon>
				<InputGroup.Input
					id="slug"
					name="slug"
					required
					placeholder="acme-inc"
					disabled={createOrganizationForm.pending > 0}
					bind:value={slug}
					oninput={() => (slugManuallyEdited = true)}
				/>
			</InputGroup.Root>
			{#if createOrganizationForm.fields.slug.issues()?.[0]}
				<Field.Error>{createOrganizationForm.fields.slug.issues()?.[0]?.message}</Field.Error>
			{/if}
			<Field.Description>Used in URLs. Lowercase, numbers and hyphens only.</Field.Description>
		</Field.Field>
	</div>

	<div class="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">
		<Button type="submit" size="sm" disabled={createOrganizationForm.pending > 0}>
			{#if createOrganizationForm.pending > 0}
				<Spinner class="mr-2 size-4" />
				Creating...
			{:else}
				Create organization
			{/if}
		</Button>
	</div>
</form>
