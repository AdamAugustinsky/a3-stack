import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { failHttp, requireValue, runServerEffect, tryPromise } from '$lib/server/effect';
import { Effect } from 'effect';
import * as v from 'valibot';

const updateProfileSchema = v.object({
	name: v.pipe(
		v.string(),
		v.minLength(2, 'Name must be at least 2 characters'),
		v.maxLength(100, 'Name must be less than 100 characters')
	)
});

export const updateProfile = form(updateProfileSchema, ({ name }) =>
	runServerEffect(
		Effect.gen(function* () {
			const event = getRequestEvent();

			const session = yield* tryPromise(
				() =>
					auth.api.getSession({
						headers: event.request.headers
					}),
				{
					message: 'Failed to load session'
				}
			);

			yield* requireValue(session, 401, 'Unauthorized');

			const user = yield* tryPromise(
				() =>
					auth.api.updateUser({
						body: { name },
						headers: event.request.headers
					}),
				{
					message: 'Failed to update profile'
				}
			);

			if (!user) {
				yield* failHttp(500, 'Failed to update profile');
			}

			return { success: true, user };
		})
	)
);
