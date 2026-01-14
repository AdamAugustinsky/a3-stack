import type { SelectQueryBuilder, ReferenceExpression } from 'kysely';
import { sql } from 'kysely';
import type { Filter } from '@/utils/filter';
import { isUtmField, extractUtmFieldName } from '@/utils/filter';

export function applyFilter<DB, TB extends keyof DB, O>(
	query: SelectQueryBuilder<DB, TB, O>,
	filter: Filter
): SelectQueryBuilder<DB, TB, O> {
	const { field, operator, value, type } = filter;

	// Handle UTM fields with JSON operations
	if (isUtmField(field)) {
		return applyUtmFilter(query, filter);
	}

	const dbField = field as ReferenceExpression<DB, TB>;

	switch (type) {
		case 'text':
			switch (operator) {
				case 'equals':
					return query.where(dbField, '=', value as string);
				case 'not_equals':
					return query.where(dbField, '!=', value as string);
				case 'contains':
					return query.where(dbField, 'ilike', `%${value}%`);
				case 'not_contains':
					return query.where(dbField, 'not ilike', `%${value}%`);
				case 'starts_with':
					return query.where(dbField, 'ilike', `${value}%`);
				case 'ends_with':
					return query.where(dbField, 'ilike', `%${value}`);
				case 'is_empty':
					return query.where((eb) => eb.or([eb(dbField, 'is', null), eb(dbField, '=', '')]));
				case 'is_not_empty':
					return query.where((eb) => eb.and([eb(dbField, 'is not', null), eb(dbField, '!=', '')]));
				default:
					return query;
			}

		case 'number':
			switch (operator) {
				case 'equals':
					return query.where(dbField, '=', value as number);
				case 'not_equals':
					return query.where(dbField, '!=', value as number);
				case 'greater_than':
					return query.where(dbField, '>', value as number);
				case 'less_than':
					return query.where(dbField, '<', value as number);
				case 'greater_than_or_equal':
					return query.where(dbField, '>=', value as number);
				case 'less_than_or_equal':
					return query.where(dbField, '<=', value as number);
				case 'between': {
					const [min, max] = value as [number, number];
					return query.where(dbField, '>=', min).where(dbField, '<=', max);
				}
				case 'not_between': {
					const [notMin, notMax] = value as [number, number];
					return query.where((eb) => eb.or([eb(dbField, '<', notMin), eb(dbField, '>', notMax)]));
				}
				default:
					return query;
			}

		case 'date':
			switch (operator) {
				case 'equals': {
					const dateValue = new Date(value as string);
					const nextDay = new Date(dateValue);
					nextDay.setDate(nextDay.getDate() + 1);
					return query.where(dbField, '>=', dateValue).where(dbField, '<', nextDay);
				}

				case 'not_equals': {
					const notDateValue = new Date(value as string);
					const notNextDay = new Date(notDateValue);
					notNextDay.setDate(notNextDay.getDate() + 1);
					return query.where((eb) =>
						eb.or([eb(dbField, '<', notDateValue), eb(dbField, '>=', notNextDay)])
					);
				}

				case 'before':
					return query.where(dbField, '<', new Date(value as string));

				case 'after':
					return query.where(dbField, '>', new Date(value as string));

				case 'on_or_before': {
					const onOrBefore = new Date(value as string);
					onOrBefore.setDate(onOrBefore.getDate() + 1);
					return query.where(dbField, '<', onOrBefore);
				}

				case 'on_or_after':
					return query.where(dbField, '>=', new Date(value as string));

				case 'between': {
					const [startDate, endDate] = value as [string, string];
					const endDateExclusive = new Date(endDate);
					endDateExclusive.setDate(endDateExclusive.getDate() + 1);
					return query
						.where(dbField, '>=', new Date(startDate))
						.where(dbField, '<', endDateExclusive);
				}

				case 'not_between': {
					const [notStartDate, notEndDate] = value as [string, string];
					const notEndDateExclusive = new Date(notEndDate);
					notEndDateExclusive.setDate(notEndDateExclusive.getDate() + 1);
					return query.where((eb) =>
						eb.or([
							eb(dbField, '<', new Date(notStartDate)),
							eb(dbField, '>=', notEndDateExclusive)
						])
					);
				}

				case 'is_today': {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const tomorrow = new Date(today);
					tomorrow.setDate(tomorrow.getDate() + 1);
					return query.where(dbField, '>=', today).where(dbField, '<', tomorrow);
				}

				case 'is_yesterday': {
					const yesterday = new Date();
					yesterday.setDate(yesterday.getDate() - 1);
					yesterday.setHours(0, 0, 0, 0);
					const todayStart = new Date();
					todayStart.setHours(0, 0, 0, 0);
					return query.where(dbField, '>=', yesterday).where(dbField, '<', todayStart);
				}

				case 'is_this_week': {
					const now = new Date();
					const dayOfWeek = now.getDay();
					const weekStart = new Date(now);
					weekStart.setDate(now.getDate() - dayOfWeek);
					weekStart.setHours(0, 0, 0, 0);
					const weekEnd = new Date(weekStart);
					weekEnd.setDate(weekStart.getDate() + 7);
					return query.where(dbField, '>=', weekStart).where(dbField, '<', weekEnd);
				}

				case 'is_this_month': {
					const monthNow = new Date();
					const monthStart = new Date(monthNow.getFullYear(), monthNow.getMonth(), 1);
					const monthEnd = new Date(monthNow.getFullYear(), monthNow.getMonth() + 1, 1);
					return query.where(dbField, '>=', monthStart).where(dbField, '<', monthEnd);
				}

				case 'is_this_year': {
					const yearNow = new Date();
					const yearStart = new Date(yearNow.getFullYear(), 0, 1);
					const yearEnd = new Date(yearNow.getFullYear() + 1, 0, 1);
					return query.where(dbField, '>=', yearStart).where(dbField, '<', yearEnd);
				}

				case 'is_last_n_days': {
					const daysAgo = value as number;
					const startOfDaysAgo = new Date();
					startOfDaysAgo.setDate(startOfDaysAgo.getDate() - daysAgo);
					startOfDaysAgo.setHours(0, 0, 0, 0);
					return query.where(dbField, '>=', startOfDaysAgo);
				}

				case 'is_next_n_days': {
					const daysAhead = value as number;
					const endOfDaysAhead = new Date();
					endOfDaysAhead.setDate(endOfDaysAhead.getDate() + daysAhead);
					endOfDaysAhead.setHours(23, 59, 59, 999);
					return query.where(dbField, '<=', endOfDaysAhead).where(dbField, '>=', new Date());
				}

				default:
					return query;
			}

		case 'select':
			switch (operator) {
				case 'is':
					return query.where(dbField, '=', value as string);
				case 'is_not':
					return query.where(dbField, '!=', value as string);
				case 'is_empty':
					return query.where(dbField, 'is', null);
				case 'is_not_empty':
					return query.where(dbField, 'is not', null);
				default:
					return query;
			}

		case 'multiselect':
			switch (operator) {
				case 'is_any_of':
					return query.where(dbField, 'in', value as string[]);
				case 'is_none_of':
					return query.where(dbField, 'not in', value as string[]);
				case 'is_empty':
					return query.where(dbField, 'is', null);
				case 'is_not_empty':
					return query.where(dbField, 'is not', null);
				default:
					return query;
			}

		case 'boolean':
			switch (operator) {
				case 'is_true':
					return query.where(dbField, '=', true);
				case 'is_false':
					return query.where(dbField, '=', false);
				default:
					return query;
			}

		default:
			return query;
	}
}

