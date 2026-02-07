import { command, form, query } from '$app/server';
import { Task } from '$lib/schemas/todo';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { failHttp, HttpFailure, runServerEffect, tryPromise } from '$lib/server/effect';
import { applyFilters } from '$lib/utils/kysely-filter-builder';
import { filterSchema } from '$lib/utils/filter';
import { Effect } from 'effect';
import * as v from 'valibot';

const toTask = (input: {
	readonly id: number;
	readonly text: string;
	readonly completed: boolean;
	readonly priority: string;
	readonly status: string;
	readonly label: string;
	readonly created_at: Date;
	readonly updated_at: Date;
}): Task =>
	v.parse(Task, {
		id: input.id,
		text: input.text,
		completed: input.completed,
		priority: input.priority,
		status: input.status,
		label: input.label,
		createdAt: input.created_at,
		updatedAt: input.updated_at
	});

const getTodosSchema = v.object({
	organizationSlug: v.string(),
	filters: v.optional(v.array(filterSchema))
});

export const getTodos = query(getTodosSchema, ({ organizationSlug, filters }) =>
	runServerEffect(
		Effect.gen(function* () {
			const { organizationId } = yield* tryPromise(() => getOrganizationContext(organizationSlug), {
				message: 'Failed to resolve organization context'
			});

			let todoQuery = db
				.selectFrom('todo')
				.selectAll()
				.where('organization_id', '=', organizationId);
			if (filters && filters.length > 0) {
				todoQuery = applyFilters(todoQuery, filters);
			}

			const rows = yield* tryPromise(() => todoQuery.execute(), {
				message: 'Failed to load todos'
			});

			return yield* Effect.try({
				try: () => rows.map(toTask),
				catch: (cause) =>
					new HttpFailure({
						status: 500,
						message: 'Invalid todo data returned from database',
						cause
					})
			});
		})
	)
);

const createTodoFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.nonEmpty('Organization slug is required')),
	text: v.pipe(v.string(), v.nonEmpty('Task description is required')),
	completed: v.optional(
		v.pipe(
			v.string(),
			v.transform((value) => value === 'true')
		)
	),
	label: v.union(
		[v.literal('bug'), v.literal('feature'), v.literal('documentation')],
		'Please select a valid label: bug, feature, or documentation'
	),
	status: v.union(
		[
			v.literal('backlog'),
			v.literal('todo'),
			v.literal('in progress'),
			v.literal('done'),
			v.literal('canceled')
		],
		'Please select a valid status: backlog, todo, in progress, done, or canceled'
	),
	priority: v.union(
		[v.literal('low'), v.literal('medium'), v.literal('high')],
		'Please select a valid priority: low, medium, or high'
	)
});

export const createTodo = form(
	createTodoFormSchema,
	({ organizationSlug, text, completed, priority, status, label }) =>
		runServerEffect(
			Effect.gen(function* () {
				const { organizationId } = yield* tryPromise(
					() => getOrganizationContext(organizationSlug),
					{
						message: 'Failed to resolve organization context'
					}
				);

				yield* tryPromise(
					() =>
						db
							.insertInto('todo')
							.values({
								text,
								completed: completed ?? false,
								priority: priority ?? 'medium',
								status: status ?? 'todo',
								label: label ?? 'feature',
								organization_id: organizationId,
								created_at: new Date(),
								updated_at: new Date()
							})
							.execute(),
					{
						message: 'Failed to create todo'
					}
				);

				return { success: true };
			})
		)
);

const deleteTodoSchema = v.object({
	organizationSlug: v.string(),
	id: v.number('ID must be a number'),
	filters: v.optional(v.array(filterSchema))
});

export const deleteTodo = command(deleteTodoSchema, ({ organizationSlug, id, filters }) =>
	runServerEffect(
		Effect.gen(function* () {
			const { organizationId } = yield* tryPromise(() => getOrganizationContext(organizationSlug), {
				message: 'Failed to resolve organization context'
			});

			const deleted = yield* tryPromise(
				() =>
					db
						.deleteFrom('todo')
						.where('id', '=', id)
						.where('organization_id', '=', organizationId)
						.returningAll()
						.execute(),
				{
					message: 'Failed to delete todo'
				}
			);

			if (deleted.length === 0) {
				yield* failHttp(404, 'Todo not found');
			}

			const refreshes: Promise<unknown>[] = [getTodos({ organizationSlug }).refresh()];
			if (filters !== undefined) {
				refreshes.push(getTodos({ organizationSlug, filters }).refresh());
			}

			yield* tryPromise(() => Promise.all(refreshes), {
				message: 'Failed to refresh todo queries'
			});

			return { success: true };
		})
	)
);

const bulkUpdateTodosSchema = v.object({
	organizationSlug: v.string(),
	ids: v.array(v.number('ID must be a number')),
	updates: v.object({
		status: v.optional(
			v.union([
				v.literal('backlog'),
				v.literal('todo'),
				v.literal('in progress'),
				v.literal('done'),
				v.literal('canceled')
			])
		),
		priority: v.optional(v.union([v.literal('low'), v.literal('medium'), v.literal('high')])),
		label: v.optional(
			v.union([v.literal('bug'), v.literal('feature'), v.literal('documentation')])
		),
		completed: v.optional(v.boolean())
	})
});

