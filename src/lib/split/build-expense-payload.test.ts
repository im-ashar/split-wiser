import { describe, expect, it } from 'vitest';
import {
	buildExpensePayload,
	flattenExpensePayload
} from './build-expense-payload';
import type { Person, SplitwiseGroup, SplitwiseMember } from '$lib/types/splitwise';

function member(id: number, first: string): SplitwiseMember {
	return { id, first_name: first, last_name: '', user_id: id };
}

function person(
	id: number,
	name: string,
	total: number,
	splitwiseUserId?: number,
	isNonGroupMember = false
): Person {
	const p: Person = {
		id,
		name,
		totalAmount: total,
		listOfAmounts: []
	};
	if (splitwiseUserId !== undefined) p.splitwiseUserId = splitwiseUserId;
	if (isNonGroupMember) p.isNonGroupMember = true;
	return p;
}

const group: SplitwiseGroup = {
	id: 999,
	name: 'Test',
	members: []
};

describe('buildExpensePayload', () => {
	it('produces a balanced payload with no rounding discrepancy', () => {
		const payer = member(1, 'Ali');
		const payload = buildExpensePayload({
			persons: [person(1, 'Ali', 50, 1), person(2, 'Bea', 50, 2)],
			payer,
			group,
			description: 'Dinner'
		});
		expect(payload.cost).toBe('100.00');
		expect(payload.users).toHaveLength(2);
		const total = payload.users.reduce((s, u) => s + Number(u.owed_share), 0);
		expect(total).toBeCloseTo(100, 6);
		const aliRow = payload.users.find((u) => u.user_id === 1)!;
		expect(aliRow.paid_share).toBe('100.00');
		expect(aliRow.owed_share).toBe('50.00');
	});

	it('reconciles rounding discrepancy onto the payer', () => {
		// 33.333... × 3 = 100.00 but rounded to 2dp gives 33.33 × 3 = 99.99,
		// so the payer should absorb +0.01 on their owed_share.
		const payer = member(1, 'Ali');
		const payload = buildExpensePayload({
			persons: [
				person(1, 'Ali', 100 / 3, 1),
				person(2, 'Bea', 100 / 3, 2),
				person(3, 'Cy', 100 / 3, 3)
			],
			payer,
			group,
			description: 'Pizza'
		});
		expect(payload.cost).toBe('100.00');

		const sumOwed = payload.users.reduce((s, u) => s + Number(u.owed_share), 0);
		expect(sumOwed).toBeCloseTo(100, 6);

		const aliRow = payload.users.find((u) => u.user_id === 1)!;
		const beaRow = payload.users.find((u) => u.user_id === 2)!;
		const cyRow = payload.users.find((u) => u.user_id === 3)!;
		// payer absorbs the +0.01 leftover
		expect(aliRow.owed_share).toBe('33.34');
		expect(beaRow.owed_share).toBe('33.33');
		expect(cyRow.owed_share).toBe('33.33');
		expect(aliRow.paid_share).toBe('100.00');
	});

	it('allows payer who is not a participant (paid but did not eat)', () => {
		// Payer id=99 is not in persons; should be added with paid_share=total, owed_share=0.
		const sponsor = member(99, 'Sponsor');
		const payload = buildExpensePayload({
			persons: [person(1, 'Ali', 50, 1), person(2, 'Bea', 50, 2)],
			payer: sponsor,
			group,
			description: 'Dinner'
		});
		expect(payload.cost).toBe('100.00');
		// 3 users: Ali, Bea, and the non-eating payer
		expect(payload.users).toHaveLength(3);
		const sponsorRow = payload.users.find((u) => u.user_id === 99)!;
		expect(sponsorRow.paid_share).toBe('100.00');
		expect(sponsorRow.owed_share).toBe('0.00');
		// Ali and Bea are not the payer
		const aliRow = payload.users.find((u) => u.user_id === 1)!;
		expect(aliRow.paid_share).toBe('0.00');
		expect(aliRow.owed_share).toBe('50.00');
	});

	it('throws when there are no group members', () => {
		const payer = member(1, 'Ali');
		expect(() =>
			buildExpensePayload({
				persons: [person(1, 'X', 50, undefined, true)],
				payer,
				group,
				description: 'Bill'
			})
		).toThrow();
	});

	it('matches payer by either id or user_id', () => {
		// Some Splitwise responses use member.id, others user_id; both must work.
		const payer: SplitwiseMember = {
			id: 50,
			first_name: 'Ali',
			last_name: '',
			user_id: 1
		};
		const payload = buildExpensePayload({
			persons: [person(1, 'Ali', 50, 1), person(2, 'Bea', 50, 2)],
			payer,
			group,
			description: 'Lunch'
		});
		const aliRow = payload.users.find((u) => u.user_id === 1)!;
		expect(aliRow.paid_share).toBe('100.00');
	});

	it('excludes non-group members from the payload', () => {
		const payer = member(1, 'Ali');
		const payload = buildExpensePayload({
			persons: [
				person(1, 'Ali', 50, 1),
				person(2, 'Bea', 50, 2),
				person(99, 'Visitor', 25, undefined, true)
			],
			payer,
			group,
			description: 'Brunch'
		});
		expect(payload.users).toHaveLength(2);
		expect(payload.users.find((u) => u.user_id === 99)).toBeUndefined();
		// The visitor's 25 is settled in cash; cost = 50 + 50 = 100.
		expect(payload.cost).toBe('100.00');
	});
});

describe('flattenExpensePayload', () => {
	it('flattens users into the wire format Splitwise expects', () => {
		const flat = flattenExpensePayload({
			cost: '100.00',
			description: 'X',
			currency_code: 'PKR',
			group_id: 7,
			users: [
				{ user_id: 1, paid_share: '100.00', owed_share: '50.00' },
				{ user_id: 2, paid_share: '0.00', owed_share: '50.00' }
			]
		});
		expect(flat).toMatchObject({
			cost: '100.00',
			description: 'X',
			currency_code: 'PKR',
			group_id: 7,
			users__0__user_id: 1,
			users__0__paid_share: '100.00',
			users__0__owed_share: '50.00',
			users__1__user_id: 2,
			users__1__paid_share: '0.00',
			users__1__owed_share: '50.00'
		});
	});
});
