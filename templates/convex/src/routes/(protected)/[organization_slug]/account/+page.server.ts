import type { PageServerLoad } from './$types';
import { Effect } from 'effect';
import { runServerEffect, requireValue } from '$lib/server/effect';

export const load: PageServerLoad = ({ locals }) =>
	runServerEffect(
		Effect.gen(function* () {
			const user = yield* requireValue(locals.user, 401, 'Unauthorized');
			return { user };
		})
	);
