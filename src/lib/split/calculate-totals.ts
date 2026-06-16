import type { Person } from '$lib/types/splitwise';

export interface CalculateTotalsInput {
	persons: Person[];
	gstPercentage?: number | undefined;
	discountOnTotalBill?: number | undefined;
}

export interface CalculateTotalsResult {
	persons: Person[];
	totalBill: number;
}

/**
 * Mirrors the bill-calculation logic from the Angular HomeComponent:
 *   1. If a GST % is set, each line amount has GST added before being summed.
 *   2. If a total-bill discount % is set, each person's accumulated total is
 *      reduced by that percentage.
 *   3. The grand total is the sum of every person's final total.
 *
 * Inputs are not mutated; new Person objects are returned so Svelte's runes
 * pick up the change.
 */
export function calculateTotals(input: CalculateTotalsInput): CalculateTotalsResult {
	const gst = input.gstPercentage;
	const discount = input.discountOnTotalBill;
	const hasGst = typeof gst === 'number' && gst > 0;
	const hasDiscount = typeof discount === 'number' && discount > 0;

	const persons = input.persons.map((person) => {
		let total = 0;
		if (hasGst) {
			for (const row of person.listOfAmounts) {
				const amount = row.amount ?? 0;
				const gstAmount = amount * ((gst as number) / 100);
				total += amount + gstAmount;
			}
		} else {
			for (const row of person.listOfAmounts) {
				total += row.amount ?? 0;
			}
		}
		if (hasDiscount) {
			total -= total * ((discount as number) / 100);
		}
		return { ...person, totalAmount: total };
	});

	const totalBill = persons.reduce((sum, p) => sum + p.totalAmount, 0);
	return { persons, totalBill };
}
