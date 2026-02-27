import { error, redirect } from '@sveltejs/kit';
import { Data, Effect } from 'effect';

export class HttpFailure extends Data.TaggedError('HttpFailure')<{
	readonly status: number;
	readonly message: string;
	readonly cause?: unknown;
}> {}

export class RedirectFailure extends Data.TaggedError('RedirectFailure')<{
	readonly status: number;
	readonly location: string;
}> {}

export type ServerFailure = HttpFailure | RedirectFailure;

export function failHttp(status: number, message: string, cause?: unknown) {
	return Effect.fail(new HttpFailure({ status, message, cause }));
}

export function failRedirect(status: number, location: string) {
	return Effect.fail(new RedirectFailure({ status, location }));
}

export function requireValue<A>(value: A | null | undefined, status: number, message: string) {
	if (value === null || value === undefined) {
		return failHttp(status, message);
	}

	return Effect.succeed(value as NonNullable<A>);
}

export function tryPromise<A>(
	run: () => Promise<A>,
	options: {
		readonly message: string;
		readonly status?: number;
	}
) {
	return Effect.tryPromise({
		try: run,
		catch: (cause) =>
			new HttpFailure({
				status: options.status ?? 500,
				message: options.message,
				cause
			})
	});
}

export function runServerEffect<A>(program: Effect.Effect<A, ServerFailure, never>) {
	return Effect.runPromise(
		program.pipe(
			Effect.catchDefect((defect) =>
				Effect.fail(
					new HttpFailure({
						status: 500,
						message: 'Unexpected server error',
						cause: defect
					})
				)
			),
			Effect.match({
				onSuccess: (value) =>
					({
						_tag: 'Success',
						value
					}) as const,
				onFailure: (failure) =>
					({
						_tag: 'Failure',
						failure
					}) as const
			})
		)
	).then((result) => {
		if (result._tag === 'Success') {
			return result.value;
		}

		if (result.failure._tag === 'RedirectFailure') {
			throw redirect(result.failure.status, result.failure.location);
		}

		throw error(result.failure.status, result.failure.message);
	});
}
