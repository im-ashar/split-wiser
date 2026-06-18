import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { requireSession, respond } from '$lib/server/respond';
import { AppError, NotFoundError } from '$lib/server/errors';

export const DELETE: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const id = event.params.id;
		if (!id) throw new NotFoundError('Friend id required');
		const client = getClient(event);
		const res = await callSplitwise(() => client.friends.deleteFriend(id));
		return respond.ok(res);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
