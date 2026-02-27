import type { Handle } from '@sveltejs/kit';
import { resolve as resolveRoute } from '$app/paths';
import { api } from '$convex/api';
import { createAuth } from '../convex/auth';
import { createConvexHttpClient, getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { Effect } from 'effect';
import { failRedirect, runServerEffect, tryPromise } from '$lib/server/effect';

export const handle: Handle = ({ event, resolve }) =>
	runServerEffect(
		Effect.gen(function* () {
			const token = yield* tryPromise(() => getToken(createAuth, event.cookies), {
				message: 'Failed to resolve Better Auth token'
			});
			event.locals.token = token ?? undefined;

			const isProtectedRoute = event.route.id?.includes('(protected)') ?? false;
			const isSignRoute = event.route.id === '/sign-in' || event.route.id === '/sign-up';

			if (token) {
				const client = createConvexHttpClient({ token });
				const user = yield* tryPromise(
					() => client.query(api.auth.getCurrentUser, {}),
					{ message: 'Failed to load current user' }
				);
				event.locals.user = user
					? {
							id: user.userId ?? user._id,
							name: user.name,
							email: user.email,
							emailVerified: user.emailVerified,
							image: user.image ?? null,
							createdAt: new Date(user.createdAt ?? user._creationTime),
							updatedAt: new Date(user.updatedAt ?? user._creationTime)
						}
					: undefined;

				if (!user && isProtectedRoute) {
					yield* failRedirect(307, '/sign-in');
				}

				if (user && isSignRoute) {
					const organizations = yield* tryPromise(
						() => client.query(api.organizations.listOrganizations, {}),
						{ message: 'Failed to list organizations' }
					);

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
			}

			if (!token && isProtectedRoute) {
				yield* failRedirect(307, '/sign-in');
			}

			return yield* tryPromise(async () => resolve(event), {
				message: 'Failed to resolve request'
			});
		})
	);
