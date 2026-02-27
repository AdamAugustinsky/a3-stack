---
name: effect-comprehensive
description: Write idiomatic Effect code for complex flows, retries, concurrency, or testing. Use for advanced refactors or non-trivial Effect work.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Effect.ts Comprehensive Guide (Condensed)

## When to Use
- Complex Effect refactors or new shared utilities.
- Advanced error handling, retries, concurrency, or resource management.
- Testing services with custom layers.

## Core Building Blocks
- `Effect.gen` for sequential composition.
- `Effect.fn('name')` for traced, named effects.
- `Context.Tag` plus `Layer` for dependency injection.
- `Effect.all` for parallel work.
- `Ref` for state across retries.
- `Schedule.recurs` or `Schedule.exponential` for retry policies.
- `Schema` for decoding and validation.

## Minimal Patterns
```ts
const program = Effect.gen(function* () {
	const value = yield* fetchValue;
	return yield* processValue(value);
});

const traced = Effect.fn('processUser')(function* (userId: string) {
	const user = yield* getUser(userId);
	return yield* processData(user);
});
```

```ts
class Service extends Context.Tag('@app/Service')<
	Service,
	{ readonly doThing: () => Effect.Effect<Result, AppError> }
>() {}

const ServiceLive = Layer.effect(Service, Effect.gen(function* () {
	return Service.of({ doThing: () => Effect.succeed(result) });
}));
```

```ts
const withRetry = call.pipe(
	Effect.timeout('2 seconds'),
	Effect.retry(Schedule.exponential('100 millis').pipe(Schedule.compose(Schedule.recurs(3))))
);
```

```ts
const result = yield* Effect.all([taskA, taskB], { concurrency: 'unbounded' });
```

## Error Handling
- Use tagged errors and `Effect.catchTag` for typed recovery.
- Normalize errors with `Effect.mapError` when crossing boundaries.

## Testing
- Use `ManagedRuntime` with test layers.
- Provide mocks with `Layer.succeed`.

## Pitfalls
- Throwing exceptions instead of `Effect.fail`.
- Spawning new runtimes per request.
- Manual mutable state instead of `Ref`.
