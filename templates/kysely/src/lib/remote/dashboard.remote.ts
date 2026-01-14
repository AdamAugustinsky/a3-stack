import { query, getRequestEvent } from '$app/server';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

// Dashboard statistics query
export const getDashboardStats = query(async () => {
	const event = getRequestEvent();
	const organizationSlug = event.params?.organization_slug;
	if (!organizationSlug) {
		error(400, 'Organization slug not found');
	}

	const { organizationId } = await getOrganizationContext(organizationSlug);

	const [
		totalTodos,
		todosByStatus,
		todosByPriority,
		todosByLabel,
		completedTodos,
		inProgressTodos,
		highPriorityTodos
	] = await Promise.all([
		db
			.selectFrom('todo')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.execute(),
		db
			.selectFrom('todo')
			.select(['status', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.groupBy('status')
			.execute(),
		db
			.selectFrom('todo')
			.select(['priority', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.groupBy('priority')
			.execute(),
		db
			.selectFrom('todo')
			.select(['label', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.groupBy('label')
			.execute(),
		db
			.selectFrom('todo')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.where('status', '=', 'done')
			.execute(),
		db
			.selectFrom('todo')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.where('status', '=', 'in progress')
			.execute(),
		db
			.selectFrom('todo')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.where('priority', '=', 'high')
			.where('status', '=', 'todo')
			.execute()
	]);

	const totalCount = Number(totalTodos[0]?.count) || 0;
	const completedCount = Number(completedTodos[0]?.count) || 0;
	const completionRate = totalCount ? Math.round((completedCount / totalCount) * 1000) / 10 : 0;

	function toDict<R extends Record<string, unknown> & { count: number }, K extends keyof R & string>(
		rows: R[],
		key: K
	): Record<string, number> {
		const acc: Record<string, number> = {};
		for (const r of rows) {
			const k = r[key];
			if (typeof k === 'string') acc[k] = Number(r.count) || 0;
		}
		return acc;
	}

	return {
		totalTodos: totalCount,
		completedTodos: completedCount,
		inProgressTodos: Number(inProgressTodos[0]?.count) || 0,
		highPriorityTodos: Number(highPriorityTodos[0]?.count) || 0,
		completionRate,
		todosByStatus: toDict(todosByStatus, 'status'),
		todosByPriority: toDict(todosByPriority, 'priority'),
		todosByLabel: toDict(todosByLabel, 'label')
	};
});

// Recent todos activity (for charts)
export const getRecentActivity = query(async () => {
	const event = getRequestEvent();
	const organizationSlug = event.params?.organization_slug;
	if (!organizationSlug) {
		error(400, 'Organization slug not found');
	}

	const { organizationId } = await getOrganizationContext(organizationSlug);

	// build dense 30-day window
	const end = new Date();
	const start = new Date(end);
	start.setHours(0, 0, 0, 0);
	start.setDate(start.getDate() - 29);
	const keyOf = (d: Date) => d.toISOString().slice(0, 10);
	const dayMap = new Map<
		string,
		{
			date: Date;
			created: number;
			completed: number;
			inProgress: number;
			total: number;
		}
	>();
	for (let i = 0; i < 30; i++) {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		dayMap.set(keyOf(d), {
			date: d,
			created: 0,
			completed: 0,
			inProgress: 0,
			total: 0
		});
	}

	const [createdActivity, updatedActivity] = await Promise.all([
		db
			.selectFrom('todo')
			.select(['created_at as date', 'status', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.where('created_at', '>=', start)
			.groupBy(['created_at', 'status'])
			.orderBy('created_at')
			.execute(),
		db
			.selectFrom('todo')
			.select(['updated_at as date', 'status', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.where('updated_at', '>=', start)
			.groupBy(['updated_at', 'status'])
			.orderBy('updated_at')
			.execute()
	]);

	for (const item of createdActivity) {
		if (!item.date) continue;
		const day = dayMap.get(keyOf(item.date));
		if (!day) continue;
		const n = Number(item.count) || 0;
		day.created += n;
		day.total += n;
	}

	for (const item of updatedActivity) {
		if (!item.date) continue;
		const day = dayMap.get(keyOf(item.date));
		if (!day) continue;
		const n = Number(item.count) || 0;
		if (item.status === 'done') day.completed += n;
		else if (item.status === 'in progress') day.inProgress += n;
	}

	return Array.from(dayMap.values());
});
