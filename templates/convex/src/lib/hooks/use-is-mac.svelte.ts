import { browser } from '$app/environment';

export function useIsMac() {
	return browser && typeof navigator !== 'undefined'
		? navigator.platform.toUpperCase().indexOf('MAC') >= 0
		: false;
}
