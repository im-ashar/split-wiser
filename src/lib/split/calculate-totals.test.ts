import { describe, expect, it } from 'vitest';
import { calculateTotals } from './calculate-totals';
import type { Person } from '$lib/types/splitwise';

function person(name: string, amounts: number[]): Person {
	return {
		id: name.charCodeAt(0),
		name,
		totalAmount: 0,
		listOfAmounts: amounts.map((amount, i) => ({ id: i, amount }))
	};
}

describe('calculateTotals', () => {
	it('sums amounts with no GST and no discount', () => {
		const r = calculateTotals({
			persons: [person('Ali', [100, 50]), person('Bea', [25])]
		});
		expect(r.persons[0]!.totalAmount).toBe(150);
		expect(r.persons[1]!.totalAmount).toBe(25);
		expect(r.totalBill).toBe(175);
	});

	it('applies GST per line before summing', () => {
		const r = calculateTotals({
			persons: [person('Ali', [100, 50])],
			gstPercentage: 18
		});
		// 100 * 1.18 + 50 * 1.18 = 118 + 59 = 177
		expect(r.persons[0]!.totalAmount).toBeCloseTo(177, 6);
		expect(r.totalBill).toBeCloseTo(177, 6);
	});

	it('applies total-bill discount on the GST-inclusive total', () => {
		const r = calculateTotals({
			persons: [person('Ali', [100])],
			gstPercentage: 18,
			discountOnTotalBill: 10
		});
		// 100 * 1.18 = 118; 118 * 0.9 = 106.2
		expect(r.persons[0]!.totalAmount).toBeCloseTo(106.2, 6);
	});

	it('treats undefined amount entries as zero', () => {
		const r = calculateTotals({
			persons: [
				{
					id: 1,
					name: 'Ali',
					totalAmount: 0,
					listOfAmounts: [
						{ id: 1, amount: undefined },
						{ id: 2, amount: 50 }
					]
				}
			]
		});
		expect(r.persons[0]!.totalAmount).toBe(50);
	});

	it('does not mutate the input persons', () => {
		const input = [person('Ali', [100])];
		const before = JSON.stringify(input);
		calculateTotals({ persons: input, gstPercentage: 18 });
		expect(JSON.stringify(input)).toBe(before);
	});

	it('ignores zero or negative GST and discount percentages', () => {
		const r = calculateTotals({
			persons: [person('Ali', [100])],
			gstPercentage: 0,
			discountOnTotalBill: 0
		});
		expect(r.persons[0]!.totalAmount).toBe(100);
	});

	it('skips GST for rows flagged noGst', () => {
		const p: import('$lib/types/splitwise').Person = {
			id: 1,
			name: 'Ali',
			totalAmount: 0,
			listOfAmounts: [
				{ id: 1, amount: 100 },           // GST applied → 118
				{ id: 2, amount: 50, noGst: true } // GST skipped → 50
			]
		};
		const r = calculateTotals({ persons: [p], gstPercentage: 18 });
		expect(r.persons[0]!.totalAmount).toBeCloseTo(168, 6); // 118 + 50
	});

	it('accepts percentage discount as DiscountValue object', () => {
		const r = calculateTotals({
			persons: [person('Ali', [100])],
			discountOnTotalBill: { value: 10, unit: 'pct' }
		});
		expect(r.persons[0]!.totalAmount).toBeCloseTo(90, 6);
	});

	it('accepts fixed-amount discount, distributed pro-rata', () => {
		// Two people, totals 60 and 40, fixed discount of 10 → factor 0.9 → 54 + 36 = 90
		const r = calculateTotals({
			persons: [person('Ali', [60]), person('Bea', [40])],
			discountOnTotalBill: { value: 10, unit: 'amt' }
		});
		expect(r.persons[0]!.totalAmount).toBeCloseTo(54, 6);
		expect(r.persons[1]!.totalAmount).toBeCloseTo(36, 6);
		expect(r.totalBill).toBeCloseTo(90, 6);
	});

	it('caps a fixed-amount discount at the bill total', () => {
		const r = calculateTotals({
			persons: [person('Ali', [50])],
			discountOnTotalBill: { value: 999, unit: 'amt' }
		});
		expect(r.persons[0]!.totalAmount).toBe(0);
		expect(r.totalBill).toBe(0);
	});
});
