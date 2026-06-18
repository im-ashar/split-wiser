import type { Person } from '$lib/types/splitwise';
import type { DiscountValue } from './discount';

export interface CalculateTotalsInput {
	persons: Person[];
	gstPercentage?: number | undefined;
	/**
	 * Discount applied to each person's GST-inclusive total.
	 *  - `number` (legacy) is treated as a percentage.
	 *  - `DiscountValue` supports either percentage or a fixed currency amount,
	 *    where the fixed amount is distributed pro-rata across people.
	 */
	discountOnTotalBill?: number | DiscountValue | undefined;
}

export interface CalculateTotalsResult {
	persons: Person[];
	totalBill: number;
}

function normalizeDiscount(d: number | DiscountValue | undefined): DiscountValue | undefined {
	if (d == null) return undefined;
	if (typeof d === 'number') return d > 0 ? { value: d, unit: 'pct' } : undefined;
	return d.value > 0 ? d : undefined;
}

/**
 *   1. If a GST % is set, each line amount has GST added before being summed
 *      (rows flagged `noGst` are exempted).
 *   2. If a bill-level discount is set, every person's accumulated total is
 *      reduced. A percentage applies the same fraction to each person; a
 *      fixed amount is distributed pro-rata across the bill so the grand
 *      total drops by exactly that amount.
 *   3. Pure: inputs are not mutated; new Person objects are returned so
 *      Svelte's runes pick up the change.
 */
export function calculateTotals(input: CalculateTotalsInput): CalculateTotalsResult {
	const gst = input.gstPercentage;
	const discount = normalizeDiscount(input.discountOnTotalBill);
	const hasGst = typeof gst === 'number' && gst > 0;

	// Pass 1: compute each person's GST-inclusive subtotal.
	const subtotals = input.persons.map((person) => {
		let total = 0;
		if (hasGst) {
			for (const row of person.listOfAmounts) {
				const amount = row.amount ?? 0;
				if (row.noGst) {
					total += amount;
				} else {
					total += amount + amount * ((gst as number) / 100);
				}
			}
		} else {
			for (const row of person.listOfAmounts) {
				total += row.amount ?? 0;
			}
		}
		return total;
	});

	const grossTotal = subtotals.reduce((s, x) => s + x, 0);

	// Compute scale factor for the bill-level discount.
	let factor = 1;
	if (discount && grossTotal > 0) {
		if (discount.unit === 'pct') {
			factor = Math.max(0, 1 - discount.value / 100);
		} else {
			// Fixed amount discount distributed pro-rata.
			factor = Math.max(0, 1 - Math.min(grossTotal, discount.value) / grossTotal);
		}
	}

	const persons = input.persons.map((person, i) => ({
		...person,
		totalAmount: (subtotals[i] ?? 0) * factor
	}));

	const totalBill = persons.reduce((sum, p) => sum + p.totalAmount, 0);
	return { persons, totalBill };
}
