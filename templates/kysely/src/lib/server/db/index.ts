import type { DB } from './db.types';
import { Kysely } from 'kysely';
import { BunPostgresDialect } from 'kysely-bun-sql';
import { env } from '$env/dynamic/private';
import { Effect } from 'effect';

const createDb = Effect.sync(
	() =>
		new Kysely<DB>({
			dialect: new BunPostgresDialect({
				url: env.DATABASE_URL
			})
		})
);

export const db = Effect.runSync(createDb);
