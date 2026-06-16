import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getClient, callSplitwise } from '$lib/server/splitwise';
import { parseRange, type RangeDays } from './range';

export interface DashboardGroup {
	id: number;
	name: string;
	memberCount: number;
	netByCurrency: Array<{ currency: string; amount: number }>;
}

export interface SeriesPoint {
	date: string; // YYYY-MM-DD
	amount: number;
}

export interface CategorySlice {
	categoryId: number;
	name: string;
	amount: number;
}

export interface GroupSpend {
	groupId: number;
	name: string;
	amount: number;
}

export interface PersonSpend {
	userId: number;
	name: string;
	avatar?: string;
	amount: number;
}

export interface SpendingSummary {
	currency: string;
	range: RangeDays;
	yourShare: SeriesPoint[];
	totalSpent: number;
	billCount: number;
	avgBill: number;
	byCategory: CategorySlice[];
	byGroup: GroupSpend[];
	topPeople: PersonSpend[];
}

export interface DashboardData {
	totals: Array<{ currency: string; amount: number }>;
	groups: DashboardGroup[];
	spending: SpendingSummary | null;
}

function isoDate(d: Date): string {
	const yyyy = d.getUTCFullYear();
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(d.getUTCDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

function fullName(first?: string, last?: string | null): string {
	return `${first ?? ''} ${last ?? ''}`.trim() || 'Unknown';
}

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session) {
		throw redirect(302, '/auth/login');
	}

	const range = parseRange(event.url.searchParams.get('range'));
	const now = new Date();
	const rangeStart = new Date(now);
	rangeStart.setUTCDate(rangeStart.getUTCDate() - range + 1);
	rangeStart.setUTCHours(0, 0, 0, 0);

	try {
		const client = getClient(event);
		const [meRes, groupsRes, expensesRes] = await Promise.all([
			callSplitwise(() => client.users.getCurrentUser()),
			callSplitwise(() => client.groups.getGroups()),
			callSplitwise(() =>
				client.expenses.getExpenses({
					dated_after: rangeStart.toISOString(),
					limit: 200
				} as never)
			)
		]);

		const me = meRes.user as
			| {
					id?: number;
					default_currency?: string;
			  }
			| undefined;
		const myId = me?.id ?? null;
		const defaultCurrency = me?.default_currency ?? null;

		const groups: DashboardGroup[] = (groupsRes.groups ?? []).map((g) => {
			const member = (g.members ?? []).find((m) => m.id === myId);
			const balances = member?.balance ?? [];
			return {
				id: g.id ?? 0,
				name: g.name ?? 'Group',
				memberCount: g.members?.length ?? 0,
				netByCurrency: balances.map((b) => ({
					currency: b.currency_code ?? '',
					amount: Number.parseFloat(b.amount ?? '0')
				}))
			};
		});

		const totalsMap = new Map<string, number>();
		for (const g of groups) {
			for (const bal of g.netByCurrency) {
				if (!bal.currency) continue;
				totalsMap.set(
					bal.currency,
					(totalsMap.get(bal.currency) ?? 0) + bal.amount
				);
			}
		}
		const totals = Array.from(totalsMap.entries()).map(([currency, amount]) => ({
			currency,
			amount
		}));

		// Pre-process expenses: drop deleted + payments.
		const allExpenses = (expensesRes.expenses ?? []).filter(
			(e) => !e.deleted_at && e.payment !== true
		);

		// Pick chart currency: user's default if it has data, otherwise the
		// most-used currency in the period.
		const currencyCounts = new Map<string, number>();
		for (const e of allExpenses) {
			const c = e.currency_code ?? '';
			if (!c) continue;
			currencyCounts.set(c, (currencyCounts.get(c) ?? 0) + 1);
		}
		let chartCurrency: string | null = null;
		if (defaultCurrency && currencyCounts.has(defaultCurrency)) {
			chartCurrency = defaultCurrency;
		} else {
			let max = 0;
			for (const [c, n] of currencyCounts.entries()) {
				if (n > max) {
					max = n;
					chartCurrency = c;
				}
			}
		}

		let spending: SpendingSummary | null = null;
		if (chartCurrency && myId != null) {
			const expenses = allExpenses.filter((e) => e.currency_code === chartCurrency);

			const dailyMap = new Map<string, number>();
			let totalSpent = 0;
			let billCount = 0;

			const byCategoryMap = new Map<number, { name: string; amount: number }>();
			const byGroupMap = new Map<number, { name: string; amount: number }>();
			const byPersonMap = new Map<
				number,
				{ name: string; avatar?: string; amount: number }
			>();

			const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

			for (const e of expenses) {
				const myRow = (e.users ?? []).find((u) => u.user?.id === myId);
				const myShare = Number.parseFloat(myRow?.owed_share ?? '0');
				if (!Number.isFinite(myShare) || myShare <= 0) continue;

				billCount += 1;
				totalSpent += myShare;

				const dateStr = (e.date ?? '').slice(0, 10);
				if (dateStr) {
					dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + myShare);
				}

				const catId = e.category?.id ?? e.category_id ?? 0;
				const catName = e.category?.name ?? 'Other';
				const existingCat = byCategoryMap.get(catId);
				if (existingCat) existingCat.amount += myShare;
				else byCategoryMap.set(catId, { name: catName, amount: myShare });

				const gId = e.group_id ?? 0;
				if (gId) {
					const gName = groupNameById.get(gId) ?? 'Group';
					const existingGroup = byGroupMap.get(gId);
					if (existingGroup) existingGroup.amount += myShare;
					else byGroupMap.set(gId, { name: gName, amount: myShare });
				}

				for (const u of e.users ?? []) {
					const uid = u.user?.id;
					if (!uid || uid === myId) continue;
					const share = Number.parseFloat(u.owed_share ?? '0');
					if (!Number.isFinite(share) || share <= 0) continue;
					const existing = byPersonMap.get(uid);
					const name = fullName(u.user?.first_name, u.user?.last_name);
					const avatar = u.user?.picture?.medium;
					if (existing) {
						existing.amount += share;
					} else {
						const entry: { name: string; avatar?: string; amount: number } = {
							name,
							amount: share
						};
						if (avatar) entry.avatar = avatar;
						byPersonMap.set(uid, entry);
					}
				}
			}

			// Fill in zero-days so the area chart is continuous.
			const series: SeriesPoint[] = [];
			const cursor = new Date(rangeStart);
			for (let i = 0; i < range; i++) {
				const key = isoDate(cursor);
				series.push({ date: key, amount: dailyMap.get(key) ?? 0 });
				cursor.setUTCDate(cursor.getUTCDate() + 1);
			}

			const byCategory: CategorySlice[] = Array.from(byCategoryMap.entries())
				.map(([categoryId, v]) => ({ categoryId, name: v.name, amount: v.amount }))
				.sort((a, b) => b.amount - a.amount);

			const byGroup: GroupSpend[] = Array.from(byGroupMap.entries())
				.map(([groupId, v]) => ({ groupId, name: v.name, amount: v.amount }))
				.sort((a, b) => b.amount - a.amount);

			const topPeople: PersonSpend[] = Array.from(byPersonMap.entries())
				.map(([userId, v]) => {
					const entry: PersonSpend = {
						userId,
						name: v.name,
						amount: v.amount
					};
					if (v.avatar) entry.avatar = v.avatar;
					return entry;
				})
				.sort((a, b) => b.amount - a.amount)
				.slice(0, 5);

			spending = {
				currency: chartCurrency,
				range,
				yourShare: series,
				totalSpent,
				billCount,
				avgBill: billCount > 0 ? totalSpent / billCount : 0,
				byCategory,
				byGroup,
				topPeople
			};
		}

		return {
			dashboard: { totals, groups, spending } satisfies DashboardData,
			range
		};
	} catch (e) {
		console.error('Dashboard load failed:', e);
		return {
			dashboard: { totals: [], groups: [], spending: null } satisfies DashboardData,
			range
		};
	}
};
