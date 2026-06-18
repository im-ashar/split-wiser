import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { requireSession, respond } from '$lib/server/respond';
import { AppError } from '$lib/server/errors';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const client = getClient(event);
		const res = await callSplitwise(() => client.other.getCurrencies());
		return respond.ok({ currencies: res.currencies ?? [] }, {
			headers: { 'cache-control': 'private, max-age=86400' }
		});
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
