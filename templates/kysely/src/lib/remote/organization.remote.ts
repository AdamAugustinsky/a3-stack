import { command, form, getRequestEvent, query } from '$app/server';
import { auth } from '$lib/server/auth';
import {
	createOrganizationFormSchema,
	deleteOrganizationSchema,
	getFullOrganizationSchema,
	invitationIdSchema,
	inviteMemberSchema,
	listInvitationsSchema,
	listMembersSchema,
	removeMemberSchema,
	updateMemberRoleSchema,
	updateOrganizationSchema
} from '$lib/schemas/organization';
import { requireValue, runServerEffect, tryPromise } from '$lib/server/effect';
import { Effect } from 'effect';
import * as v from 'valibot';

const requestHeaders = () => getRequestEvent().request.headers;

export const listOrganizations = query(() =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.listOrganizations({
						headers: requestHeaders()
					}),
				{
					message: 'Failed to list organizations'
				}
			);

			return Array.isArray(result) ? result : [];
		})
	)
);

export const getActiveOrganization = query(() =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.getFullOrganization({
						headers: requestHeaders()
					}),
				{
					message: 'Failed to load active organization'
				}
			);

			return result ?? null;
		})
	)
);

export const getFullOrganization = query(getFullOrganizationSchema, (args) =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.getFullOrganization({
						headers: requestHeaders(),
						query: {
							organizationId: args.organizationId,
							organizationSlug: args.organizationSlug,
							membersLimit: args.membersLimit
						}
					}),
				{
					message: 'Failed to load organization'
				}
			);

			return yield* requireValue(result, 404, 'Organization not found');
		})
	)
);

export const listMembers = query(listMembersSchema, (args) =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.listMembers({
						headers: requestHeaders(),
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
					}),
				{
					message: 'Failed to list organization members'
				}
			);

			return result ?? { members: [], count: 0 };
		})
	)
);

export const listInvitations = query(listInvitationsSchema, (args) =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.listInvitations({
						headers: requestHeaders(),
						query: {
							organizationId: args.organizationId
						}
					}),
				{
					message: 'Failed to list invitations'
				}
			);

			return Array.isArray(result) ? result : [];
		})
	)
);

const setActiveOrganizationSchema = v.object({
	organizationId: v.optional(v.union([v.string(), v.null_()])),
	organizationSlug: v.optional(v.string())
});

export const setActiveOrganization = command(setActiveOrganizationSchema, (args) =>
	runServerEffect(
		Effect.gen(function* () {
			yield* tryPromise(
				() =>
					auth.api.setActiveOrganization({
						headers: requestHeaders(),
						body: {
							organizationId: args.organizationId ?? undefined,
							organizationSlug: args.organizationSlug
						}
					}),
				{
					message: 'Failed to set active organization'
				}
			);

			return { ok: true };
		})
	)
);

const createOrganizationSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Organization name is required')),
	slug: v.pipe(v.string(), v.minLength(1, 'Organization slug is required'))
});

export const createOrganization = form(createOrganizationSchema, ({ name, slug }) =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.createOrganization({
						headers: requestHeaders(),
						body: { name, slug }
					}),
				{
					message: 'Failed to create organization'
				}
			);

			yield* tryPromise(() => listOrganizations().refresh(), {
				message: 'Failed to refresh organization list'
			});

			return result;
		})
	)
);

export const createOrganizationCommand = command(
	createOrganizationFormSchema,
	({ name, slug, logo, keepCurrentActiveOrganization }) =>
		runServerEffect(
			Effect.gen(function* () {
				const result = yield* tryPromise(
					() =>
						auth.api.createOrganization({
							headers: requestHeaders(),
							body: {
								name,
								slug,
								logo,
								keepCurrentActiveOrganization
							}
						}),
					{
						message: 'Failed to create organization'
					}
				);

				yield* tryPromise(() => listOrganizations().refresh(), {
					message: 'Failed to refresh organization list'
				});

				return result;
			})
		)
);

export const updateOrganization = command(updateOrganizationSchema, ({ organizationId, data }) =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.updateOrganization({
						headers: requestHeaders(),
						body: {
							organizationId,
							data
						}
					}),
				{
					message: 'Failed to update organization'
				}
			);

			yield* tryPromise(() => listOrganizations().refresh(), {
				message: 'Failed to refresh organization list'
			});

			return result;
		})
	)
);

