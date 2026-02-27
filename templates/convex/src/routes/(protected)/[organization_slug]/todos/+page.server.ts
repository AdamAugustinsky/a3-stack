import type { PageServerLoad } from './$types';
import { convexLoad } from 'convex-sveltekit';
import { api } from '$convex/api';

export const load: PageServerLoad = async ({ params }) => ({
	todos: await convexLoad(api.todos.listTodos, {
		organizationSlug: params.organization_slug
	})
});
