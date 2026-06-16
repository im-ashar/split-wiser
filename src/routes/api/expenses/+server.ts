import type { RequestHandler } from './$types';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { readJson, readQuery, requireSession, respond } from '$lib/server/respond';
import { AppError, UpstreamError } from '$lib/server/errors';
import {
	createExpenseSchema,
	listExpensesQuerySchema
} from '$lib/schemas/expenses';
import { flattenExpensePayload } from '$lib/split/build-expense-payload';

export const GET: RequestHandler = async (event) => {
	try {
		requireSession(event);
		const params = readQuery(event.url, listExpensesQuerySchema);
		const cleaned: Record<string, number | string> = {};
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined) cleaned[k] = v;
		}
		const client = getClient(event);
		const res = await callSplitwise(() => client.expenses.getExpenses(cleaned as never));
		return respond.ok({ expenses: res.expenses ?? [] });
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};

interface SplitwiseCreateExpenseResponse {
	expenses?: unknown[];
	errors?: Record<string, unknown>;
}

// Splitwise's `create_expense` endpoint expects form-urlencoded fields with
// double-underscore array notation (e.g. `users__0__user_id`). The SDK's
// `splitwisify` helper produces single-underscore keys, which Splitwise
// silently rejects with a 400. We bypass the SDK for this one call and post
// the wire-format the API actually accepts.
export const POST: RequestHandler = async (event) => {
	try {
		const session = requireSession(event);
		const body = await readJson(event.request, createExpenseSchema);
		const flat = flattenExpensePayload(body);

		const form = new URLSearchParams();
		for (const [k, v] of Object.entries(flat)) {
			form.append(k, String(v));
		}

		const upstream = await fetch(
			'https://secure.splitwise.com/api/v3.0/create_expense',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${session.token}`,
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json'
				},
				body: form.toString()
			}
		);

		let json: SplitwiseCreateExpenseResponse;
		try {
			json = (await upstream.json()) as SplitwiseCreateExpenseResponse;
		} catch {
			throw new UpstreamError(`Splitwise returned ${upstream.status} with non-JSON body`);
		}

		if (!upstream.ok) {
			throw new UpstreamError(
				`Splitwise responded ${upstream.status}`,
				json.errors ?? json
			);
		}

		const errors = json.errors;
		if (errors && Object.keys(errors).length > 0) {
			const base = (errors as { base?: unknown[] }).base;
			const message = Array.isArray(base) && base.length > 0
				? String(base[0])
				: 'Splitwise rejected the expense';
			throw new UpstreamError(message, errors);
		}

		return respond.ok({ expenses: json.expenses ?? [] });
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		throw e;
	}
};
