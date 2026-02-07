import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { Effect } from 'effect';
import { runServerEffect, tryPromise } from '$lib/server/effect';

export const load: PageServerLoad = ({ params, request }) =>
	runServerEffect(
		Effect.gen(function* () {
			const activeOrganization = yield* tryPromise(
				() =>
					auth.api.getFullOrganization({
						headers: request.headers,
						query: { organizationSlug: params.organization_slug }
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
