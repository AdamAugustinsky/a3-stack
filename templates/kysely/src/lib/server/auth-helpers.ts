import { getRequestEvent } from '$app/server';
import { Effect } from 'effect';
import { auth } from './auth';
import { requireValue, runServerEffect, tryPromise } from './effect';

/**
 * Get organization context for the current request.
 * Validates that the user has access to the organization.
 */
export async function getOrganizationContext(organizationSlug: string) {
	return runServerEffect(
		Effect.gen(function* () {
			const event = getRequestEvent();
			const headers = new Headers(event.request.headers);

			const organization = yield* tryPromise(
				() =>
					auth.api.getFullOrganization({
						headers,
						query: { organizationSlug }
					}),
				{
					message: 'Failed to fetch organization context'
				}
			);

			const resolvedOrganization = yield* requireValue(
				organization,
				401,
				'Organization not found or access denied'
			);

			return {
				organizationId: resolvedOrganization.id,
				organizationSlug: resolvedOrganization.slug,
				organization: resolvedOrganization
			};
		})
	);
}
