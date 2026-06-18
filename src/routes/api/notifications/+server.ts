import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { requireSession, respond } from '$lib/server/respond';
import { AppError } from '$lib/server/errors';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const client = getClient(event);
		const limitParam = event.url.searchParams.get('limit');
		const params = limitParam ? { limit: Number(limitParam) } : {};
		const res = await callSplitwise(() => client.notifications.getNotifications(params));
		return respond.ok({ notifications: res.notifications ?? [] });
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
