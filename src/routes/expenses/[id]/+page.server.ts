import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { getClient, callSplitwise } from '$lib/server/splitwise';

export interface ExpenseDetail {
	id: number;
	description: string;
	details?: string;
	cost: string;
	currencyCode: string;
	date: string;
	groupId: number | null;
	createdBy: { id: number; firstName: string } | null;
	users: Array<{
		userId: number;
		firstName: string;
		lastName: string;
		paidShare: string;
		owedShare: string;
		netBalance: string;
	}>;
}

export interface CommentItem {
	id: number;
	content: string;
	createdAt: string;
	user: { id: number; firstName: string; lastName: string; avatar?: string };
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) throw redirect(302, '/auth/login');
	const id = event.params.id;
	if (!id) throw error(404, 'Expense not found');

	try {
		const client = getClient(event);
		const [expRes, comRes] = await Promise.all([
			callSplitwise(() => client.expenses.getExpense(id)),
			callSplitwise(() => client.comments.getComments({ expense_id: Number(id) }))
		]);

		const e = expRes.expense;
		if (!e) throw error(404, 'Expense not found');

		const expense: ExpenseDetail = {
			id: e.id ?? 0,
			description: e.description ?? '',
			cost: e.cost ?? '0.00',
			currencyCode: e.currency_code ?? 'PKR',
			date: e.date ?? '',
			groupId: e.group_id ?? null,
			createdBy: e.created_by
				? { id: e.created_by.id ?? 0, firstName: e.created_by.first_name ?? '' }
				: null,
			users: (e.users ?? []).map((u) => ({
				userId: u.user?.id ?? 0,
				firstName: u.user?.first_name ?? '',
				lastName: u.user?.last_name ?? '',
				paidShare: u.paid_share ?? '0.00',
				owedShare: u.owed_share ?? '0.00',
				netBalance: u.net_balance ?? '0.00'
			}))
		};
		if (e.details) expense.details = e.details;

		const comments: CommentItem[] = (comRes.comments ?? []).map((c) => {
			const item: CommentItem = {
				id: c.id ?? 0,
				content: c.content ?? '',
				createdAt: c.created_at ?? '',
				user: {
					id: c.user?.id ?? 0,
					firstName: c.user?.first_name ?? '',
					lastName: c.user?.last_name ?? ''
				}
			};
			if (c.user?.picture?.medium) item.user.avatar = c.user.picture.medium;
			return item;
		});

		return { expense, comments };
	} catch (e) {
		console.error('Expense detail load failed:', e);
		throw error(500, 'Failed to load expense');
	}
};
