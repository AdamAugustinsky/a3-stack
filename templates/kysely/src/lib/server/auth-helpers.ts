import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { auth } from './auth';

/**
 * Get organization context for the current request.
 * Validates that the user has access to the organization.
 */
export async function getOrganizationContext(organizationSlug: string) {
	const event = getRequestEvent();
	const headers = new Headers(event.request.headers);

	const organization = await auth.api.getFullOrganization({
		headers,
		query: { organizationSlug }
	});

	if (!organization) {
		error(401, 'Organization not found or access denied');
	}

	return {
		organizationId: organization.id,
		organizationSlug: organization.slug,
		organization
	};
}
