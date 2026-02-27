---
name: Effect.ts Backend Patterns
description: Project-specific Effect service patterns for src/lib/server/services and remote functions. Use for new services, service refactors, or Effect error handling.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Effect.ts Backend Patterns

## Scope
- Services in `src/lib/server/services/*`
- Effect infrastructure in `src/lib/server/effect/*`
- Remote functions calling services via `runEffect`

## Key Files
- `src/lib/server/effect/errors.ts`
- `src/lib/server/effect/database.ts`
- `src/lib/server/effect/runtime.ts`
- `src/lib/server/effect/live.ts`

## Non-Negotiables
- Use `AppDatabase.query` or `AppDatabase.transaction` for Kysely work inside services.
- Always scope tenant queries by `organization_id`.
- Convert missing single-item fetches to `NotFoundError`.
- Keep business logic in services; remotes stay thin.
- Register new service layers in `live.ts` and `runtime.ts`.

## Service Skeleton
```ts
import { Context, Effect, Layer } from 'effect';
import { AppDatabase } from '../effect/database';
import { NotFoundError } from '../effect/errors';

export interface ExampleService {
	readonly getById: (organizationId: string, id: string) => Effect.Effect<Example, NotFoundError>;
}

export const ExampleService = Context.GenericTag<ExampleService>('ExampleService');

export const ExampleServiceLive = Layer.effect(
	ExampleService,
	Effect.gen(function* () {
		const database = yield* AppDatabase;

		return ExampleService.of({
			getById: (organizationId, id) =>
				database
					.query(
						'getById',
						(db) =>
							db
								.selectFrom('example')
								.select(['id', 'name'])
								.where('id', '=', id)
								.where('organization_id', '=', organizationId)
								.executeTakeFirst(),
						'example'
					)
					.pipe(
						Effect.flatMap((row) =>
							row
								? Effect.succeed(row)
								: Effect.fail(new NotFoundError({ resource: 'Example', id }))
						)
					)
		});
	})
);
```

## Remote Function Integration
```ts
import { query } from '$app/server';
import { runEffect } from '$lib/server/effect/runtime';
import { ExampleService } from '$lib/server/services/example.service';

export const getExample = query(schema, async ({ organizationSlug, id }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);
	return runEffect(
		Effect.gen(function* () {
			const service = yield* ExampleService;
			return yield* service.getById(organizationId, id);
		})
	);
});
```

## Pitfalls
- Using raw Kysely without `AppDatabase.query` in services.
- Forgetting to add new layers to `live.ts` and `runtime.ts`.
