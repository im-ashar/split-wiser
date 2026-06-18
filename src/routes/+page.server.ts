import type { PageServerLoad } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';

interface SerializableGroup {
	id: number;
	name: string;
	members: Array<{
		id: number;
		first_name: string;
		last_name: string;
		email?: string;
		user_id?: number;
	}>;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) {
		return { groups: [] as SerializableGroup[] };
	}
	try {
		const client = getClient(event);
		const res = await callSplitwise(() => client.groups.getGroups());
		const groups: SerializableGroup[] = (res.groups ?? []).map((g) => ({
			id: g.id ?? 0,
			name: g.name ?? '',
			members: (g.members ?? []).map((m) => {
				const member: SerializableGroup['members'][number] = {
					id: m.id ?? 0,
					first_name: m.first_name ?? '',
					last_name: m.last_name ?? ''
				};
				if (m.email) member.email = m.email;
				if (m.id != null) member.user_id = m.id;
				return member;
			})
		}));
		return { groups };
	} catch (e) {
		console.error('Failed to load groups:', e);
		return { groups: [] as SerializableGroup[] };
	}
};
