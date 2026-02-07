import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { resolve as resolveRoute } from '$app/paths';
import { Effect } from 'effect';
import { failRedirect, runServerEffect, tryPromise } from '$lib/server/effect';

export const handle: Handle = ({ event, resolve }) =>
	runServerEffect(
		Effect.gen(function* () {
			const session = yield* tryPromise(
				() =>
					auth.api.getSession({
						headers: event.request.headers
					}),
				{
					message: 'Failed to load session'
				}
			);

			const isProtectedRoute = event.route.id?.includes('(protected)') ?? false;
			const isSignRoute = event.route.id === '/sign-in' || event.route.id === '/sign-up';

			if (session) {
				const organizations = yield* tryPromise(
					() =>
						auth.api.listOrganizations({
							headers: event.request.headers
						}),
					{
						message: 'Failed to list organizations'
					}
				);

				event.locals.session = session.session;
				event.locals.user = session.user;

				if (isSignRoute) {
					const primaryOrganization = organizations[0];
					if (primaryOrganization) {
						yield* failRedirect(
							307,
							resolveRoute('/(protected)/[organization_slug]/dashboard', {
								organization_slug: primaryOrganization.slug
							})
						);
					}

					yield* failRedirect(307, '/create-organization');
				}
			} else if (isProtectedRoute) {
				yield* failRedirect(307, '/sign-in');
			}

			return yield* tryPromise(() => Promise.resolve(resolve(event)), {
				message: 'Failed to resolve request'
			});
		})
	);
