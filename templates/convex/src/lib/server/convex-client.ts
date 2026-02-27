import { getRequestEvent } from '$app/server';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export function getServerConvexClient() {
	const event = getRequestEvent();
	return createConvexHttpClient({ token: event.locals.token ?? undefined });
}
