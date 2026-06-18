import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { respond, requireSession } from '$lib/server/respond';
import { AppError } from '$lib/server/errors';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const client = getClient(event);
		const res = await callSplitwise(() => client.groups.getGroups());
		return respond.ok({ groups: res.groups ?? [] });
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
