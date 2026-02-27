<script lang="ts">
	import { GalleryVerticalEndIcon } from '@lucide/svelte';
	import CreateOrganizationForm from '@/components/create-organization-form.svelte';
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<a href="/" class="flex items-center gap-2 self-center font-medium">
			<div
				class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
			>
				<GalleryVerticalEndIcon class="size-4" />
			</div>
			Acme Inc.
		</a>

		<div class="rounded-lg border bg-background p-6 shadow-sm">
			<h1 class="mb-1 text-lg font-semibold">Create your organization</h1>
			<p class="mb-4 text-sm text-muted-foreground">
				You need an organization to continue. Choose a name and a unique slug.
			</p>
			<CreateOrganizationForm />
		</div>
	</div>
</div>
