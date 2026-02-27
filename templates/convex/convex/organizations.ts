import { v } from 'convex/values';
import type { GenericCtx } from '@convex-dev/better-auth';
import { mutation, query } from './_generated/server';
import { authComponent, createAuth } from './auth';
import type { DataModel } from './_generated/dataModel';

const roleValidator = v.union(
	v.literal('member'),
	v.literal('admin'),
	v.literal('owner'),
	v.array(v.union(v.literal('member'), v.literal('admin'), v.literal('owner')))
);

async function getAuth(ctx: GenericCtx<DataModel>) {
	return await authComponent.getAuth(createAuth, ctx);
}

async function getAuthUser(ctx: GenericCtx<DataModel>) {
	try {
		return await authComponent.getAuthUser(ctx);
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthenticated') {
			return null;
		}
		throw new Error('Failed to resolve authenticated user', { cause: error });
	}
}

async function getAuthContext(ctx: GenericCtx<DataModel>) {
	const user = await getAuthUser(ctx);
	if (!user) {
		return null;
	}
	return await getAuth(ctx);
}

function normalizeBetterAuthValue<T>(value: T): T {
	if (value instanceof Date) {
		return value.toISOString() as T;
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeBetterAuthValue(item)) as T;
	}

	if (value && typeof value === 'object') {
		const normalizedEntries = Object.entries(value as Record<string, unknown>)
			.filter(([, fieldValue]) => fieldValue !== undefined)
			.map(([key, fieldValue]) => [key, normalizeBetterAuthValue(fieldValue)]);
		return Object.fromEntries(normalizedEntries) as T;
	}

	if (value === 'undefined') {
		return null as T;
	}

	return value;
}

export const listOrganizations = query({
	args: {},
	handler: async (ctx) => {
		const authContext = await getAuthContext(ctx);
		if (!authContext) {
			return [];
		}

		const { auth, headers } = authContext;
		const result = await auth.api.listOrganizations({ headers });
		return normalizeBetterAuthValue(Array.isArray(result) ? result : []);
	}
});

export const getFullOrganization = query({
	args: {
		organizationId: v.optional(v.string()),
		organizationSlug: v.optional(v.string()),
		membersLimit: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const authContext = await getAuthContext(ctx);
		if (!authContext) {
			return null;
		}

		const { auth, headers } = authContext;
		const result = await auth.api.getFullOrganization({
			headers,
			query: {
				organizationId: args.organizationId,
				organizationSlug: args.organizationSlug,
				membersLimit: args.membersLimit
			}
		});
		return normalizeBetterAuthValue(result);
	}
});

export const getOrganizationBySlug = query({
	args: {
		organizationSlug: v.string()
	},
	handler: async (ctx, { organizationSlug }) => {
		const authContext = await getAuthContext(ctx);
		if (!authContext) {
			return null;
		}

		const { auth, headers } = authContext;
		const result = await auth.api.getFullOrganization({
			headers,
			query: { organizationSlug }
		});
		return normalizeBetterAuthValue(result);
	}
});

export const listMembers = query({
	args: {
		organizationId: v.optional(v.string()),
		limit: v.optional(v.number()),
		offset: v.optional(v.number()),
		sortBy: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
		filterField: v.optional(v.string()),
		filterOperator: v.optional(
			v.union(
				v.literal('eq'),
				v.literal('ne'),
				v.literal('gt'),
				v.literal('gte'),
				v.literal('lt'),
				v.literal('lte'),
				v.literal('contains')
			)
		),
		filterValue: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const authContext = await getAuthContext(ctx);
		if (!authContext) {
			return [];
		}

		const { auth, headers } = authContext;
		const result = await auth.api.listMembers({
			headers,
			query: args
		});
		return normalizeBetterAuthValue(result);
	}
});

export const listInvitations = query({
	args: {
		organizationId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const authContext = await getAuthContext(ctx);
		if (!authContext) {
			return [];
		}

		const { auth, headers } = authContext;
		const result = await auth.api.listInvitations({
			headers,
			query: {
				organizationId: args.organizationId
			}
		});
		return normalizeBetterAuthValue(Array.isArray(result) ? result : []);
	}
});

export const setActiveOrganization = mutation({
	args: {
		organizationId: v.optional(v.union(v.string(), v.null())),
		organizationSlug: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		await auth.api.setActiveOrganization({
			headers,
			body: {
				organizationId: args.organizationId ?? undefined,
				organizationSlug: args.organizationSlug
			}
		});
		return { ok: true };
	}
});

export const createOrganization = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
		logo: v.optional(v.string()),
		keepCurrentActiveOrganization: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		const result = await auth.api.createOrganization({
			headers,
			body: args
		});
		return normalizeBetterAuthValue(result);
	}
});

export const updateOrganization = mutation({
	args: {
		organizationId: v.string(),
		data: v.object({
			name: v.optional(v.string()),
			slug: v.optional(v.string()),
			logo: v.optional(v.string())
		})
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		const result = await auth.api.updateOrganization({
			headers,
			body: args
		});
		return normalizeBetterAuthValue(result);
	}
});

export const deleteOrganization = mutation({
	args: {
		organizationId: v.string()
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		await auth.api.deleteOrganization({
			headers,
			body: args
		});
		return { ok: true };
	}
});

export const createInvitation = mutation({
	args: {
		email: v.string(),
		role: roleValidator,
		organizationId: v.optional(v.string()),
		resend: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		const result = await auth.api.createInvitation({
			headers,
			body: args
		});
		return normalizeBetterAuthValue(result);
	}
});

export const acceptInvitation = mutation({
	args: {
		invitationId: v.string()
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		const result = await auth.api.acceptInvitation({
			headers,
			body: args
		});
		return normalizeBetterAuthValue(result);
	}
});

export const rejectInvitation = mutation({
	args: {
		invitationId: v.string()
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		await auth.api.rejectInvitation({
			headers,
			body: args
		});
		return { ok: true };
	}
});

export const cancelInvitation = mutation({
	args: {
		invitationId: v.string()
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		await auth.api.cancelInvitation({
			headers,
			body: args
		});
		return { ok: true };
	}
});

export const updateMemberRole = mutation({
	args: {
		memberId: v.string(),
		role: roleValidator,
		organizationId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		await auth.api.updateMemberRole({
			headers,
			body: args
		});
		return { ok: true };
	}
});

export const removeMember = mutation({
	args: {
		memberIdOrEmail: v.string(),
		organizationId: v.string()
	},
	handler: async (ctx, args) => {
		const { auth, headers } = await getAuth(ctx);
		await auth.api.removeMember({
			headers,
			body: args
		});
		return { ok: true };
	}
});
