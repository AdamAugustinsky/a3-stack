import * as v from 'valibot';

const stringId = v.pipe(v.string(), v.minLength(1));
const slug = v.pipe(v.string(), v.minLength(1));

export const updateOrganizationSchema = v.object({
	organizationId: stringId,
	data: v.object({
		name: v.optional(v.pipe(v.string(), v.minLength(1))),
		slug: v.optional(slug),
		logo: v.optional(v.pipe(v.string(), v.minLength(1))),
		metadata: v.optional(v.record(v.string(), v.unknown()))
	})
});

export const deleteOrganizationSchema = v.object({
	organizationId: stringId
});

export const setActiveOrganizationSchema = v.object({
	organizationId: v.optional(v.union([stringId, v.null_()])),
	organizationSlug: v.optional(slug)
});

export const inviteMemberSchema = v.object({
	email: v.pipe(v.string(), v.email('A valid email is required')),
	role: v.union([
		v.literal('member'),
		v.literal('admin'),
		v.literal('owner'),
		v.array(v.union([v.literal('member'), v.literal('admin'), v.literal('owner')]))
	]),
	organizationId: v.optional(stringId),
	resend: v.optional(v.boolean())
});

export const invitationIdSchema = v.object({
	invitationId: stringId
});

export const listMembersSchema = v.object({
	organizationId: v.optional(stringId),
	limit: v.optional(v.number()),
	offset: v.optional(v.number()),
	sortBy: v.optional(v.string()),
	sortDirection: v.optional(v.union([v.literal('asc'), v.literal('desc')])),
	filterField: v.optional(v.string()),
	filterOperator: v.optional(
		v.union([
			v.literal('eq'),
			v.literal('ne'),
			v.literal('gt'),
			v.literal('gte'),
			v.literal('lt'),
			v.literal('lte'),
			v.literal('contains')
		])
	),
	filterValue: v.optional(v.string())
});

export const updateMemberRoleSchema = v.object({
	memberId: stringId,
	role: v.union([
		v.literal('member'),
		v.literal('admin'),
		v.literal('owner'),
		v.array(v.union([v.literal('member'), v.literal('admin'), v.literal('owner')]))
	]),
	organizationId: v.optional(stringId)
});

export const removeMemberSchema = v.object({
	memberIdOrEmail: v.pipe(v.string(), v.minLength(1)),
	organizationId: stringId
});

export const getFullOrganizationSchema = v.object({
	organizationId: v.optional(stringId),
	organizationSlug: v.optional(slug),
	membersLimit: v.optional(v.number())
});

export const listInvitationsSchema = v.object({
	organizationId: v.optional(stringId)
});

export const createOrganizationFormSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1, 'Organization name is required')),
	slug: v.pipe(v.string(), v.minLength(1)),
	logo: v.optional(v.pipe(v.string(), v.minLength(1))),
	keepCurrentActiveOrganization: v.optional(
		v.pipe(
			v.string(),
			v.transform((val) => val === 'true')
		)
	)
});
