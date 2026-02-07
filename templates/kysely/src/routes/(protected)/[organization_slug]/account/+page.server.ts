import type { PageServerLoad } from './$types';
import { Effect } from 'effect';
import { runServerEffect } from '$lib/server/effect';

export const load: PageServerLoad = ({ locals }) =>
	runServerEffect(
		Effect.succeed({
			user: locals.user!,
			session: locals.session!
		})
	);
