import type { Person } from '$lib/types/splitwise';

export interface SplitMultiPersonItemInput {
	price: number;
	discountPercentage?: number | undefined;
	participants: Person[];
	divideAmongSelected: boolean;
}

/**
 * Computes the per-participant amount for a multi-person item, mirroring
 * `addMultiPersonItem` from the Angular HomeComponent:
 *  - When `divideAmongSelected` is true, the price is split equally
 *    (rounded to 2 decimals) among unique participants.
 *  - Otherwise, every participant is charged the full price.
 *  - An optional item-level percentage discount is applied last.
 *  - Duplicate participants (same id) are deduped before splitting.
 */
export function splitMultiPersonItem(input: SplitMultiPersonItemInput): {
	uniqueParticipants: Person[];
	amountPerPerson: number;
} {
	const seen = new Map<number, Person>();
	for (const p of input.participants) {
		if (!seen.has(p.id)) seen.set(p.id, p);
	}
	const uniqueParticipants = Array.from(seen.values());
	if (uniqueParticipants.length === 0 || input.price <= 0) {
		return { uniqueParticipants: [], amountPerPerson: 0 };
	}

	let amountPerPerson = input.divideAmongSelected
		? Number((input.price / uniqueParticipants.length).toFixed(2))
		: input.price;

	const discount = input.discountPercentage ?? 0;
	if (discount > 0) {
		amountPerPerson -= amountPerPerson * (discount / 100);
	}
	return { uniqueParticipants, amountPerPerson };
}
