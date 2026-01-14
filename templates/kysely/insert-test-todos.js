import { createDb } from './src/lib/server/db/index.ts';

const db = createDb();

async function insertTestTodos() {
	console.log('Inserting test todos...');

	const testTodos = [
		{
			text: 'Fix authentication bug in login page',
			status: 'in progress',
			priority: 'high',
			label: 'bug',
			completed: false,
			organization_id: 1, // Assuming organization ID 1 exists
			created_at: new Date(),
			updated_at: new Date()
		},
		{
			text: 'Add new feature for user dashboard',
			status: 'todo',
			priority: 'medium',
			label: 'feature',
			completed: false,
			organization_id: 1,
			created_at: new Date(),
			updated_at: new Date()
		},
		{
			text: 'Update documentation for API endpoints',
			status: 'done',
			priority: 'low',
			label: 'documentation',
			completed: true,
			organization_id: 1,
			created_at: new Date(),
			updated_at: new Date()
		},
		{
			text: 'Implement password reset functionality',
			status: 'backlog',
			priority: 'medium',
			label: 'feature',
			completed: false,
			organization_id: 1,
			created_at: new Date(),
			updated_at: new Date()
		},
		{
			text: 'Fix mobile responsive issues',
			status: 'todo',
			priority: 'high',
			label: 'bug',
			completed: false,
			organization_id: 1,
			created_at: new Date(),
			updated_at: new Date()
		}
	];

	try {
		for (const todo of testTodos) {
			await db.insertInto('todo').values(todo).execute();
			console.log(`Inserted: ${todo.text}`);
		}
		console.log('All test todos inserted successfully!');
	} catch (error) {
		console.error('Error inserting todos:', error);
	} finally {
		await db.destroy();
	}
}

insertTestTodos();
