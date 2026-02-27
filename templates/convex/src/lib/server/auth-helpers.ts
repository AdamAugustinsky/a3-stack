import { Effect } from 'effect';
import { api } from '$convex/api';
import { requireValue, tryPromise } from './effect';
import { getServerConvexClient } from './convex-client';

/**
 * Get organization context for the current request.
 * Validates that the user has access to the organization.
 */
export function getOrganizationContext(organizationSlug: string) {
	return Effect.gen(function* () {
		const client = getServerConvexClient();
		const organization = yield* tryPromise(
			() =>
				client.query(api.organizations.getOrganizationBySlug, {
					organizationSlug
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
	});
}
