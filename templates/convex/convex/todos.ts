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

async function requireOrganization(ctx: GenericCtx<DataModel>, organizationSlug: string) {
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
		organizationSlug: v.string()
	},
	handler: async (ctx, { organizationSlug }) => {
		const organization = await requireOrganization(ctx, organizationSlug);
		return await ctx.db
			.query('todos')
			.withIndex('by_organizationId', (q) => q.eq('organizationId', organization.id))
			.collect();
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
		const organization = await requireOrganization(ctx, args.organizationSlug);
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
		const organization = await requireOrganization(ctx, args.organizationSlug);
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
		const organization = await requireOrganization(ctx, organizationSlug);
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
		const organization = await requireOrganization(ctx, organizationSlug);
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
		const organization = await requireOrganization(ctx, organizationSlug);
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
