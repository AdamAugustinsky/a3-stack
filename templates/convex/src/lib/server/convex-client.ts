import { getRequestEvent } from '$app/server';
import { createConvexHttpClient } from './convex-better-auth-sveltekit';

export function getServerConvexClient() {
	const event = getRequestEvent();
	return createConvexHttpClient({ token: event.locals.token ?? undefined });
}
