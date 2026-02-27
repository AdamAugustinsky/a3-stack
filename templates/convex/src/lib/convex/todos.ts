import type { Doc, Id } from '$convex/dataModel';
import { Task as TaskSchema, type Task } from '$lib/schemas/todo';
import type { Filter } from '$lib/utils/filter';
import * as v from 'valibot';

type TodoDoc = Doc<'todos'>;

const filterFieldAliases = {
	created_at: 'createdAt',
	updated_at: 'updatedAt'
} as const;

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

function resolveField(field: string): keyof Task | null {
	const canonicalField = (filterFieldAliases[field as keyof typeof filterFieldAliases] ??
		field) as string;
	if (
		canonicalField === 'docId' ||
		canonicalField === 'id' ||
		canonicalField === 'text' ||
		canonicalField === 'completed' ||
		canonicalField === 'priority' ||
		canonicalField === 'status' ||
		canonicalField === 'label' ||
		canonicalField === 'createdAt' ||
		canonicalField === 'updatedAt'
	) {
		return canonicalField;
	}
	return null;
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

function sameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
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

function parseRange(value: unknown): [unknown, unknown] | null {
	if (!Array.isArray(value) || value.length !== 2) return null;
	return [value[0], value[1]];
}

function matchesFilter(task: Task, filter: Filter): boolean {
	const resolvedField = resolveField(filter.field);
	if (!resolvedField) return true;

	const fieldValue = task[resolvedField] as unknown;
	const filterValue = filter.value;

	switch (filter.operator) {
		case 'equals': {
			if (fieldValue instanceof Date || filter.type === 'date') {
				const left = toDate(fieldValue);
				const right = toDate(filterValue);
				return !!left && !!right && sameDay(left, right);
			}
			return String(fieldValue) === String(filterValue);
		}
		case 'not_equals': {
			if (fieldValue instanceof Date || filter.type === 'date') {
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

			if (fieldValue instanceof Date || filter.type === 'date') {
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

			if (fieldValue instanceof Date || filter.type === 'date') {
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

export function applyTaskFilters(tasks: Task[], filters: Filter[]): Task[] {
	return tasks.filter((task) => filters.every((filter) => matchesFilter(task, filter)));
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
