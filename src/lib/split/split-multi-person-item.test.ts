import { describe, expect, it } from 'vitest';
import { splitMultiPersonItem } from './split-multi-person-item';
import type { Person } from '$lib/types/splitwise';

function p(id: number, name: string): Person {
	return { id, name, totalAmount: 0, listOfAmounts: [] };
}

describe('splitMultiPersonItem', () => {
	it('divides price evenly among unique participants when divide=true', () => {
		const r = splitMultiPersonItem({
			price: 90,
			participants: [p(1, 'A'), p(2, 'B'), p(3, 'C')],
			divideAmongSelected: true
		});
		expect(r.uniqueParticipants).toHaveLength(3);
		expect(r.amountPerPerson).toBe(30);
	});

	it('charges every participant the full price when divide=false', () => {
		const r = splitMultiPersonItem({
			price: 100,
			participants: [p(1, 'A'), p(2, 'B')],
			divideAmongSelected: false
		});
		expect(r.amountPerPerson).toBe(100);
	});

	it('rounds the divided amount to 2 decimals', () => {
		const r = splitMultiPersonItem({
			price: 100,
			participants: [p(1, 'A'), p(2, 'B'), p(3, 'C')],
			divideAmongSelected: true
		});
		// 100 / 3 = 33.3333…  → 33.33
		expect(r.amountPerPerson).toBe(33.33);
	});

	it('applies the item-level percentage discount last', () => {
		const r = splitMultiPersonItem({
			price: 100,
			discountPercentage: 10,
			participants: [p(1, 'A'), p(2, 'B')],
			divideAmongSelected: true
		});
		// 50 - 10% = 45
		expect(r.amountPerPerson).toBe(45);
	});

	it('deduplicates participants by id', () => {
		const r = splitMultiPersonItem({
			price: 90,
			participants: [p(1, 'A'), p(1, 'A'), p(2, 'B'), p(3, 'C')],
			divideAmongSelected: true
		});
		expect(r.uniqueParticipants).toHaveLength(3);
		expect(r.amountPerPerson).toBe(30);
	});

	it('returns 0 when there are no participants', () => {
		const r = splitMultiPersonItem({
			price: 50,
			participants: [],
			divideAmongSelected: true
		});
		expect(r.amountPerPerson).toBe(0);
		expect(r.uniqueParticipants).toEqual([]);
	});

	it('returns 0 when price is 0 or negative', () => {
		const r = splitMultiPersonItem({
			price: 0,
			participants: [p(1, 'A')],
			divideAmongSelected: true
		});
		expect(r.amountPerPerson).toBe(0);
	});
});
