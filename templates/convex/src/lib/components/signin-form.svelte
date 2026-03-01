<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { api } from '$convex/api';
	import { getConvexClient } from 'convex-sveltekit';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
	const convex = getConvexClient();

	let loginError = $state<string | undefined>();
	let isLoading = $state(false);
	let email = $state('');
	let password = $state('');

	async function listOrganizationsWithRetry(maxAttempts = 5) {
		for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
			try {
				return await convex.query(api.organizations.listOrganizations, {});
			} catch (error) {
				if (attempt === maxAttempts) {
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, attempt * 150));
			}
		}

		return [];
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		loginError = undefined;
		isLoading = true;

		try {
			const result = await authClient.signIn.email({
				email,
				password
			});

			if (result.error) {
				loginError = result.error.message ?? 'Invalid email or password';
				return;
			}

			const organizations = await listOrganizationsWithRetry();
			if (organizations.length > 0) {
				await goto(`/${organizations[0].slug}/dashboard`);
				return;
			}

			await goto('/create-organization');
		} catch (error) {
			loginError = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Welcome back</Card.Title>
		</Card.Header>
		<Card.Content>
			<form onsubmit={handleSubmit}>
				<div class="grid gap-6">
					<div class="grid gap-6">
						<div class="space-y-2">
							<label for="email" class="text-sm font-medium">Email</label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="m@example.com"
								required
								disabled={isLoading}
								bind:value={email}
							/>
						</div>
						<div class="space-y-2">
							<label for="password" class="text-sm font-medium">Password</label>
							<a href="/forgot-password" class="ml-auto text-sm underline-offset-4 hover:underline">
								Forgot your password?
							</a>
							<Input
								id="password"
								name="password"
								type="password"
								required
								disabled={isLoading}
								bind:value={password}
							/>
						</div>
						{#if loginError}
							<Alert.Root variant="destructive" class="py-2.5">
								<CircleAlertIcon class="size-4" />
								<Alert.Description class="text-sm">{loginError}</Alert.Description>
							</Alert.Root>
						{/if}
						<Button type="submit" class="w-full" disabled={isLoading}>
							{isLoading ? 'Signing in...' : 'Login'}
						</Button>
					</div>
					<div class="text-center text-sm">
						Don&apos;t have an account?
						<a href="/sign-up" class="underline underline-offset-4"> Sign up </a>
					</div>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
	<div
		class="text-center text-xs text-balance text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary"
	>
		By clicking continue, you agree to our <a href="##">Terms of Service</a>
		and <a href="##">Privacy Policy</a>.
	</div>
</div>
