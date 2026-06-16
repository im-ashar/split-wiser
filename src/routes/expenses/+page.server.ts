import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getClient, callSplitwise } from '$lib/server/splitwise';

export interface ExpenseSummary {
	id: number;
	description: string;
	cost: string;
	currencyCode: string;
	date: string;
	groupId: number | null;
	createdBy: {
		id: number;
		firstName: string;
	} | null;
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) throw redirect(302, '/auth/login');
	try {
		const client = getClient(event);
		const res = await callSplitwise(() => client.expenses.getExpenses({ limit: 50 }));
		const expenses: ExpenseSummary[] = (res.expenses ?? []).map((e) => ({
			id: e.id ?? 0,
			description: e.description ?? '',
			cost: e.cost ?? '0.00',
			currencyCode: e.currency_code ?? 'PKR',
			date: e.date ?? '',
			groupId: e.group_id ?? null,
			createdBy: e.created_by
				? {
						id: e.created_by.id ?? 0,
						firstName: e.created_by.first_name ?? ''
					}
				: null
		}));
		return { expenses };
	} catch (e) {
		console.error('Expenses load failed:', e);
		return { expenses: [] as ExpenseSummary[] };
	}
};
