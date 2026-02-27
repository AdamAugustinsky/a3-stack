import { v } from 'convex/values';
import type { GenericCtx } from '@convex-dev/better-auth';
import { mutation, query } from './_generated/server';
import { authComponent, createAuth } from './auth';
import type { DataModel, Id } from './_generated/dataModel';

const todoLabel = v.union(v.literal('bug'), v.literal('feature'), v.literal('documentation'));
const todoStatus = v.union(
	v.literal('backlog'),
	v.literal('todo'),
	v.literal('in progress'),
	v.literal('done'),
	v.literal('canceled')
);
const todoPriority = v.union(v.literal('low'), v.literal('medium'), v.literal('high'));
type DbCtx = Extract<GenericCtx<DataModel>, { db: unknown }>;
type TodoDoc = DataModel['todos']['document'];

type ParsedFilter = {
	field: string;
	operator: string;
	value: unknown;
	type?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFilters(serializedFilters: string | undefined): ParsedFilter[] {
	if (!serializedFilters) {
		return [];
	}

	try {
		const parsed = JSON.parse(serializedFilters);
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.filter(isRecord)
			.map((entry) => {
				const rawField = entry.field;
				const rawOperator = entry.operator;
				return {
					field: typeof rawField === 'string' ? rawField : '',
					operator: typeof rawOperator === 'string' ? rawOperator : '',
					value: entry.value,
					type: typeof entry.type === 'string' ? entry.type : undefined
				};
			})
			.filter((filter) => filter.field.length > 0 && filter.operator.length > 0);
	} catch {
		return [];
	}
}

function normalizeFilterField(field: string): string | null {
	const normalizedField = field === 'created_at' ? 'createdAt' : field === 'updated_at' ? 'updatedAt' : field;
	if (
		normalizedField === 'docId' ||
		normalizedField === 'id' ||
		normalizedField === 'text' ||
		normalizedField === 'completed' ||
		normalizedField === 'priority' ||
		normalizedField === 'status' ||
		normalizedField === 'label' ||
		normalizedField === 'createdAt' ||
		normalizedField === 'updatedAt'
	) {
		return normalizedField;
	}

	return null;
}

function getFilterValue(todo: TodoDoc, field: string): unknown {
	switch (field) {
		case 'docId':
			return todo._id;
		case 'id':
			return todo._creationTime;
		case 'text':
			return todo.text;
		case 'completed':
			return todo.completed;
		case 'priority':
			return todo.priority;
		case 'status':
			return todo.status;
		case 'label':
			return todo.label;
		case 'createdAt':
			return todo.createdAt;
		case 'updatedAt':
			return todo.updatedAt;
		default:
			return null;
	}
}

function isEmptyValue(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === 'string') return value.trim() === '';
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

function toDate(value: unknown): Date | null {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value !== 'string' && typeof value !== 'number') return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function parseRange(value: unknown): [unknown, unknown] | null {
	if (!Array.isArray(value) || value.length !== 2) return null;
	return [value[0], value[1]];
}

function startOfDay(date: Date): Date {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function endOfDay(date: Date): Date {
	const copy = new Date(date);
	copy.setHours(23, 59, 59, 999);
	return copy;
}

function sameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function matchesFilter(todo: TodoDoc, filter: ParsedFilter): boolean {
	const field = normalizeFilterField(filter.field);
	if (!field) {
		return true;
	}

	const fieldValue = getFilterValue(todo, field);
	const filterValue = filter.value;
	const isDateFilter = filter.type === 'date' || field === 'createdAt' || field === 'updatedAt';

	switch (filter.operator) {
		case 'equals': {
			if (isDateFilter) {
				const left = toDate(fieldValue);
				const right = toDate(filterValue);
				return !!left && !!right && sameDay(left, right);
			}
			return String(fieldValue) === String(filterValue);
		}
		case 'not_equals': {
			if (isDateFilter) {
				const left = toDate(fieldValue);
				const right = toDate(filterValue);
				return !!left && !!right ? !sameDay(left, right) : true;
			}
			return String(fieldValue) !== String(filterValue);
		}
		case 'is':
			return String(fieldValue) === String(filterValue);
		case 'is_not':
			return String(fieldValue) !== String(filterValue);
		case 'is_any_of': {
			if (!Array.isArray(filterValue)) return false;
			return filterValue.map((value) => String(value)).includes(String(fieldValue));
		}
		case 'is_none_of': {
			if (!Array.isArray(filterValue)) return false;
			return !filterValue.map((value) => String(value)).includes(String(fieldValue));
		}
		case 'contains':
			return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
		case 'not_contains':
			return !String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
		case 'starts_with':
			return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
		case 'ends_with':
			return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
		case 'is_empty':
			return isEmptyValue(fieldValue);
		case 'is_not_empty':
			return !isEmptyValue(fieldValue);
		case 'exists':
			return fieldValue !== null && fieldValue !== undefined;
		case 'not_exists':
			return fieldValue === null || fieldValue === undefined;
		case 'greater_than': {
			const left = toNumber(fieldValue);
			const right = toNumber(filterValue);
			return left !== null && right !== null && left > right;
		}
		case 'less_than': {
			const left = toNumber(fieldValue);
			const right = toNumber(filterValue);
			return left !== null && right !== null && left < right;
		}
		case 'greater_than_or_equal': {
			const left = toNumber(fieldValue);
			const right = toNumber(filterValue);
			return left !== null && right !== null && left >= right;
		}
		case 'less_than_or_equal': {
			const left = toNumber(fieldValue);
			const right = toNumber(filterValue);
			return left !== null && right !== null && left <= right;
		}
		case 'between': {
			const range = parseRange(filterValue);
			if (!range) return false;

			if (isDateFilter) {
				const left = toDate(fieldValue);
				const start = toDate(range[0]);
				const end = toDate(range[1]);
				if (!left || !start || !end) return false;
				return left >= startOfDay(start) && left <= endOfDay(end);
			}

			const left = toNumber(fieldValue);
			const start = toNumber(range[0]);
			const end = toNumber(range[1]);
			return left !== null && start !== null && end !== null && left >= start && left <= end;
		}
		case 'not_between': {
			const range = parseRange(filterValue);
			if (!range) return false;

			if (isDateFilter) {
				const left = toDate(fieldValue);
				const start = toDate(range[0]);
				const end = toDate(range[1]);
				if (!left || !start || !end) return false;
				return left < startOfDay(start) || left > endOfDay(end);
			}

			const left = toNumber(fieldValue);
			const start = toNumber(range[0]);
			const end = toNumber(range[1]);
			return left !== null && start !== null && end !== null && (left < start || left > end);
		}
		case 'before': {
			const left = toDate(fieldValue);
			const right = toDate(filterValue);
			return !!left && !!right && left < startOfDay(right);
		}
		case 'after': {
			const left = toDate(fieldValue);
			const right = toDate(filterValue);
			return !!left && !!right && left > endOfDay(right);
		}
		case 'on_or_before': {
			const left = toDate(fieldValue);
			const right = toDate(filterValue);
			return !!left && !!right && left <= endOfDay(right);
		}
		case 'on_or_after': {
			const left = toDate(fieldValue);
			const right = toDate(filterValue);
			return !!left && !!right && left >= startOfDay(right);
		}
		case 'is_today': {
			const left = toDate(fieldValue);
			return !!left && sameDay(left, new Date());
		}
		case 'is_yesterday': {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const left = toDate(fieldValue);
			return !!left && sameDay(left, yesterday);
		}
		case 'is_this_week': {
			const left = toDate(fieldValue);
			if (!left) return false;

			const now = new Date();
			const weekStart = startOfDay(new Date(now));
			weekStart.setDate(now.getDate() - now.getDay());
			const weekEnd = endOfDay(new Date(weekStart));
			weekEnd.setDate(weekStart.getDate() + 6);
			return left >= weekStart && left <= weekEnd;
		}
		case 'is_this_month': {
			const left = toDate(fieldValue);
			if (!left) return false;
			const now = new Date();
			return left.getFullYear() === now.getFullYear() && left.getMonth() === now.getMonth();
		}
		case 'is_this_year': {
			const left = toDate(fieldValue);
			return !!left && left.getFullYear() === new Date().getFullYear();
		}
		case 'is_last_n_days': {
			const left = toDate(fieldValue);
			const days = toNumber(filterValue);
			if (!left || days === null) return false;
			const now = new Date();
			const floor = startOfDay(new Date(now));
			floor.setDate(floor.getDate() - days);
			return left >= floor && left <= now;
		}
		case 'is_next_n_days': {
			const left = toDate(fieldValue);
			const days = toNumber(filterValue);
			if (!left || days === null) return false;
			const now = new Date();
			const ceiling = endOfDay(new Date(now));
			ceiling.setDate(ceiling.getDate() + days);
			return left >= now && left <= ceiling;
		}
		case 'is_true':
			return fieldValue === true;
		case 'is_false':
			return fieldValue === false;
		default:
			return false;
	}
}

function applyFilters(todos: TodoDoc[], filters: ParsedFilter[]): TodoDoc[] {
	if (filters.length === 0) {
		return todos;
	}

	return todos.filter((todo) => filters.every((filter) => matchesFilter(todo, filter)));
}

async function getAuthUser(ctx: GenericCtx<DataModel>) {
	try {
		return await authComponent.getAuthUser(ctx);
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthenticated') {
			return null;
		}
		throw new Error('Failed to resolve authenticated user', { cause: error });
	}
}

async function requireOrganization(ctx: GenericCtx<DataModel>, organizationSlug: string) {
	const user = await getAuthUser(ctx);
	if (!user) {
		return null;
	}

	const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
	const organization = await auth.api.getFullOrganization({
		headers,
		query: { organizationSlug }
	});

	if (!organization) {
		throw new Error('Organization not found or access denied');
	}

	return organization;
}

async function requireOrganizationOrThrow(
	ctx: GenericCtx<DataModel>,
	organizationSlug: string
) {
	const organization = await requireOrganization(ctx, organizationSlug);
	if (!organization) {
		throw new Error('Unauthorized');
	}
	return organization;
}

async function getTodoForOrganization(
	ctx: DbCtx,
	organizationId: string,
	todoId: Id<'todos'>
) {
	const todo = await ctx.db.get(todoId);
	if (!todo || todo.organizationId !== organizationId) {
		return null;
	}
	return todo;
}

export const listTodos = query({
	args: {
		organizationSlug: v.string(),
		filters: v.optional(v.string())
	},
	handler: async (ctx, { organizationSlug, filters }) => {
		const organization = await requireOrganization(ctx, organizationSlug);
		if (!organization) {
			return [];
		}

		const todos = await ctx.db
			.query('todos')
			.withIndex('by_organizationId', (q) => q.eq('organizationId', organization.id))
			.collect();

		return applyFilters(todos, parseFilters(filters));
	}
});

export const createTodo = mutation({
	args: {
		organizationSlug: v.string(),
		text: v.string(),
		completed: v.boolean(),
		label: todoLabel,
		status: todoStatus,
		priority: todoPriority
	},
	handler: async (ctx, args) => {
		const organization = await requireOrganizationOrThrow(ctx, args.organizationSlug);

		const now = Date.now();
		const todoId = await ctx.db.insert('todos', {
			organizationId: organization.id,
			text: args.text,
			completed: args.completed,
			label: args.label,
			status: args.status,
			priority: args.priority,
			createdAt: now,
			updatedAt: now
		});

		return { todoId };
	}
});

export const updateTodo = mutation({
	args: {
		organizationSlug: v.string(),
		todoId: v.id('todos'),
		text: v.optional(v.string()),
		completed: v.optional(v.boolean()),
		label: v.optional(todoLabel),
		status: v.optional(todoStatus),
		priority: v.optional(todoPriority)
	},
	handler: async (ctx, args) => {
		const organization = await requireOrganizationOrThrow(ctx, args.organizationSlug);

		const existing = await getTodoForOrganization(ctx, organization.id, args.todoId);

		if (!existing) {
			return { found: false };
		}

		await ctx.db.patch(existing._id, {
			text: args.text ?? existing.text,
			completed: args.completed ?? existing.completed,
			label: args.label ?? existing.label,
			status: args.status ?? existing.status,
			priority: args.priority ?? existing.priority,
			updatedAt: Date.now()
		});

		return { found: true };
	}
});

export const deleteTodo = mutation({
	args: {
		organizationSlug: v.string(),
		todoId: v.id('todos')
	},
	handler: async (ctx, { organizationSlug, todoId }) => {
		const organization = await requireOrganizationOrThrow(ctx, organizationSlug);

		const existing = await getTodoForOrganization(ctx, organization.id, todoId);

		if (!existing) {
			return { deleted: false };
		}

		await ctx.db.delete(existing._id);
		return { deleted: true };
	}
});

export const bulkUpdateTodos = mutation({
	args: {
		organizationSlug: v.string(),
		todoIds: v.array(v.id('todos')),
		updates: v.object({
			completed: v.optional(v.boolean()),
			label: v.optional(todoLabel),
			status: v.optional(todoStatus),
			priority: v.optional(todoPriority)
		})
	},
	handler: async (ctx, { organizationSlug, todoIds, updates }) => {
		const organization = await requireOrganizationOrThrow(ctx, organizationSlug);

		let updatedCount = 0;

		for (const todoId of todoIds) {
			const existing = await getTodoForOrganization(ctx, organization.id, todoId);
			if (!existing) {
				continue;
			}
			await ctx.db.patch(existing._id, {
				...updates,
				updatedAt: Date.now()
			});
			updatedCount += 1;
		}
		return { updatedCount };
	}
});

export const bulkDeleteTodos = mutation({
	args: {
		organizationSlug: v.string(),
		todoIds: v.array(v.id('todos'))
	},
	handler: async (ctx, { organizationSlug, todoIds }) => {
		const organization = await requireOrganizationOrThrow(ctx, organizationSlug);

		let deletedCount = 0;
		for (const todoId of todoIds) {
			const existing = await getTodoForOrganization(ctx, organization.id, todoId);
			if (!existing) {
				continue;
			}
			await ctx.db.delete(existing._id);
			deletedCount += 1;
		}
		return { deletedCount };
	}
});