const updateOrganizationFormSchema = v.object({
	organizationId: v.string(),
	name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
	slug: v.pipe(v.string(), v.minLength(1, 'Slug is required')),
	logo: v.optional(v.string())
});

export const updateOrganizationForm = form(
	updateOrganizationFormSchema,
	({ organizationId, name, slug, logo }) =>
		runServerEffect(
			Effect.gen(function* () {
				yield* tryPromise(
					() =>
						auth.api.updateOrganization({
							headers: requestHeaders(),
							body: {
								organizationId,
								data: { name, slug, logo: logo || undefined }
							}
						}),
					{
						message: 'Failed to update organization'
					}
				);

				yield* tryPromise(() => listOrganizations().refresh(), {
					message: 'Failed to refresh organization list'
				});

				return { success: true, newSlug: slug };
			})
		)
);

const inviteMemberFormSchema = v.object({
	organizationId: v.string(),
	email: v.pipe(v.string(), v.email('Invalid email address')),
	role: v.picklist(['member', 'admin', 'owner'])
});

export const inviteMemberForm = form(inviteMemberFormSchema, ({ organizationId, email, role }) =>
	runServerEffect(
		Effect.gen(function* () {
			yield* tryPromise(
				() =>
					auth.api.createInvitation({
						headers: requestHeaders(),
						body: { email, role, organizationId }
					}),
				{
					message: 'Failed to invite member'
				}
			);

			return { success: true };
		})
	)
);

export const deleteOrganization = command(deleteOrganizationSchema, ({ organizationId }) =>
	runServerEffect(
		Effect.gen(function* () {
			yield* tryPromise(
				() =>
					auth.api.deleteOrganization({
						headers: requestHeaders(),
						body: {
							organizationId
						}
					}),
				{
					message: 'Failed to delete organization'
				}
			);

			yield* tryPromise(() => listOrganizations().refresh(), {
				message: 'Failed to refresh organization list'
			});

			return { ok: true };
		})
	)
);

export const inviteMember = command(inviteMemberSchema, (args) =>
	runServerEffect(
		Effect.gen(function* () {
			const result = yield* tryPromise(
				() =>
					auth.api.createInvitation({
						headers: requestHeaders(),
						body: {
							email: args.email,
							role: args.role,
							organizationId: args.organizationId,
							resend: args.resend
						}
					}),
				{
					message: 'Failed to invite member'
				}
			);

			return result;
		})
	)
);

export const acceptInvitation = command(invitationIdSchema, ({ invitationId }) =>
	runServerEffect(
		Effect.gen(function* () {
			return yield* tryPromise(
				() =>
					auth.api.acceptInvitation({
						headers: requestHeaders(),
						body: { invitationId }
					}),
				{
					message: 'Failed to accept invitation'
				}
			);
		})
	)
);

export const rejectInvitation = command(invitationIdSchema, ({ invitationId }) =>
	runServerEffect(
		Effect.gen(function* () {
			yield* tryPromise(
				() =>
					auth.api.rejectInvitation({
						headers: requestHeaders(),
						body: { invitationId }
					}),
				{
					message: 'Failed to reject invitation'
				}
			);

			return { ok: true };
		})
	)
);

export const cancelInvitation = command(invitationIdSchema, ({ invitationId }) =>
	runServerEffect(
		Effect.gen(function* () {
			yield* tryPromise(
				() =>
					auth.api.cancelInvitation({
						headers: requestHeaders(),
						body: { invitationId }
					}),
				{
					message: 'Failed to cancel invitation'
				}
			);

			return { ok: true };
		})
	)
);

export const updateMemberRole = command(
	updateMemberRoleSchema,
	({ memberId, role, organizationId }) =>
		runServerEffect(
			Effect.gen(function* () {
				yield* tryPromise(
					() =>
						auth.api.updateMemberRole({
							headers: requestHeaders(),
							body: {
								memberId,
								role,
								organizationId
							}
						}),
					{
						message: 'Failed to update member role'
					}
				);

				return { ok: true };
			})
		)
);

export const removeMember = command(removeMemberSchema, ({ memberIdOrEmail, organizationId }) =>
	runServerEffect(
		Effect.gen(function* () {
			yield* tryPromise(
				() =>
					auth.api.removeMember({
						headers: requestHeaders(),
						body: {
							memberIdOrEmail,
							organizationId
						}
					}),
				{
					message: 'Failed to remove member'
				}
			);

			return { ok: true };
		})
	)
);
