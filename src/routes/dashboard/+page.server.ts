import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getClient, callSplitwise } from '$lib/server/splitwise';

export interface DashboardGroup {
	id: number;
	name: string;
	memberCount: number;
	netByCurrency: Array<{ currency: string; amount: number }>;
}

export interface DashboardData {
	totals: Array<{ currency: string; amount: number }>;
	groups: DashboardGroup[];
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) {
		throw redirect(302, '/auth/login');
	}
	try {
		const client = getClient(event);
		const [meRes, groupsRes] = await Promise.all([
			callSplitwise(() => client.users.getCurrentUser()),
			callSplitwise(() => client.groups.getGroups())
		]);
		const myId = meRes.user?.id ?? null;
		const groups = (groupsRes.groups ?? []).map((g) => {
			const me = (g.members ?? []).find((m) => m.id === myId);
			const balances = me?.balance ?? [];
			return {
				id: g.id ?? 0,
				name: g.name ?? 'Group',
				memberCount: g.members?.length ?? 0,
				netByCurrency: balances.map((b) => ({
					currency: b.currency_code ?? '',
					amount: Number.parseFloat(b.amount ?? '0')
				}))
			} satisfies DashboardGroup;
		});

		const totalsMap = new Map<string, number>();
		for (const g of groups) {
			for (const bal of g.netByCurrency) {
				if (!bal.currency) continue;
				totalsMap.set(bal.currency, (totalsMap.get(bal.currency) ?? 0) + bal.amount);
			}
		}
		const totals = Array.from(totalsMap.entries()).map(([currency, amount]) => ({
			currency,
			amount
		}));

		return { dashboard: { totals, groups } satisfies DashboardData };
	} catch (e) {
		console.error('Dashboard load failed:', e);
		return { dashboard: { totals: [], groups: [] } satisfies DashboardData };
	}
};
