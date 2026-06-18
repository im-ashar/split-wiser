import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getClient, callSplitwise } from '$lib/server/splitwise';

export interface FriendItem {
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
	avatar?: string;
	balance: Array<{ currency: string; amount: number }>;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) throw redirect(302, '/auth/login');
	try {
		const client = getClient(event);
		const res = await callSplitwise(() => client.friends.getFriends());
		const friends: FriendItem[] = (res.friends ?? []).map((f) => {
			const item: FriendItem = {
				id: f.id ?? 0,
				firstName: f.first_name ?? '',
				lastName: f.last_name ?? '',
				balance: (f.balance ?? []).map((b) => ({
					currency: b.currency_code ?? '',
					amount: Number.parseFloat(b.amount ?? '0')
				}))
			};
			if (f.email) item.email = f.email;
			if (f.picture?.medium) item.avatar = f.picture.medium;
			return item;
		});
		return { friends };
	} catch (e) {
		console.error('Friends load failed:', e);
		return { friends: [] as FriendItem[] };
	}
};
