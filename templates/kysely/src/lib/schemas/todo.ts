import * as v from 'valibot';

export const Task = v.object({
	id: v.number('ID must be a number'),
	text: v.pipe(
		v.string('Task description is required'),
		v.nonEmpty('Please enter a task description')
	),
	completed: v.optional(v.boolean('Task completion status must be true or false'), false),
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
	),
	createdAt: v.date('Created date must be a valid date'),
	updatedAt: v.date('Updated date must be a valid date')
});

export const CreateTask = v.omit(Task, ['id', 'createdAt', 'updatedAt']);

export type Task = v.InferOutput<typeof Task>;
