import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { readJson, requireSession, respond } from '$lib/server/respond';
import { AppError } from '$lib/server/errors';
import { createFriendSchema } from '$lib/schemas/friends';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const client = getClient(event);
		const res = await callSplitwise(() => client.friends.getFriends());
		return respond.ok({ friends: res.friends ?? [] });
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};

export const POST: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const body = await readJson(event.request, createFriendSchema);
		const client = getClient(event);
		const res = await callSplitwise(() => client.friends.createFriend(body as never));
		return respond.ok(res);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
