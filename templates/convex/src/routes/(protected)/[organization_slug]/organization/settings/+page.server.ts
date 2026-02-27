import type { PageServerLoad } from './$types';
import { api } from '$convex/api';
import { getServerConvexClient } from '$lib/server/convex-client';
import { Effect } from 'effect';
import { runServerEffect, tryPromise } from '$lib/server/effect';

export const load: PageServerLoad = ({ params }) =>
	runServerEffect(
		Effect.gen(function* () {
			const client = getServerConvexClient();
			const activeOrganization = yield* tryPromise(
				() =>
					client.query(api.organizations.getOrganizationBySlug, {
						organizationSlug: params.organization_slug
					}),
				{
					message: 'Failed to load active organization'
				}
			);

			return {
				activeOrganization
			};
		})
	);