export const bulkUpdateTodos = command(
	bulkUpdateTodosSchema,
	({ organizationSlug, ids, updates }) =>
		runServerEffect(
			Effect.gen(function* () {
				if (ids.length === 0) {
					yield* failHttp(400, 'No todo IDs provided');
				}

				const { organizationId } = yield* tryPromise(
					() => getOrganizationContext(organizationSlug),
					{
						message: 'Failed to resolve organization context'
					}
				);

				const filteredUpdates = Object.fromEntries(
					Object.entries(updates).filter(([, value]) => value !== undefined)
				) as Partial<{
					priority: Task['priority'];
					status: Task['status'];
					text: Task['text'];
					label: Task['label'];
					completed: boolean;
				}>;

				if (Object.keys(filteredUpdates).length === 0) {
					yield* failHttp(400, 'No valid updates provided');
				}

				yield* tryPromise(
					() =>
						db
							.updateTable('todo')
							.set({
								...filteredUpdates,
								updated_at: new Date()
							})
							.where('id', 'in', ids)
							.where('organization_id', '=', organizationId)
							.execute(),
					{
						message: 'Failed to bulk update todos'
					}
				);

				return { success: true, updatedCount: ids.length };
			})
		)
);

const bulkDeleteTodosSchema = v.object({
	organizationSlug: v.string(),
	ids: v.array(v.number('ID must be a number')),
	filters: v.optional(v.array(filterSchema))
});

export const bulkDeleteTodos = command(
	bulkDeleteTodosSchema,
	({ organizationSlug, ids, filters }) =>
		runServerEffect(
			Effect.gen(function* () {
				if (ids.length === 0) {
					yield* failHttp(400, 'No todo IDs provided');
				}

				const { organizationId } = yield* tryPromise(
					() => getOrganizationContext(organizationSlug),
					{
						message: 'Failed to resolve organization context'
					}
				);

				const deleted = yield* tryPromise(
					() =>
						db
							.deleteFrom('todo')
							.where('id', 'in', ids)
							.where('organization_id', '=', organizationId)
							.returningAll()
							.execute(),
					{
						message: 'Failed to bulk delete todos'
					}
				);

				if (deleted.length === 0) {
					yield* failHttp(404, 'No todos found with the provided IDs');
				}

				const refreshes: Promise<unknown>[] = [getTodos({ organizationSlug }).refresh()];
				if (filters !== undefined) {
					refreshes.push(getTodos({ organizationSlug, filters }).refresh());
				}

				yield* tryPromise(() => Promise.all(refreshes), {
					message: 'Failed to refresh todo queries'
				});

				return { success: true, deletedCount: ids.length };
			})
		)
);

const updateTodoFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.nonEmpty('Organization slug is required')),
	id: v.pipe(
		v.string(),
		v.transform((value) => parseInt(value, 10)),
		v.number('ID must be a number')
	),
	text: v.optional(v.pipe(v.string(), v.nonEmpty('Task description is required'))),
	completed: v.optional(
		v.pipe(
			v.string(),
			v.transform((value) => value === 'true')
		)
	),
	label: v.optional(
		v.union(
			[v.literal('bug'), v.literal('feature'), v.literal('documentation')],
			'Please select a valid label: bug, feature, or documentation'
		)
	),
	status: v.optional(
		v.union(
			[
				v.literal('backlog'),
				v.literal('todo'),
				v.literal('in progress'),
				v.literal('done'),
				v.literal('canceled')
			],
			'Please select a valid status: backlog, todo, in progress, done, or canceled'
		)
	),
	priority: v.optional(
		v.union(
			[v.literal('low'), v.literal('medium'), v.literal('high')],
			'Please select a valid priority: low, medium, or high'
		)
	)
});

export const updateTodo = form(updateTodoFormSchema, ({ organizationSlug, id, ...maybeUpdates }) =>
	runServerEffect(
		Effect.gen(function* () {
			const { organizationId } = yield* tryPromise(() => getOrganizationContext(organizationSlug), {
				message: 'Failed to resolve organization context'
			});

			const updates = Object.fromEntries(
				Object.entries(maybeUpdates).filter(([, value]) => value !== undefined)
			) as Partial<Pick<Task, 'text' | 'label' | 'status' | 'priority'>> & {
				completed?: boolean;
			};

			if (Object.keys(updates).length === 0) {
				yield* failHttp(400, 'No updates provided');
			}

			const result = yield* tryPromise(
				() =>
					db
						.updateTable('todo')
						.set({
							...updates,
							updated_at: new Date()
						})
						.where('id', '=', id)
						.where('organization_id', '=', organizationId)
						.returningAll()
						.execute(),
				{
					message: 'Failed to update todo'
				}
			);

			if (result.length === 0) {
				yield* failHttp(404, 'Todo not found');
			}

			return { success: true };
		})
	)
);
