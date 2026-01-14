import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, request }) => {
	const activeOrganization = await auth.api.getFullOrganization({
		headers: request.headers,
		query: { organizationSlug: params.organization_slug }
	});

	return {
		activeOrganization
	};
};
