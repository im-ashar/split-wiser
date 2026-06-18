import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getClient, callSplitwise } from '$lib/server/splitwise';

export interface NotificationItem {
	id: number;
	createdAt: string;
	imageUrl?: string;
	content: string;
	sourceUrl?: string;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) throw redirect(302, '/auth/login');
	try {
		const client = getClient(event);
		const res = await callSplitwise(() => client.notifications.getNotifications({ limit: 50 }));
		const notifications: NotificationItem[] = (res.notifications ?? []).map((n) => {
			const item: NotificationItem = {
				id: n.id ?? 0,
				createdAt: n.created_at ?? '',
				content: n.content ?? ''
			};
			if (n.image_url) item.imageUrl = n.image_url;
			if (n.source?.url) item.sourceUrl = n.source.url;
			return item;
		});
		return { notifications };
	} catch (e) {
		console.error('Notifications load failed:', e);
		return { notifications: [] as NotificationItem[] };
	}
};
