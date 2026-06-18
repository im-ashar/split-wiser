import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { respond, requireSession } from '$lib/server/respond';
import { AppError, NotFoundError } from '$lib/server/errors';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const client = getClient(event);
		const id = event.params.id;
		if (!id) throw new NotFoundError('Group id required');
		const res = await callSplitwise(() => client.groups.getGroup(id));
		if (!res.group) throw new NotFoundError('Group not found');
		return respond.ok(res.group);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
