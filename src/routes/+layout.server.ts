import type { LayoutServerLoad } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.session) {
		return { isAuthenticated: false, user: null };
	}
	try {
		const client = getClient(event);
		const res = await callSplitwise(() => client.users.getCurrentUser());
		const u = res.user;
		if (!u || u.id == null) {
			return { isAuthenticated: true, user: null };
		}
		const user: NonNullable<App.PageData['user']> = {
			id: u.id,
			firstName: u.first_name ?? '',
			lastName: u.last_name ?? ''
		};
		if (u.email) user.email = u.email;
		if (u.picture?.medium) user.avatar = u.picture.medium;
		return { isAuthenticated: true, user };
	} catch (e) {
		console.error('Failed to load current user:', e);
		return { isAuthenticated: false, user: null };
	}
};
