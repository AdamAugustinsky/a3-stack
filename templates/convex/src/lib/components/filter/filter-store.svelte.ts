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
	lastUrlFilters = $state<string>(page.url.searchParams.get('filters') || '');
	mode = $state<FilterMode>('simple');

	constructor(initialFilters: Filter[] = [], initialMode: FilterMode = 'simple') {
		this.filters = initialFilters;
		this.mode = initialMode;

		// Always load filters from URL (advanced format only)
		const urlFilters = page.url.searchParams.get('filters');
		if (urlFilters) {
			try {
				this.filters = deserializeFilters(urlFilters);
			} catch (e) {
				console.error('Failed to parse filters from URL:', e);
				this.filters = [];
			}
		}

		$effect(() => {
			const currentUrlFilters = page.url.searchParams.get('filters') || '';
			if (currentUrlFilters !== this.lastUrlFilters) {
				this.lastUrlFilters = currentUrlFilters;
				try {
					this.filters = currentUrlFilters ? deserializeFilters(currentUrlFilters) : [];
				} catch (e) {
					console.error('Failed to parse filters from URL:', e);
					this.filters = [];
				}
			}
		});

		$effect(() => {
			const currentFilterSerialized = this.filters.length > 0 ? serializeFilters(this.filters) : '';

			if (currentFilterSerialized !== this.lastUrlFilters) {
				this.lastUrlFilters = currentFilterSerialized;
				const url = new SvelteURL(window.location.href);

				if (currentFilterSerialized) {
					url.searchParams.set('filters', currentFilterSerialized);
				} else {
					url.searchParams.delete('filters');
				}

				goto(url.pathname + url.search, {
					replaceState: true,
					keepFocus: true,
					noScroll: true
				});
			}
		});
	}

	// Add a new filter
	addFilter(filter: Omit<Filter, 'id'>): void {
		this.filters = [...this.filters, { ...filter, id: generateFilterId() }];
	}

	// Update an existing filter
	updateFilter(id: string, updates: Partial<Filter>): void {
		this.filters = this.filters.map((f) => (f.id === id ? { ...f, ...updates } : f));
	}

	// Remove a filter
	removeFilter(id: string): void {
		this.filters = this.filters.filter((f) => f.id !== id);
	}

	// Clear all filters
	clearFilters(): void {
		this.filters = [];
	}

	// Replace all filters
	setFilters(filters: Filter[]): void {
		this.filters = filters;
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
		this.filters = deserializeFilters(serialized);
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
			this.deserialize(filtersParam);
		} else {
			this.clearFilters();
		}
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
