import type { RequestHandler } from './$types';
import { splitwisify } from 'splitwise-ts';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { readJson, requireSession, respond } from '$lib/server/respond';
import { AppError, NotFoundError } from '$lib/server/errors';
import { updateExpenseSchema } from '$lib/schemas/expenses';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const id = event.params.id;
		if (!id) throw new NotFoundError('Expense id required');
		const client = getClient(event);
		const res = await callSplitwise(() => client.expenses.getExpense(id));
		if (!res.expense) throw new NotFoundError('Expense not found');
		return respond.ok(res.expense);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};

export const PATCH: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const id = event.params.id;
		if (!id) throw new NotFoundError('Expense id required');
		const body = await readJson(event.request, updateExpenseSchema);
		const client = getClient(event);
		const flat = splitwisify(body as never);
		const res = await callSplitwise(() => client.expenses.updateExpense(id, flat as never));
		return respond.ok(res);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const id = event.params.id;
		if (!id) throw new NotFoundError('Expense id required');
		const client = getClient(event);
		const res = await callSplitwise(() => client.expenses.deleteExpense(id));
		return respond.ok(res);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
