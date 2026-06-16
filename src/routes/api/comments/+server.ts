import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import {
	readJson,
	readQuery,
	requireSession,
	respond
} from '$lib/server/respond';
import { AppError } from '$lib/server/errors';
import {
	createCommentSchema,
	listCommentsQuerySchema
} from '$lib/schemas/comments';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const params = readQuery(event.url, listCommentsQuerySchema);
		const client = getClient(event);
		const res = await callSplitwise(() => client.comments.getComments(params));
		return respond.ok({ comments: res.comments ?? [] });
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};

export const POST: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const body = await readJson(event.request, createCommentSchema);
		const client = getClient(event);
		const res = await callSplitwise(() => client.comments.createComment(body as never));
		return respond.ok(res);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
