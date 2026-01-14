import type { FilterConfig } from '@/utils/filter';
import { labels, statuses, priorities } from './components/data';
import {
	CalendarIcon,
	ClockIcon,
	HashIcon,
	TagIcon,
	TextIcon,
	FlagIcon,
	CircleIcon
} from '@lucide/svelte';

export const todoFilterConfig: FilterConfig[] = [
	{
		field: 'text',
		label: 'Title',
		type: 'text',
		icon: TextIcon,
		placeholder: 'Search in titles...',
		description: 'Search in task titles',
		operators: [
			'contains',
			'not_contains',
			'starts_with',
			'ends_with',
			'equals',
			'not_equals',
			'is_empty',
			'is_not_empty'
		],
		defaultOperator: 'contains'
	},
	{
		field: 'status',
		label: 'Status',
		type: 'select',
		icon: CircleIcon,
		description: 'Task status',
		options: statuses.map((status) => ({
			label: status.label,
			value: status.value
		})),
		operators: ['is', 'is_not', 'is_any_of', 'is_none_of'],
		defaultOperator: 'is'
	},
	{
		field: 'priority',
		label: 'Priority',
		type: 'select',
		icon: FlagIcon,
		description: 'Task priority level',
		options: priorities.map((priority) => ({
			label: priority.label,
			value: priority.value
		})),
		operators: ['is', 'is_not', 'is_any_of', 'is_none_of'],
		defaultOperator: 'is'
	},
	{
		field: 'label',
		label: 'Label',
		type: 'select',
		icon: TagIcon,
		description: 'Task category',
		options: labels.map((label) => ({
			label: label.label,
			value: label.value
		})),
		operators: ['is', 'is_not', 'is_any_of', 'is_none_of'],
		defaultOperator: 'is'
	},
	{
		field: 'created_at',
		label: 'Created Date',
		type: 'date',
		icon: CalendarIcon,
		description: 'When the task was created',
		operators: [
			'equals',
			'not_equals',
			'before',
			'after',
			'on_or_before',
			'on_or_after',
			'between',
			'not_between',
			'is_today',
			'is_yesterday',
			'is_this_week',
			'is_this_month',
			'is_this_year',
			'is_last_n_days',
			'is_next_n_days'
		],
		defaultOperator: 'is_today'
	},
	{
		field: 'updated_at',
		label: 'Updated Date',
		type: 'date',
		icon: ClockIcon,
		description: 'When the task was last updated',
		operators: [
			'equals',
			'not_equals',
			'before',
			'after',
			'on_or_before',
			'on_or_after',
			'between',
			'not_between',
			'is_today',
			'is_yesterday',
			'is_this_week',
			'is_this_month',
			'is_this_year',
			'is_last_n_days',
			'is_next_n_days'
		],
		defaultOperator: 'is_today'
	},
	{
		field: 'id',
		label: 'Task ID',
		type: 'number',
		icon: HashIcon,
		description: 'Unique task identifier',
		placeholder: 'Enter task ID...',
		operators: [
			'equals',
			'not_equals',
			'greater_than',
			'less_than',
			'greater_than_or_equal',
			'less_than_or_equal',
			'between',
			'not_between'
		],
		defaultOperator: 'equals',
		min: 1
	}
];
