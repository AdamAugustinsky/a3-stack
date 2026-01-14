import { form, query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import {
	updateOrganizationSchema,
	deleteOrganizationSchema,
	inviteMemberSchema,
	invitationIdSchema,
	listMembersSchema,
	updateMemberRoleSchema,
	removeMemberSchema,
	getFullOrganizationSchema,
	listInvitationsSchema,
	createOrganizationFormSchema
} from '$lib/schemas/organization';
import * as v from 'valibot';

export const listOrganizations = query(async () => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.listOrganizations({ headers });
	return Array.isArray(result) ? result : [];
});

export const getActiveOrganization = query(async () => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.getFullOrganization({ headers });
	return result ?? null;
});

export const getFullOrganization = query(getFullOrganizationSchema, async (args) => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.getFullOrganization({
		headers,
		query: {
			organizationId: args.organizationId,
			organizationSlug: args.organizationSlug,
			membersLimit: args.membersLimit
		}
	});
	if (!result) error(404, 'Organization not found');
	return result;
});

export const listMembers = query(listMembersSchema, async (args) => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.listMembers({
		headers,
		query: {
			organizationId: args.organizationId,
			limit: args.limit,
			offset: args.offset,
			sortBy: args.sortBy,
			sortDirection: args.sortDirection,
			filterField: args.filterField,
			filterOperator: args.filterOperator,
			filterValue: args.filterValue
		}
	});
	return result ?? { members: [], count: 0 };
});

export const listInvitations = query(listInvitationsSchema, async (args) => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.listInvitations({
		headers,
		query: {
			organizationId: args.organizationId
		}
	});
	return Array.isArray(result) ? result : [];
});

const setActiveOrganizationSchema = v.object({
	organizationId: v.optional(v.union([v.string(), v.null_()])),
	organizationSlug: v.optional(v.string())
});

export const setActiveOrganization = command(setActiveOrganizationSchema, async (args) => {
	const headers = getRequestEvent().request.headers;
	await auth.api.setActiveOrganization({
		headers,
		body: {
			organizationId: args.organizationId ?? undefined,
			organizationSlug: args.organizationSlug
		}
	});
	return { ok: true };
});

const createOrganizationSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Organization name is required')),
	slug: v.pipe(v.string(), v.minLength(1, 'Organization slug is required'))
});

export const createOrganization = form(createOrganizationSchema, async ({ name, slug }) => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.createOrganization({
		headers,
		body: { name, slug }
	});
	await listOrganizations().refresh();
	return result;
});

export const createOrganizationCommand = command(
	createOrganizationFormSchema,
	async ({ name, slug, logo, keepCurrentActiveOrganization }) => {
		const headers = getRequestEvent().request.headers;
		const result = await auth.api.createOrganization({
			headers,
			body: {
				name,
				slug,
				logo,
				keepCurrentActiveOrganization
			}
		});
		await listOrganizations().refresh();
		return result;
	}
);

export const updateOrganization = command(
	updateOrganizationSchema,
	async ({ organizationId, data }) => {
		const headers = getRequestEvent().request.headers;
		const result = await auth.api.updateOrganization({
			headers,
			body: {
				organizationId,
				data
			}
		});
		await listOrganizations().refresh();
		return result;
	}
);

const updateOrganizationFormSchema = v.object({
	organizationId: v.string(),
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	slug: v.pipe(v.string(), v.minLength(1, 'Slug is required')),
	logo: v.optional(v.string())
});

export const updateOrganizationForm = form(
	updateOrganizationFormSchema,
	async ({ organizationId, name, slug, logo }) => {
		const headers = getRequestEvent().request.headers;
		await auth.api.updateOrganization({
			headers,
			body: {
				organizationId,
				data: { name, slug, logo: logo || undefined }
			}
		});
		await listOrganizations().refresh();
		return { success: true, newSlug: slug };
	}
);

const inviteMemberFormSchema = v.object({
	organizationId: v.string(),
	email: v.pipe(v.string(), v.email('Invalid email address')),
	role: v.picklist(['member', 'admin', 'owner'])
});

export const inviteMemberForm = form(inviteMemberFormSchema, async ({ organizationId, email, role }) => {
	const headers = getRequestEvent().request.headers;
	await auth.api.createInvitation({
		headers,
		body: { email, role, organizationId }
	});
	return { success: true };
});

export const deleteOrganization = command(deleteOrganizationSchema, async ({ organizationId }) => {
	const headers = getRequestEvent().request.headers;
	await auth.api.deleteOrganization({
		headers,
		body: {
			organizationId
		}
	});
	await listOrganizations().refresh();
	return { ok: true };
});

export const inviteMember = command(inviteMemberSchema, async (args) => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.createInvitation({
		headers,
		body: {
			email: args.email,
			role: args.role,
			organizationId: args.organizationId,
			resend: args.resend
		}
	});
	return result;
});

export const acceptInvitation = command(invitationIdSchema, async ({ invitationId }) => {
	const headers = getRequestEvent().request.headers;
	const result = await auth.api.acceptInvitation({
		headers,
		body: { invitationId }
	});
	return result;
});

export const rejectInvitation = command(invitationIdSchema, async ({ invitationId }) => {
	const headers = getRequestEvent().request.headers;
	await auth.api.rejectInvitation({
		headers,
		body: { invitationId }
	});
	return { ok: true };
});

export const cancelInvitation = command(invitationIdSchema, async ({ invitationId }) => {
	const headers = getRequestEvent().request.headers;
	await auth.api.cancelInvitation({
		headers,
		body: { invitationId }
	});
	return { ok: true };
});

export const updateMemberRole = command(
	updateMemberRoleSchema,
	async ({ memberId, role, organizationId }) => {
		const headers = getRequestEvent().request.headers;
		await auth.api.updateMemberRole({
			headers,
			body: {
				memberId,
				role,
				organizationId
			}
		});
		return { ok: true };
	}
);

export const removeMember = command(
	removeMemberSchema,
	async ({ memberIdOrEmail, organizationId }) => {
		const headers = getRequestEvent().request.headers;
		await auth.api.removeMember({
			headers,
			body: {
				memberIdOrEmail,
				organizationId
			}
		});
		return { ok: true };
	}
);
