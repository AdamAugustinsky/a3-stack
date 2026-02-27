import type { PageServerLoad } from './$types';
import { convexLoad } from 'convex-sveltekit';
import { api } from '$convex/api';

export const load: PageServerLoad = async () => ({
	user: await convexLoad(api.auth.getCurrentUser, {})
});
