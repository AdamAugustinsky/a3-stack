<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { isHttpError } from '@sveltejs/kit';
	import { createOrganization } from '$lib/remote/organization.remote';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as v from 'valibot';

	const schema = v.object({
		name: v.pipe(v.string(), v.minLength(1, 'Organization name is required')),
		slug: v.pipe(v.string(), v.minLength(1, 'Organization slug is required'))
	});

	let errorValue = $state<string | undefined>();
	let isLoading = $state(false);

	$effect(() => {
		const name = createOrganization.fields.name.value();
		if (name) {
			const proposedSlug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '');

			createOrganization.fields.slug.set(proposedSlug);
		}
	});

	const nameIssues = $derived(createOrganization.fields.name.issues() ?? []);
	const slugIssues = $derived(createOrganization.fields.slug.issues() ?? []);
</script>

<form
	{...createOrganization.preflight(schema).enhance(async ({ submit }) => {
		errorValue = undefined;
		isLoading = true;
		try {
			await submit();
			const slug = createOrganization.fields.slug.value();
			createOrganization.fields.name.set('');
			createOrganization.fields.slug.set('');

			goto(resolve('/(protected)/[organization_slug]/dashboard', { organization_slug: slug }));
		} catch (error) {
			if (isHttpError(error)) {
				errorValue = error.body.message;
			} else {
				errorValue = error instanceof Error ? error.message : 'Failed to create organization';
			}
		} finally {
			isLoading = false;
		}
	})}
	class="flex flex-col"
>
	<div class="space-y-3.5 px-5 py-4">
		{#if errorValue}
			<Alert.Root variant="destructive" class="py-2.5">
				<CircleAlertIcon class="size-4" />
				<Alert.Description class="text-sm">{errorValue}</Alert.Description>
			</Alert.Root>
		{/if}

		<Field.Field class="gap-1.5">
			<Field.Label for="name" class="text-sm font-medium">Organization name</Field.Label>
			<InputGroup.Root class={nameIssues.length > 0 ? 'border-destructive ring-destructive/20' : ''}>
				<InputGroup.Addon>
					<BuildingIcon class="size-4 text-muted-foreground" />
				</InputGroup.Addon>
				<InputGroup.Input
					{...createOrganization.fields.name.as('text')}
					id="name"
					placeholder="Acme Inc"
					disabled={isLoading}
				/>
			</InputGroup.Root>
			{#each nameIssues as issue (issue.message)}
				<Field.Error>{issue.message}</Field.Error>
			{/each}
		</Field.Field>

		<Field.Field class="gap-1.5">
			<Field.Label for="slug" class="text-sm font-medium">Organization slug</Field.Label>
			<InputGroup.Root class={slugIssues.length > 0 ? 'border-destructive ring-destructive/20' : ''}>
				<InputGroup.Addon>
					<LinkIcon class="size-4 text-muted-foreground" />
				</InputGroup.Addon>
				<InputGroup.Input
					{...createOrganization.fields.slug.as('text')}
					id="slug"
					placeholder="acme-inc"
					disabled={isLoading}
				/>
			</InputGroup.Root>
			{#each slugIssues as issue (issue.message)}
				<Field.Error>{issue.message}</Field.Error>
			{/each}
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