// Apply UTM filters using JSON operations
function applyUtmFilter<DB, TB extends keyof DB, O>(
	query: SelectQueryBuilder<DB, TB, O>,
	filter: Filter
): SelectQueryBuilder<DB, TB, O> {
	const { field, operator, value } = filter;
	const utmFieldName = extractUtmFieldName(field);

	switch (operator) {
		case 'exists':
			return query.where(sql<boolean>`tracking->'utms' ? ${utmFieldName}`, '=', true);

		case 'not_exists':
			return query.where(sql<boolean>`NOT (tracking->'utms' ? ${utmFieldName})`, '=', true);

		case 'equals':
			return query.where(sql<string>`tracking->'utms'->>${utmFieldName}`, '=', value as string);

		case 'not_equals':
			return query.where(sql<string>`tracking->'utms'->>${utmFieldName}`, '!=', value as string);

		case 'contains':
			return query.where(sql<string>`tracking->'utms'->>${utmFieldName}`, 'ilike', `%${value}%`);

		case 'not_contains':
			return query.where(
				sql<string>`tracking->'utms'->>${utmFieldName}`,
				'not ilike',
				`%${value}%`
			);

		case 'starts_with':
			return query.where(sql<string>`tracking->'utms'->>${utmFieldName}`, 'ilike', `${value}%`);

		case 'ends_with':
			return query.where(sql<string>`tracking->'utms'->>${utmFieldName}`, 'ilike', `%${value}`);

		case 'is_empty':
			return query.where((eb) =>
				eb.or([
					eb(sql<boolean>`NOT (tracking->'utms' ? ${utmFieldName})`, '=', true),
					eb(sql<string>`tracking->'utms'->>${utmFieldName}`, '=', ''),
					eb(sql<string>`tracking->'utms'->>${utmFieldName}`, 'is', null)
				])
			);

		case 'is_not_empty':
			return query.where((eb) =>
				eb.and([
					eb(sql<boolean>`tracking->'utms' ? ${utmFieldName}`, '=', true),
					eb(sql<string>`tracking->'utms'->>${utmFieldName}`, '!=', ''),
					eb(sql<string>`tracking->'utms'->>${utmFieldName}`, 'is not', null)
				])
			);

		default:
			return query;
	}
}

