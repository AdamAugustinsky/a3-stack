import type { DB } from './db.types';
import { Kysely } from 'kysely';
import { BunPostgresDialect } from 'kysely-bun-sql';
import { env } from '$env/dynamic/private';

const dialect = new BunPostgresDialect({
	url: env.DATABASE_URL
});

export const db = new Kysely<DB>({
	dialect
});
