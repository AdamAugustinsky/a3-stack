import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	todos: defineTable({
		organizationId: v.string(),
		text: v.string(),
		completed: v.boolean(),
		label: v.union(v.literal('bug'), v.literal('feature'), v.literal('documentation')),
		status: v.union(
			v.literal('backlog'),
			v.literal('todo'),
			v.literal('in progress'),
			v.literal('done'),
			v.literal('canceled')
		),
		priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
		createdAt: v.number(),
		updatedAt: v.number()
	}).index('by_organizationId', ['organizationId'])
});
