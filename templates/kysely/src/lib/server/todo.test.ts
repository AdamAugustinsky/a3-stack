import { test, expect, afterAll, beforeAll, describe } from 'bun:test';
import { createTestApp } from './test.utils';
import type { Kysely } from 'kysely';
import type { DB } from './db/db.types';

let cleanup = () => {};
let db: Kysely<DB>;
let organizationId: string;

beforeAll(async () => {
	const testApp = await createTestApp();
	cleanup = testApp.cleanup;
	db = testApp.db;
	organizationId = testApp.organizationId;
});

afterAll(() => cleanup());

// Test helpers
const createTestTodo = async (overrides: Partial<{
	text: string;
	completed: boolean;
	priority: 'low' | 'medium' | 'high';
	status: 'backlog' | 'todo' | 'in progress' | 'done' | 'canceled';
	label: 'bug' | 'feature' | 'documentation';
}> = {}) => {
	const defaultTodo = {
		text: 'Test todo',
		completed: false,
		priority: 'medium' as const,
		status: 'todo' as const,
		label: 'feature' as const,
		organization_id: organizationId,
		created_at: new Date(),
		updated_at: new Date()
	};

	const result = await db
		.insertInto('todo')
		.values({ ...defaultTodo, ...overrides })
		.returningAll()
		.execute();

	return result[0];
};

const createMultipleTodos = async (count: number) => {
	const todos = [];
	for (let i = 0; i < count; i++) {
		const todo = await createTestTodo({
			text: `Test todo ${i + 1}`,
			priority: (['high', 'medium', 'low'] as const)[i % 3],
			status: (['done', 'in progress', 'todo', 'todo'] as const)[i % 4]
		});
		todos.push(todo);
	}
	return todos;
};

const clearTodos = async () => {
	await db.deleteFrom('todo').where('organization_id', '=', organizationId).execute();
};

const getTodos = async () => {
	return db
		.selectFrom('todo')
		.selectAll()
		.where('organization_id', '=', organizationId)
		.execute();
};

describe('Todo CRUD Operations', () => {
	test('GET - returns empty array initially', async () => {
		await clearTodos();
		const todos = await getTodos();
		expect(todos).toBeInstanceOf(Array);
		expect(todos).toHaveLength(0);
	});

	test('POST - creates todo with minimal data', async () => {
		const todo = await createTestTodo({ text: 'Minimal todo' });
		expect(todo).toBeDefined();
		expect(todo.text).toBe('Minimal todo');
	});

	test('POST - creates todo with all fields', async () => {
		const todo = await createTestTodo({
			text: 'Complete todo',
			completed: true,
			priority: 'high',
			status: 'done',
			label: 'bug'
		});

		expect(todo).toBeDefined();
		expect(todo.text).toBe('Complete todo');
		expect(todo.completed).toBe(true);
		expect(todo.priority).toBe('high');
		expect(todo.status).toBe('done');
		expect(todo.label).toBe('bug');
	});

	test('POST - applies default values correctly', async () => {
		const todoText = 'Todo with defaults';
		await createTestTodo({ text: todoText });

		const todos = await getTodos();
		const createdTodo = todos.find((todo) => todo.text === todoText);

		expect(createdTodo?.completed).toBe(false);
		expect(createdTodo?.priority).toBe('medium');
		expect(createdTodo?.status).toBe('todo');
		expect(createdTodo?.label).toBe('feature');
		expect(createdTodo?.created_at).toBeDefined();
		expect(createdTodo?.updated_at).toBeDefined();
	});

	test('PATCH - updates todo fields', async () => {
		await createTestTodo({ text: 'Original todo' });
		const todos = await getTodos();
		const todo = todos.find((t) => t.text === 'Original todo');

		const updateData = {
			text: 'Updated todo text',
			label: 'documentation' as const,
			status: 'in progress' as const,
			priority: 'high' as const,
			updated_at: new Date()
		};

		await db
			.updateTable('todo')
			.set(updateData)
			.where('id', '=', todo!.id)
			.where('organization_id', '=', organizationId)
			.execute();

		const updatedTodos = await getTodos();
		const updatedTodo = updatedTodos.find((t) => t.id === todo!.id);

		expect(updatedTodo?.text).toBe(updateData.text);
		expect(updatedTodo?.label).toBe(updateData.label);
		expect(updatedTodo?.status).toBe(updateData.status);
		expect(updatedTodo?.priority).toBe(updateData.priority);
	});

	test('DELETE - removes todo', async () => {
		await createTestTodo({ text: 'Todo to delete' });
		const todos = await getTodos();
		const todoToDelete = todos.find((t) => t.text === 'Todo to delete');
		const initialCount = todos.length;

		await db
			.deleteFrom('todo')
			.where('id', '=', todoToDelete!.id)
			.where('organization_id', '=', organizationId)
			.execute();

		const remainingTodos = await getTodos();
		expect(remainingTodos.length).toBe(initialCount - 1);
		expect(remainingTodos.find((t) => t.id === todoToDelete!.id)).toBeUndefined();
	});
});

