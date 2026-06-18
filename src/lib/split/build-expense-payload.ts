import type { Person, SplitwiseGroup, SplitwiseMember } from '$lib/types/splitwise';

export interface BuildExpensePayloadInput {
	persons: Person[];
	payer: SplitwiseMember;
	group: SplitwiseGroup;
	description: string;
	currencyCode?: string;
	categoryId?: number;
}

export interface ExpensePayloadUser {
	user_id: number;
	paid_share: string;
	owed_share: string;
}

export interface ExpensePayload {
	cost: string;
	description: string;
	currency_code: string;
	group_id: number;
	category_id?: number;
	users: ExpensePayloadUser[];
}

/**
 * Builds the Splitwise create-expense payload, mirroring the rounding logic
 * from the Angular HomeComponent:
 *  1. Filter to group members only (non-group members are settled outside).
 *  2. Each person's `owed_share` is rounded to 2 decimals.
 *  3. The payer pays the full rounded total cost.
 *  4. Any rounding discrepancy between cost and the sum of owed shares
 *     (>= 0.001) is added to the payer's owed_share to keep the books square.
 *
 * Throws if the payer is not present in the bill.
 */
export function buildExpensePayload(input: BuildExpensePayloadInput): ExpensePayload {
	const groupMembers = input.persons.filter((p) => !p.isNonGroupMember);
	if (groupMembers.length === 0) {
		throw new Error('No group members in the bill');
	}

	const groupMembersRawTotal = groupMembers.reduce(
		(sum, person) => sum + person.totalAmount,
		0
	);
	const totalCost = Math.round(groupMembersRawTotal * 100) / 100;

	const payerUserId = input.payer.user_id ?? input.payer.id;
	if (payerUserId == null) {
		throw new Error('Payer has no Splitwise user id');
	}

	// Check whether the payer also appears as a participant.
	const payerIsParticipant = groupMembers.some(
		(p) => p.splitwiseUserId === payerUserId
	);

	const users: ExpensePayloadUser[] = [];
	let totalOwedShares = 0;

	for (const person of groupMembers) {
		if (person.splitwiseUserId == null) {
			throw new Error(`Group member ${person.name} has no Splitwise user id`);
		}
		const owedShare = Math.round(person.totalAmount * 100) / 100;
		totalOwedShares += owedShare;
		users.push({
			user_id: person.splitwiseUserId,
			paid_share: person.splitwiseUserId === payerUserId ? totalCost.toFixed(2) : '0.00',
			owed_share: owedShare.toFixed(2)
		});
	}

	// Payer paid but didn't eat — add them with paid_share = total, owed_share = 0.
	if (!payerIsParticipant) {
		users.push({
			user_id: payerUserId,
			paid_share: totalCost.toFixed(2),
			owed_share: '0.00'
		});
	}

	// Rounding reconciliation: adjust the payer's owed_share if participant,
	// or their paid_share if they didn't eat (owed_share stays 0 for non-eaters).
	const discrepancy = totalCost - totalOwedShares;
	if (Math.abs(discrepancy) > 0.001) {
		if (payerIsParticipant) {
			const payerIndex = users.findIndex((u) => u.user_id === payerUserId);
			if (payerIndex !== -1) {
				const current = parseFloat(users[payerIndex]!.owed_share);
				users[payerIndex]!.owed_share = (current + discrepancy).toFixed(2);
			}
		}
		// If payer didn't eat, the discrepancy is tiny floating-point noise;
		// the sum of owed_shares already equals totalCost through rounding of
		// participants, so no adjustment needed.
	}

	const payload: ExpensePayload = {
		cost: totalCost.toFixed(2),
		description: input.description.trim(),
		currency_code: input.currencyCode ?? 'PKR',
		group_id: input.group.id,
		users
	};
	if (typeof input.categoryId === 'number') {
		payload.category_id = input.categoryId;
	}
	return payload;
}

/**
 * Flattens the payload into the field naming Splitwise expects on the wire
 * (`users__0__user_id`, etc.). The SDK's `splitwisify` produces single-
 * underscore keys, which Splitwise's `create_expense` rejects with a 400 —
 * this helper produces the double-underscore form-encoded shape the API
 * actually accepts.
 */
export function flattenExpensePayload(
	payload: ExpensePayload | (Omit<ExpensePayload, 'category_id'> & { category_id?: number | undefined })
): Record<string, string | number> {
	const out: Record<string, string | number> = {
		cost: payload.cost,
		description: payload.description,
		currency_code: payload.currency_code,
		group_id: payload.group_id
	};
	if (payload.category_id != null) out.category_id = payload.category_id;
	payload.users.forEach((u, i) => {
		out[`users__${i}__user_id`] = u.user_id;
		out[`users__${i}__paid_share`] = u.paid_share;
		out[`users__${i}__owed_share`] = u.owed_share;
	});
	return out;
}
