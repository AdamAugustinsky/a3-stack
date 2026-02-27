import type { Doc, Id } from '$convex/dataModel';
import { Task as TaskSchema, type Task } from '$lib/schemas/todo';
import * as v from 'valibot';

type TodoDoc = Doc<'todos'>;

export function toTodoId(value: string): Id<'todos'> {
	return value as Id<'todos'>;
}

export function toTodoIds(values: string[]): Id<'todos'>[] {
	return values.map(toTodoId);
}

export function toTask(input: TodoDoc): Task {
	return v.parse(TaskSchema, {
		docId: input._id,
		id: input._creationTime,
		text: input.text,
		completed: input.completed,
		priority: input.priority,
		status: input.status,
		label: input.label,
		createdAt: new Date(input.createdAt),
		updatedAt: new Date(input.updatedAt)
	});
}

export function toTasks(rows: TodoDoc[] | undefined): Task[] {
	if (!rows) {
		return [];
	}

	return rows.map((row) => toTask(row));
}

function toDayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export type DashboardStats = {
	totalTodos: number;
	completedTodos: number;
	inProgressTodos: number;
	highPriorityTodos: number;
	completionRate: number;
	todosByStatus: Record<string, number>;
	todosByPriority: Record<string, number>;
	todosByLabel: Record<string, number>;
};

function summarizeBy<K extends keyof TodoDoc>(rows: TodoDoc[], key: K): Record<string, number> {
	const result: Record<string, number> = {};
	for (const row of rows) {
		const value = row[key];
		const bucket = String(value);
		result[bucket] = (result[bucket] ?? 0) + 1;
	}
	return result;
}

export function computeDashboardStats(rows: TodoDoc[] | undefined): DashboardStats {
	const list = rows ?? [];
	const totalTodos = list.length;
	const completedTodos = list.filter((todo) => todo.status === 'done').length;
	const inProgressTodos = list.filter((todo) => todo.status === 'in progress').length;
	const highPriorityTodos = list.filter(
		(todo) => todo.priority === 'high' && todo.status === 'todo'
	).length;
	const completionRate = totalTodos ? Math.round((completedTodos / totalTodos) * 1000) / 10 : 0;

	return {
		totalTodos,
		completedTodos,
		inProgressTodos,
		highPriorityTodos,
		completionRate,
		todosByStatus: summarizeBy(list, 'status'),
		todosByPriority: summarizeBy(list, 'priority'),
		todosByLabel: summarizeBy(list, 'label')
	};
}

export type RecentActivityPoint = {
	date: Date;
	created: number;
	completed: number;
	inProgress: number;
	total: number;
};

export function computeRecentActivity(rows: TodoDoc[] | undefined): RecentActivityPoint[] {
	const list = rows ?? [];
	const end = new Date();
	const start = new Date(end);
	start.setHours(0, 0, 0, 0);
	start.setDate(start.getDate() - 29);

	const dayMap = new Map<string, RecentActivityPoint>();

	for (let i = 0; i < 30; i++) {
		const date = new Date(start);
		date.setDate(start.getDate() + i);
		dayMap.set(toDayKey(date), {
			date,
			created: 0,
			completed: 0,
			inProgress: 0,
			total: 0
		});
	}

	for (const todo of list) {
		const createdDate = new Date(todo.createdAt);
		const createdDay = dayMap.get(toDayKey(createdDate));
		if (createdDay) {
			createdDay.created += 1;
			createdDay.total += 1;
		}

		const updatedDate = new Date(todo.updatedAt);
		const updatedDay = dayMap.get(toDayKey(updatedDate));
		if (updatedDay) {
			if (todo.status === 'done') {
				updatedDay.completed += 1;
			} else if (todo.status === 'in progress') {
				updatedDay.inProgress += 1;
			}
		}
	}

	return Array.from(dayMap.values());
}