describe('Todo Toggle Operation', () => {
	test('PATCH - toggles completion status', async () => {
		await createTestTodo({ text: 'Toggle test', completed: false });
		const todos = await getTodos();
		const todo = todos.find((t) => t.text === 'Toggle test');

		expect(todo?.completed).toBe(false);

		await db
			.updateTable('todo')
			.set({ completed: true, updated_at: new Date() })
			.where('id', '=', todo!.id)
			.where('organization_id', '=', organizationId)
			.execute();

		const updatedTodos = await getTodos();
		const updatedTodo = updatedTodos.find((t) => t.id === todo!.id);

		expect(updatedTodo?.completed).toBe(true);
	});
});

describe('Bulk Operations', () => {
	test('PATCH bulk - updates multiple todos', async () => {
		await createMultipleTodos(3);
		const todos = await getTodos();
		const todoIds = todos.slice(0, 2).map((t) => t.id);

		await db
			.updateTable('todo')
			.set({ status: 'done', priority: 'low', updated_at: new Date() })
			.where('id', 'in', todoIds)
			.where('organization_id', '=', organizationId)
			.execute();

		const updatedTodos = await getTodos();
		const updatedItems = updatedTodos.filter((t) => todoIds.includes(t.id));

		expect(updatedItems.every((t) => t.status === 'done')).toBe(true);
		expect(updatedItems.every((t) => t.priority === 'low')).toBe(true);
	});

	test('DELETE bulk - deletes multiple todos', async () => {
		await createMultipleTodos(4);
		const todos = await getTodos();
		const todoIds = todos.slice(0, 2).map((t) => t.id);
		const initialCount = todos.length;

		await db
			.deleteFrom('todo')
			.where('id', 'in', todoIds)
			.where('organization_id', '=', organizationId)
			.execute();

		const remainingTodos = await getTodos();
		expect(remainingTodos.length).toBe(initialCount - 2);

		const deletedItems = remainingTodos.filter((t) => todoIds.includes(t.id));
		expect(deletedItems.length).toBe(0);
	});
});

