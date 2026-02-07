import { getRequestEvent, query } from '$app/server';
import { getOrganizationContext } from '$lib/server/auth-helpers';
import { db } from '$lib/server/db';
import { requireValue, runServerEffect, tryPromise } from '$lib/server/effect';
import { Effect } from 'effect';

function toDict<R extends Record<string, unknown> & { count: number }, K extends keyof R & string>(
	rows: R[],
	key: K
): Record<string, number> {
	const acc: Record<string, number> = {};
	for (const row of rows) {
		const value = row[key];
		if (typeof value === 'string') {
			acc[value] = Number(row.count) || 0;
		}
	}
	return acc;
}

// Dashboard statistics query
export const getDashboardStats = query(() =>
	runServerEffect(
		Effect.gen(function* () {
			const organizationSlug = yield* requireValue(
				getRequestEvent().params?.organization_slug,
				400,
				'Organization slug not found'
			);

			const { organizationId } = yield* tryPromise(() => getOrganizationContext(organizationSlug), {
				message: 'Failed to resolve organization context'
			});

			const [
				totalTodos,
				todosByStatus,
				todosByPriority,
				todosByLabel,
				completedTodos,
				inProgressTodos,
				highPriorityTodos
			] = yield* tryPromise(
				() =>
					Promise.all([
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
					]),
				{
					message: 'Failed to load dashboard statistics'
				}
			);

			const totalCount = Number(totalTodos[0]?.count) || 0;
			const completedCount = Number(completedTodos[0]?.count) || 0;
			const completionRate = totalCount ? Math.round((completedCount / totalCount) * 1000) / 10 : 0;

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
		})
	)
);

// Recent todos activity (for charts)
export const getRecentActivity = query(() =>
	runServerEffect(
		Effect.gen(function* () {
			const organizationSlug = yield* requireValue(
				getRequestEvent().params?.organization_slug,
				400,
				'Organization slug not found'
			);

			const { organizationId } = yield* tryPromise(() => getOrganizationContext(organizationSlug), {
				message: 'Failed to resolve organization context'
			});

			const end = new Date();
			const start = new Date(end);
			start.setHours(0, 0, 0, 0);
			start.setDate(start.getDate() - 29);

			const keyOf = (date: Date) => date.toISOString().slice(0, 10);

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
				const date = new Date(start);
				date.setDate(start.getDate() + i);
				dayMap.set(keyOf(date), {
					date,
					created: 0,
					completed: 0,
					inProgress: 0,
					total: 0
				});
			}

			const [createdActivity, updatedActivity] = yield* tryPromise(
				() =>
					Promise.all([
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
					]),
				{
					message: 'Failed to load recent activity'
				}
			);

			for (const item of createdActivity) {
				if (!item.date) continue;
				const day = dayMap.get(keyOf(item.date));
				if (!day) continue;
				const count = Number(item.count) || 0;
				day.created += count;
				day.total += count;
			}

			for (const item of updatedActivity) {
				if (!item.date) continue;
				const day = dayMap.get(keyOf(item.date));
				if (!day) continue;
				const count = Number(item.count) || 0;
				if (item.status === 'done') day.completed += count;
				else if (item.status === 'in progress') day.inProgress += count;
			}

			return Array.from(dayMap.values());
		})
	)
);
