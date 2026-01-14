import { browser } from '$app/environment';

export function useIsMac() {
	const isMac = $derived(
		browser && typeof navigator !== 'undefined'
			? navigator.platform.toUpperCase().indexOf('MAC') >= 0
			: false
	);

	return isMac;
}
