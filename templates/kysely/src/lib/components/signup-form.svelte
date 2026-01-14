<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { signup } from '$lib/remote/auth.remote';
	import { isHttpError } from '@sveltejs/kit';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

	let signUpError = $state<string | undefined>();
	let isLoading = $state(false);
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
	<Card.Root>
		<Card.Header class="text-center">
			<Card.Title class="text-xl">Create your account</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				{...signup.enhance(async ({ submit }) => {
					signUpError = undefined;
					isLoading = true;

					try {
						await submit();
						// Success - redirect will be handled automatically by SvelteKit
					} catch (error) {
						if (isHttpError(error)) {
							signUpError = error.body.message;
						} else {
							signUpError = 'An unexpected error occurred. Please try again.';
						}
					} finally {
						isLoading = false;
					}
				})}
			>
				<div class="grid gap-6">
					<div class="grid gap-6">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium">Full Name</label>
							<Input
								id="name"
								name="name"
								type="text"
								placeholder="John Doe"
								required
								disabled={isLoading}
							/>
						</div>
						<div class="space-y-2">
							<label for="email" class="text-sm font-medium">Email</label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="m@example.com"
								required
								disabled={isLoading}
							/>
						</div>
						<div class="space-y-2">
							<label for="password" class="text-sm font-medium">Password</label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="Enter your password"
								required
								minlength={8}
								disabled={isLoading}
							/>
						</div>
						{#if signUpError}
							<Alert.Root variant="destructive">
								<CircleAlertIcon class="size-4" />
								<Alert.Title>Error</Alert.Title>
								<Alert.Description>{signUpError}</Alert.Description>
							</Alert.Root>
						{/if}
						<Button type="submit" class="w-full" disabled={isLoading}>
							{isLoading ? 'Creating account...' : 'Create account'}
						</Button>
					</div>
					<div class="text-center text-sm">
						Already have an account?
						<a href="/sign-in" class="underline underline-offset-4"> Sign in </a>
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