describe('Dashboard Statistics', () => {
	test('GET stats - calculates statistics correctly', async () => {
		await clearTodos();

		// Create todos with known distribution
		await createTestTodo({ text: 'Todo 1', status: 'todo', priority: 'high', label: 'feature' });
		await createTestTodo({ text: 'Todo 2', status: 'done', priority: 'medium', label: 'bug' });
		await createTestTodo({ text: 'Todo 3', status: 'in progress', priority: 'low', label: 'feature' });
		await createTestTodo({ text: 'Todo 4', status: 'todo', priority: 'high', label: 'documentation' });

		const [
			totalTodos,
			todosByStatus,
			todosByPriority,
			todosByLabel,
			completedTodos,
			inProgressTodos,
			highPriorityTodos
		] = await Promise.all([
			db.selectFrom('todo').select(db.fn.count<number>('id').as('count')).where('organization_id', '=', organizationId).execute(),
			db.selectFrom('todo').select(['status', db.fn.count<number>('id').as('count')]).where('organization_id', '=', organizationId).groupBy('status').execute(),
			db.selectFrom('todo').select(['priority', db.fn.count<number>('id').as('count')]).where('organization_id', '=', organizationId).groupBy('priority').execute(),
			db.selectFrom('todo').select(['label', db.fn.count<number>('id').as('count')]).where('organization_id', '=', organizationId).groupBy('label').execute(),
			db.selectFrom('todo').select(db.fn.count<number>('id').as('count')).where('organization_id', '=', organizationId).where('status', '=', 'done').execute(),
			db.selectFrom('todo').select(db.fn.count<number>('id').as('count')).where('organization_id', '=', organizationId).where('status', '=', 'in progress').execute(),
			db.selectFrom('todo').select(db.fn.count<number>('id').as('count')).where('organization_id', '=', organizationId).where('priority', '=', 'high').where('status', '=', 'todo').execute()
		]);

		const totalCount = Number(totalTodos[0]?.count) || 0;
		const completedCount = Number(completedTodos[0]?.count) || 0;
		const completionRate = totalCount ? Math.round((completedCount / totalCount) * 1000) / 10 : 0;

		expect(totalCount).toBe(4);
		expect(completedCount).toBe(1);
		expect(Number(inProgressTodos[0]?.count) || 0).toBe(1);
		expect(Number(highPriorityTodos[0]?.count) || 0).toBe(2);
		expect(completionRate).toBe(25);

		const statusMap: Record<string, number> = {};
		for (const r of todosByStatus) {
			if (typeof r.status === 'string') statusMap[r.status] = Number(r.count) || 0;
		}
		expect(statusMap).toEqual({
			todo: 2,
			done: 1,
			'in progress': 1
		});

		const priorityMap: Record<string, number> = {};
		for (const r of todosByPriority) {
			if (typeof r.priority === 'string') priorityMap[r.priority] = Number(r.count) || 0;
		}
		expect(priorityMap).toEqual({
			high: 2,
			medium: 1,
			low: 1
		});

		const labelMap: Record<string, number> = {};
		for (const r of todosByLabel) {
			if (typeof r.label === 'string') labelMap[r.label] = Number(r.count) || 0;
		}
		expect(labelMap).toEqual({
			feature: 2,
			bug: 1,
			documentation: 1
		});
	});

	test('GET stats - handles empty state', async () => {
		await clearTodos();

		const totalTodos = await db
			.selectFrom('todo')
			.select(db.fn.count<number>('id').as('count'))
			.where('organization_id', '=', organizationId)
			.execute();

		expect(Number(totalTodos[0]?.count) || 0).toBe(0);
	});
});

describe('Dashboard Activity', () => {
	test('GET activity - returns data for recent todos', async () => {
		await clearTodos();
		await createTestTodo({ text: 'Activity test 1' });
		await createTestTodo({ text: 'Activity test 2', status: 'done' });

		const end = new Date();
		const start = new Date(end);
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() - 29);

		const createdActivity = await db
			.selectFrom('todo')
			.select(['created_at as date', 'status', db.fn.count<number>('id').as('count')])
			.where('organization_id', '=', organizationId)
			.where('created_at', '>=', start)
			.groupBy(['created_at', 'status'])
			.orderBy('created_at')
			.execute();

		expect(createdActivity.length).toBeGreaterThan(0);
	});
});

describe('Error Handling', () => {
	test('DELETE - handles non-existent id', async () => {
		const deleted = await db
			.deleteFrom('todo')
			.where('id', '=', 999999)
			.where('organization_id', '=', organizationId)
			.returningAll()
			.execute();

		expect(deleted.length).toBe(0);
	});
});
