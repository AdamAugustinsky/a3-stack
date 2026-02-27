import type { LayoutServerLoad } from './$types';
import { api } from '$convex/api';
import { convexLoad } from 'convex-sveltekit';
import { Effect } from 'effect';
import { runServerEffect, requireValue, tryPromise } from '$lib/server/effect';

export const load: LayoutServerLoad = ({ locals }) =>
	runServerEffect(
		Effect.gen(function* () {
			const user = yield* requireValue(locals.user, 401, 'Unauthorized');
			const organizations = yield* tryPromise(
				() => convexLoad(api.organizations.listOrganizations, {}),
				{ message: 'Failed to load organizations' }
			);
			return { user, organizations };
		})
	);
