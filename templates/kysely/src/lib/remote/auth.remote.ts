import { form, command, query, getRequestEvent } from '$app/server';
import { auth } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import * as v from 'valibot';

export const getSession = query(async () => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.getSession({ headers });
	return result;
});

const signinSchema = v.object({
	email: v.pipe(v.string(), v.email(), v.minLength(1)),
	password: v.pipe(v.string(), v.minLength(1))
});

const signupSchema = v.object({
	email: v.pipe(v.string(), v.email(), v.minLength(1)),
	password: v.pipe(v.string(), v.minLength(8)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

export const signin = form(signinSchema, async (data) => {
	const { email, password } = data;

	const response = await auth.api.signInEmail({
		body: {
			email,
			password
		},
		asResponse: true
	});

	switch (response.status) {
		case 200: {
			// Use response.headers for subsequent API calls to reflect the new session
			const organizations = await auth.api.listOrganizations({
				headers: {
					cookie: response.headers.get('set-cookie') ?? ''
				}
			});

			if (Array.isArray(organizations) && organizations.length > 0) {
				return redirect(303, `/${organizations[0].slug}/dashboard`);
			}
			return redirect(303, '/create-organization');
		}
		case 401:
			return error(401, 'Invalid email or password');
		case 404:
			return error(404, 'No account found with this email');
		case 429:
			return error(429, 'Too many login attempts. Please try again later');
		case 400:
			return error(400, 'Invalid input provided');
		case 500:
			return error(500, 'Server error. Please try again later');
		default:
			return error(400, 'Failed to sign in');
	}
});

export const signup = form(signupSchema, async (data) => {
	const { email, password, name } = data;

	const response = await auth.api.signUpEmail({
		body: {
			email,
			password,
			name
		},
		asResponse: true
	});

	console.log({ status: response.status, idk: response });

	switch (response.status) {
		case 200: {
			// Ensure the user is signed in after sign up
			await auth.api.signInEmail({
				body: { email, password },
				asResponse: false
			});

			const organizations = await auth.api.listOrganizations({
				headers: {
					cookie: response.headers.get('set-cookie') ?? ''
				}
			});

			if (Array.isArray(organizations) && organizations.length > 0) {
				return redirect(303, `/${organizations[0].slug}/dashboard`);
			}
			return redirect(303, '/create-organization');
		}
		case 409:
			return error(409, 'An account with this email already exists');
		case 400:
			return error(400, 'Invalid input provided');
		case 500:
			return error(500, 'Server error. Please try again later');
		default:
			return error(400, 'Failed to create account');
	}
});

export const logout = command(async () => {
	const event = getRequestEvent();
	if (!event) {
		error(500, 'Request context not available');
	}

	await auth.api.signOut({
		headers: event.request.headers
	});

	return { success: true };
});
