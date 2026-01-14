import { command, form, query } from '$app/server';
import { Task } from '$lib/schemas/todo';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { applyFilters } from '$lib/utils/kysely-filter-builder';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { filterSchema } from '$lib/utils/filter';

// Query functions
const toTask = (input: {
	readonly id: number;
	readonly text: string;
	readonly completed: boolean;
	readonly priority: string;
	readonly status: string;
	readonly label: string;
	readonly created_at: Date;
	readonly updated_at: Date;
}): Task => {
	return v.parse(Task, {
		id: input.id,
		text: input.text,
		completed: input.completed,
		priority: input.priority,
		status: input.status,
		label: input.label,
		createdAt: input.created_at,
		updatedAt: input.updated_at
	});
};

const getTodosSchema = v.object({
	organizationSlug: v.string(),
	filters: v.optional(v.array(filterSchema))
});

export const getTodos = query(getTodosSchema, async ({ organizationSlug, filters }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	let todoQuery = db.selectFrom('todo').selectAll().where('organization_id', '=', organizationId);

	// Apply filters if provided
	if (filters && filters.length > 0) {
		todoQuery = applyFilters(todoQuery, filters);
	}

	const result = await todoQuery.execute();
	return result.map(toTask);
});

// Form schema for create todo - handles form data string conversion
const createTodoFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.nonEmpty('Organization slug is required')),
	text: v.pipe(v.string(), v.nonEmpty('Task description is required')),
	completed: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => val === 'true')
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
	async ({ organizationSlug, text, completed, priority, status, label }) => {
		const { organizationId } = await getOrganizationContext(organizationSlug);

		await db
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
			.execute();

		return { success: true };
	}
);

// Delete a single todo
const deleteTodoSchema = v.object({
	organizationSlug: v.string(),
	id: v.number('ID must be a number'),
	filters: v.optional(v.array(filterSchema))
});

export const deleteTodo = command(deleteTodoSchema, async ({ organizationSlug, id, filters }) => {
	const { organizationId } = await getOrganizationContext(organizationSlug);

	const deleted = await db
		.deleteFrom('todo')
		.where('id', '=', id)
		.where('organization_id', '=', organizationId)
		.returningAll()
		.execute();

	if (deleted.length === 0) {
		error(404, 'Todo not found');
	}

	const refreshes = [getTodos({ organizationSlug }).refresh()];
	if (filters !== undefined) {
		refreshes.push(getTodos({ organizationSlug, filters }).refresh());
	}

	await Promise.all(refreshes);

	return { success: true };
});

// Bulk update todos
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
	async ({ organizationSlug, ids, updates }) => {
		if (ids.length === 0) {
			error(400, 'No todo IDs provided');
		}

		const { organizationId } = await getOrganizationContext(organizationSlug);

		// Filter out undefined values from updates
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
			error(400, 'No valid updates provided');
		}

		await db
			.updateTable('todo')
			.set({
				...filteredUpdates,
				updated_at: new Date()
			})
			.where('id', 'in', ids)
			.where('organization_id', '=', organizationId)
			.execute();

		return { success: true, updatedCount: ids.length };
	}
);

// Bulk delete todos
const bulkDeleteTodosSchema = v.object({
	organizationSlug: v.string(),
	ids: v.array(v.number('ID must be a number')),
	filters: v.optional(v.array(filterSchema))
});

export const bulkDeleteTodos = command(
	bulkDeleteTodosSchema,
	async ({ organizationSlug, ids, filters }) => {
		if (ids.length === 0) {
			error(400, 'No todo IDs provided');
		}

		const { organizationId } = await getOrganizationContext(organizationSlug);

		const deleted = await db
			.deleteFrom('todo')
			.where('id', 'in', ids)
			.where('organization_id', '=', organizationId)
			.returningAll()
			.execute();

		if (deleted.length === 0) {
			error(404, 'No todos found with the provided IDs');
		}

		const refreshes = [getTodos({ organizationSlug }).refresh()];
		if (filters !== undefined) {
			refreshes.push(getTodos({ organizationSlug, filters }).refresh());
		}

		await Promise.all(refreshes);

		return { success: true, deletedCount: ids.length };
	}
);

// Update todo schema - for form submissions, we need to handle the ID transformation and string-to-boolean conversion

const updateTodoFormSchema = v.object({
	organizationSlug: v.pipe(v.string(), v.nonEmpty('Organization slug is required')),
	id: v.pipe(
		v.string(),
		v.transform((val) => parseInt(val, 10)),
		v.number('ID must be a number')
	),
	text: v.optional(v.pipe(v.string(), v.nonEmpty('Task description is required'))),
	completed: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => val === 'true')
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

// Update a single todo
export const updateTodo = form(
	updateTodoFormSchema,
	async ({ organizationSlug, id, ...maybeUpdates }) => {
		const { organizationId } = await getOrganizationContext(organizationSlug);

		const updates = Object.fromEntries(
			Object.entries(maybeUpdates).filter(([, value]) => value !== undefined)
		) as Partial<Pick<Task, 'text' | 'label' | 'status' | 'priority'>> & {
			completed?: boolean;
		};

		if (Object.keys(updates).length === 0) {
			error(400, 'No updates provided');
		}

		const result = await db
			.updateTable('todo')
			.set({
				...updates,
				updated_at: new Date()
			})
			.where('id', '=', id)
			.where('organization_id', '=', organizationId)
			.returningAll()
			.execute();

		if (result.length === 0) {
			return error(404, { message: 'Todo not found' });
		}

		return { success: true };
	}
);