// Apply multiple filters with AND logic
export function applyFilters<DB, TB extends keyof DB, O>(
	query: SelectQueryBuilder<DB, TB, O>,
	filters: Filter[]
): SelectQueryBuilder<DB, TB, O> {
	let result = query;
	for (const filter of filters) {
		result = applyFilter(result, filter);
	}
	return result;
}

// Apply filter groups with AND/OR logic
// export function applyFilterGroups<DB, TB extends keyof DB, O>(
// 	query: SelectQueryBuilder<DB, TB, O>,
// 	groups: FilterGroup[]
// ): SelectQueryBuilder<DB, TB, O> {
// 	if (groups.length === 0) return query;

// 	return query.where((eb) => {
// 		const expr = eb.and([]);

// 		for (const group of groups) {
// 			if (group.filters.length === 0) continue;

// 			// Note: This is a simplified implementation due to complex Kysely typing
// 			// For production use, recommend using the applyFilters function instead
// 			// as it has proper type safety for individual filter operations

// 			// For now, return the base expression as filter groups are complex to type properly
// 			// This function exists primarily for API compatibility
// 			// Real filtering should use applyFilters() which has proper type safety
// 		}

// 		return expr;
// 	});
// }

// Helper function removed due to complex Kysely typing issues
// Complex filter expressions are now handled inline in applyFilterGroups

// Parse filters from JSON string (for API endpoints)
export function parseFilters(filtersJson?: string): Filter[] {
	if (!filtersJson) return [];

	try {
		const parsed = JSON.parse(filtersJson);
		if (Array.isArray(parsed)) {
			return parsed as Filter[];
		}
		return [];
	} catch {
		return [];
	}
}

// Validate filter before applying
export function validateFilter(filter: Filter): boolean {
	// Check required fields
	if (!filter.field || !filter.operator || !filter.type) {
		return false;
	}

	// Check if value is required for this operator
	const valueRequired = ![
		'is_empty',
		'is_not_empty',
		'is_today',
		'is_yesterday',
		'is_this_week',
		'is_this_month',
		'is_this_year',
		'is_true',
		'is_false'
	].includes(filter.operator);

	if (valueRequired && (filter.value === null || filter.value === undefined)) {
		return false;
	}

	// Check range operators have array values
	if (['between', 'not_between'].includes(filter.operator)) {
		if (!Array.isArray(filter.value) || filter.value.length !== 2) {
			return false;
		}
	}

	// Check multiselect operators have array values
	if (['is_any_of', 'is_none_of'].includes(filter.operator)) {
		if (!Array.isArray(filter.value)) {
			return false;
		}
	}

	return true;
}

// Sanitize filter values to prevent SQL injection (belt and suspenders approach)
export function sanitizeFilterValue(value: unknown): unknown {
	if (typeof value === 'string') {
		// Remove any SQL-like patterns (this is extra safety, Kysely already handles parameterization)
		return value.replace(/[;'"\\]/g, '');
	}
	if (Array.isArray(value)) {
		return value.map(sanitizeFilterValue);
	}
	return value;
}
