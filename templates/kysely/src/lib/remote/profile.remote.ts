import { form } from '$app/server';
import { auth } from '$lib/server/auth';
import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';

const updateProfileSchema = v.object({
	name: v.pipe(
		v.string(),
		v.minLength(2, 'Name must be at least 2 characters'),
		v.maxLength(100, 'Name must be less than 100 characters')
	)
});

export const updateProfile = form(updateProfileSchema, async ({ name }) => {
	const event = getRequestEvent();
	if (!event) {
		error(500, 'Request context not available');
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session) {
		error(401, 'Unauthorized');
	}

	const response = await auth.api.updateUser({
		body: { name },
		headers: event.request.headers
	});

	if (!response) {
		error(500, 'Failed to update profile');
	}

	return { success: true, user: response };
});
