import { auth } from '$lib/server/auth';
import { redirect, type Handle } from '@sveltejs/kit';
import { resolve as resolveRoute } from '$app/paths';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	const isProtectedRoute = event.route.id?.includes('(protected)') ?? false;
	const isSignRoute = event.route.id == '/sign-in' || event.route.id == '/sign-up';

	if (session) {
		const organizations = await auth.api.listOrganizations({
			headers: event.request.headers
		});

		event.locals.session = session.session;
		event.locals.user = session.user;

		if (isSignRoute) {
			return redirect(
				307,
				resolveRoute('/(protected)/[organization_slug]/dashboard', {
					organization_slug: organizations[0].slug
				})
			);
		}
	} else if (!session && isProtectedRoute) {
		return redirect(307, '/sign-in');
	}

	return await resolve(event);
};
