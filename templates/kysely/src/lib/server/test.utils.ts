import type { RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { Effect } from 'effect';
import { Kysely, sql } from 'kysely';
import { KyselyPGlite } from 'kysely-pglite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { DB } from './db/db.types';

const tryPromise = <A>(run: () => Promise<A>, message: string) =>
	Effect.tryPromise({
		try: run,
		catch: (cause) => new Error(message, { cause })
	});

export const createTestDb = async () =>
	Effect.runPromise(
		Effect.gen(function* () {
			const { dialect, client } = yield* tryPromise(
				() => KyselyPGlite.create(),
				'Failed to create PGlite database'
			);
			const db = new Kysely<DB>({ dialect });

			const schemaPath = path.join(process.cwd(), 'schema.sql');
			const schemaSql = readFileSync(schemaPath, 'utf-8');
			const statements = schemaSql
				.split(';')
				.map((statement) => statement.trim())
				.filter((statement) => statement.length > 0);

			yield* Effect.forEach(
				statements,
				(statement) =>
					tryPromise(() => sql.raw(statement).execute(db), 'Failed to execute schema statement'),
				{
					discard: true
				}
			);

			return {
				db,
				cleanup: () => client.close()
			};
		})
	);

export const createTestApp = async () =>
	Effect.runPromise(
		Effect.gen(function* () {
			const { db, cleanup } = yield* tryPromise(
				() => createTestDb(),
				'Failed to prepare test database'
			);

			const dummyGetRequestEvent = () =>
				({
					request: {
						headers: new Headers()
					}
				}) as RequestEvent;

			const auth = betterAuth({
				database: { type: 'postgres', db },
				emailAndPassword: { enabled: true },
				plugins: [sveltekitCookies(dummyGetRequestEvent), organization()]
			});

			const testUser = {
				email: 'test@example.com',
				password: 'testpassword123',
				name: 'Test User'
			};

			const signupResult = yield* tryPromise(
				() => auth.api.signUpEmail({ body: testUser }),
				'Failed to create test user'
			);
			if (!signupResult?.user) {
				throw new Error('Failed to create test user');
			}

			const signinResult = yield* tryPromise(
				() =>
					auth.api.signInEmail({
						body: { email: testUser.email, password: testUser.password },
						asResponse: true
					}),
				'Failed to sign in test user'
			);
			if (signinResult.status !== 200) {
				throw new Error(`Failed to sign in test user: ${signinResult.status}`);
			}

			const setCookieHeader = signinResult.headers.get('set-cookie');
			if (!setCookieHeader) {
				throw new Error('No session cookie returned from sign in');
			}

			const sessionCookie = setCookieHeader.split(';')[0];
			const headers = new Headers({ cookie: sessionCookie });

			const organizationResult = yield* tryPromise(
				() =>
					auth.api.createOrganization({
						body: { name: 'Test Organization', slug: 'test-org' },
						headers
					}),
				'Failed to create test organization'
			);
			if (!organizationResult?.id) {
				throw new Error('Failed to create test organization');
			}

			yield* tryPromise(
				() =>
					auth.api.setActiveOrganization({
						body: { organizationId: organizationResult.id },
						headers
					}),
				'Failed to set active organization'
			);

			return {
				cleanup,
				db,
				auth,
				testUser,
				organizationId: organizationResult.id,
				organizationSlug: 'test-org',
				sessionCookie,
				headers
			};
		})
	);
