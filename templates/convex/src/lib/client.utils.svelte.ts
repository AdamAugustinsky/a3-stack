/* eslint-disable svelte/no-navigation-without-resolve */
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { SvelteURL, SvelteURLSearchParams } from 'svelte/reactivity';
import type { Filter } from '$lib/utils/filter';
import { deserializeFilters, serializeFilters, generateFilterId } from '$lib/utils/filter';

export function navigateToInActiveOrg(path: string) {
	const normalized = path.startsWith('/') ? path : '/' + path;
	goto('/' + page.params.organization_slug + normalized, {
		replaceState: true,
		noScroll: true
	});
}

export function changeActiveOrg(newSlug: string) {
	if (!page.params.organization_slug) return;
	const search = page.url.searchParams.toString().length
		? '?' + page.url.searchParams.toString()
		: '';
	const path = page.url.pathname.replace(page.params.organization_slug, newSlug) + search;
	goto(path, {
		replaceState: true,
		noScroll: true
	});
}

export const localStorageState = (key: string, initialValue: string) => {
	let value = $state(localStorage.getItem(key) || initialValue);

	$effect(() => {
		localStorage.setItem(key, value);
	});

	return {
		get value() {
			return value;
		},
		set value(v) {
			value = v;
		}
	};
};

export const queryParamsState = (key: string, initialValue: string = '') => {
	let value = $state(page.url.searchParams.get(key) || initialValue);
	let lastUrlValue = $state(page.url.searchParams.get(key) || initialValue);

	// Update value when URL changes externally
	$effect(() => {
		const currentUrlValue = page.url.searchParams.get(key) || initialValue;
		if (currentUrlValue !== lastUrlValue) {
			lastUrlValue = currentUrlValue;
			value = currentUrlValue;
		}
	});

	// Update URL when value changes internally
	$effect(() => {
		if (value !== lastUrlValue) {
			lastUrlValue = value;
			const currentUrl = new SvelteURL(window.location.href);
			if (value) {
				currentUrl.searchParams.set(key, value);
			} else {
				currentUrl.searchParams.delete(key);
			}
			goto(currentUrl.pathname + currentUrl.search, {
				replaceState: true,
				noScroll: true
			});
		}
	});

	return {
		get value() {
			return value;
		},
		set value(v) {
			value = v;
		}
	};
};

export const filterStoreRune = () => {
	// Initialize filters from URL
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

	let filters = $state<Filter[]>(getInitialFilters());
	let lastUrlFilters = $state<string>(page.url.searchParams.get('filters') || '');

	// Update filters when URL changes externally
	$effect(() => {
		const currentUrlFilters = page.url.searchParams.get('filters') || '';
		if (currentUrlFilters !== lastUrlFilters) {
			lastUrlFilters = currentUrlFilters;
			try {
				filters = currentUrlFilters ? deserializeFilters(currentUrlFilters) : [];
			} catch (e) {
				console.error('Failed to parse filters from URL:', e);
				filters = [];
			}
		}
	});

	// Update URL when filters change internally
	$effect(() => {
		const currentFilterSerialized = filters.length > 0 ? serializeFilters(filters) : '';

		if (currentFilterSerialized !== lastUrlFilters) {
			lastUrlFilters = currentFilterSerialized;
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

	const addFilter = (filter: Omit<Filter, 'id'>) => {
		filters = [...filters, { ...filter, id: generateFilterId() }];
	};

	const updateFilter = (id: string, updates: Partial<Filter>) => {
		filters = filters.map((f) => (f.id === id ? { ...f, ...updates } : f));
	};

	const removeFilter = (id: string) => {
		filters = filters.filter((f) => f.id !== id);
	};

	const clearFilters = () => {
		filters = [];
	};

	const setFilters = (newFilters: Filter[]) => {
		filters = newFilters;
	};

	const getFilter = (id: string): Filter | undefined => {
		return filters.find((f) => f.id === id);
	};

	const serialize = () => {
		return filters.length > 0 ? serializeFilters(filters) : '';
	};

	const deserialize = (serialized: string) => {
		try {
			filters = deserializeFilters(serialized);
		} catch (e) {
			console.error('Failed to deserialize filters:', e);
			filters = [];
		}
	};

	const toArray = (): Filter[] => {
		return filters;
	};

	const toURLSearchParams = () => {
		const params = new SvelteURLSearchParams();
		if (filters.length > 0) {
			params.set('filters', serialize());
		}
		return params;
	};

	const fromURLSearchParams = (params: URLSearchParams) => {
		const filtersParam = params.get('filters');
		if (filtersParam) {
			deserialize(filtersParam);
		} else {
			clearFilters();
		}
	};

	const getSummary = (): string => {
		if (filters.length === 0) return 'No filters';
		if (filters.length === 1) return '1 filter';
		return `${filters.length} filters`;
	};

	return {
		get filters() {
			return filters;
		},
		get count() {
			return filters.length;
		},
		get hasFilters() {
			return filters.length > 0;
		},
		addFilter,
		updateFilter,
		removeFilter,
		clearFilters,
		setFilters,
		getFilter,
		serialize,
		deserialize,
		toArray,
		toURLSearchParams,
		fromURLSearchParams,
		getSummary
	};
};
