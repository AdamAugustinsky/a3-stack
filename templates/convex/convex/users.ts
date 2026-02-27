import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { authComponent, createAuth } from './auth';

export const getSession = query({
	args: {},
	handler: async (ctx) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		return await auth.api.getSession({ headers });
	}
});

export const updateProfile = mutation({
	args: {
		name: v.string()
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const user = await auth.api.updateUser({
			headers,
			body: { name: args.name }
		});

		if (!user) {
			throw new Error('Failed to update profile');
		}

		return { success: true, user };
	}
});
