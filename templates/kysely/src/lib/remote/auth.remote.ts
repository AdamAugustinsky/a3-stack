import { command, form, getRequestEvent, query } from '$app/server';
import { auth } from '$lib/server/auth';
import { failHttp, failRedirect, runServerEffect, tryPromise } from '$lib/server/effect';
import { Effect } from 'effect';
import * as v from 'valibot';

export const getSession = query(() =>
	runServerEffect(
		Effect.gen(function* () {
			const headers = getRequestEvent().request.headers;
			return yield* tryPromise(() => auth.api.getSession({ headers }), {
				message: 'Failed to load session'
			});
		})
	)
);

const signinSchema = v.object({
	email: v.pipe(v.string(), v.email(), v.minLength(1)),
	password: v.pipe(v.string(), v.minLength(1))
});

const signupSchema = v.object({
	email: v.pipe(v.string(), v.email(), v.minLength(1)),
	password: v.pipe(v.string(), v.minLength(8)),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});

export const signin = form(signinSchema, (data) =>
	runServerEffect(
		Effect.gen(function* () {
			const response = yield* tryPromise(
				() =>
					auth.api.signInEmail({
						body: {
							email: data.email,
							password: data.password
						},
						asResponse: true
					}),
				{
					message: 'Failed to sign in'
				}
			);

			switch (response.status) {
				case 200: {
					const organizations = yield* tryPromise(
						() =>
							auth.api.listOrganizations({
								headers: {
									cookie: response.headers.get('set-cookie') ?? ''
								}
							}),
						{
							message: 'Failed to list organizations after sign in'
						}
					);

					if (Array.isArray(organizations) && organizations.length > 0) {
						yield* failRedirect(303, `/${organizations[0].slug}/dashboard`);
					}

					yield* failRedirect(303, '/create-organization');
					break;
				}
				case 401:
					yield* failHttp(401, 'Invalid email or password');
					break;
				case 404:
					yield* failHttp(404, 'No account found with this email');
					break;
				case 429:
					yield* failHttp(429, 'Too many login attempts. Please try again later');
					break;
				case 400:
					yield* failHttp(400, 'Invalid input provided');
					break;
				case 500:
					yield* failHttp(500, 'Server error. Please try again later');
					break;
				default:
					yield* failHttp(400, 'Failed to sign in');
					break;
			}

			return { success: true };
		})
	)
);

export const signup = form(signupSchema, (data) =>
	runServerEffect(
		Effect.gen(function* () {
			const response = yield* tryPromise(
				() =>
					auth.api.signUpEmail({
						body: {
							email: data.email,
							password: data.password,
							name: data.name
						},
						asResponse: true
					}),
				{
					message: 'Failed to sign up'
				}
			);

			switch (response.status) {
				case 200: {
					yield* tryPromise(
						() =>
							auth.api.signInEmail({
								body: { email: data.email, password: data.password },
								asResponse: false
							}),
						{
							message: 'Failed to establish session after sign up'
						}
					);

					const organizations = yield* tryPromise(
						() =>
							auth.api.listOrganizations({
								headers: {
									cookie: response.headers.get('set-cookie') ?? ''
								}
							}),
						{
							message: 'Failed to list organizations after sign up'
						}
					);

					if (Array.isArray(organizations) && organizations.length > 0) {
						yield* failRedirect(303, `/${organizations[0].slug}/dashboard`);
					}

					yield* failRedirect(303, '/create-organization');
					break;
				}
				case 409:
					yield* failHttp(409, 'An account with this email already exists');
					break;
				case 400:
					yield* failHttp(400, 'Invalid input provided');
					break;
				case 500:
					yield* failHttp(500, 'Server error. Please try again later');
					break;
				default:
					yield* failHttp(400, 'Failed to create account');
					break;
			}

			return { success: true };
		})
	)
);

export const logout = command(() =>
	runServerEffect(
		Effect.gen(function* () {
			const event = getRequestEvent();

			yield* tryPromise(
				() =>
					auth.api.signOut({
						headers: event.request.headers
					}),
				{
					message: 'Failed to sign out'
				}
			);

			return { success: true };
		})
	)
);
