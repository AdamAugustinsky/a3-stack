/* eslint-disable svelte/no-navigation-without-resolve */
import { goto } from '$app/navigation';
import { page } from '$app/state';
import {
	type Filter,
	generateFilterId,
	serializeFilters,
	deserializeFilters
} from '@/utils/filter';
import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';

type FilterMode = 'simple' | 'advanced';

function getInitialFilters(): Filter[] {
	const filtersParam = page.url.searchParams.get('filters');
	if (filtersParam) {
		try {
			return deserializeFilters(filtersParam);
		} catch (e) {
			console.error('Failed to parse filters from URL:', e);
			return [];
		}
	}
	return [];
}

export class FilterStore {
	filters = $state<Filter[]>(getInitialFilters());
	mode = $state<FilterMode>('simple');

	constructor(initialFilters: Filter[] = [], initialMode: FilterMode = 'simple') {
		this.mode = initialMode;
		const urlFilters = page.url.searchParams.get('filters');
		if (urlFilters) {
			try {
				this.filters = deserializeFilters(urlFilters);
			} catch (e) {
				console.error('Failed to parse filters from URL:', e);
				this.filters = [];
			}
		} else {
			this.filters = initialFilters;
		}
	}

	// Add a new filter
	addFilter(filter: Omit<Filter, 'id'>): void {
		this.setFilters([...this.filters, { ...filter, id: generateFilterId() }]);
	}

	// Update an existing filter
	updateFilter(id: string, updates: Partial<Filter>): void {
		this.setFilters(this.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
	}

	// Remove a filter
	removeFilter(id: string): void {
		this.setFilters(this.filters.filter((f) => f.id !== id));
	}

	// Clear all filters
	clearFilters(): void {
		if (this.filters.length === 0) return;
		this.setFilters([]);
	}

	// Replace all filters
	setFilters(filters: Filter[]): void {
		const currentSerialized = this.filters.length > 0 ? serializeFilters(this.filters) : '';
		const nextSerialized = filters.length > 0 ? serializeFilters(filters) : '';
		if (currentSerialized === nextSerialized) return;
		this.filters = filters;
		this.syncUrl();
	}

	// Get filter by ID
	getFilter(id: string): Filter | undefined {
		return this.filters.find((f) => f.id === id);
	}

	// Check if any filters are active
	get hasFilters(): boolean {
		return this.filters.length > 0;
	}

	// Get filter count
	get count(): number {
		return this.filters.length;
	}

	// Serialize filters for URL/API
	serialize(): string {
		return serializeFilters(this.filters);
	}

	// Load filters from serialized string
	deserialize(serialized: string): void {
		this.setFilters(deserializeFilters(serialized));
	}

	// Get filters as plain array (for API calls)
	toArray(): Filter[] {
		return this.filters;
	}

	// Create URL search params from filters
	toURLSearchParams(): SvelteURLSearchParams {
		const params = new SvelteURLSearchParams();
		if (this.filters.length > 0) {
			params.set('filters', this.serialize());
		}
		return params;
	}

	// Load filters from URL search params
	fromURLSearchParams(params: URLSearchParams | SvelteURLSearchParams): void {
		const filtersParam = params.get('filters');
		if (filtersParam) {
			try {
				this.setFilters(deserializeFilters(filtersParam));
			} catch (e) {
				console.error('Failed to parse filters from URL:', e);
				this.clearFilters();
			}
		} else {
			this.clearFilters();
		}
	}

	private syncUrl(): void {
		if (typeof window === 'undefined') return;

		const nextSerialized = this.filters.length > 0 ? serializeFilters(this.filters) : '';
		const url = new SvelteURL(window.location.href);
		const currentSerialized = url.searchParams.get('filters') || '';
		if (currentSerialized === nextSerialized) return;

		if (nextSerialized) {
			url.searchParams.set('filters', nextSerialized);
		} else {
			url.searchParams.delete('filters');
		}

		goto(url.pathname + url.search, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	// Create a human-readable summary of active filters
	getSummary(): string {
		if (this.filters.length === 0) return 'No filters';
		if (this.filters.length === 1) return '1 filter';
		return `${this.filters.length} filters`;
	}

	// Switch between simple and advanced filter modes (UI only)
	switchMode(newMode: FilterMode): void {
		this.mode = newMode;
	}

	// Get current filter mode
	get currentMode(): FilterMode {
		return this.mode;
	}

	// Check if we have any filters
	get hasAnyFilters(): boolean {
		return this.filters.length > 0;
	}

	// Check if we have advanced filters (alias for consistency)
	get hasAdvancedFilters(): boolean {
		return this.filters.length > 0;
	}
}
