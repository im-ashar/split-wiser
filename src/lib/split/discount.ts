/**
 * A discount value can be either a percentage of the base amount,
 * or a fixed amount in the same currency.
 */
export type DiscountValue = { value: number; unit: 'pct' | 'amt' };

export const ZERO_DISCOUNT: DiscountValue = { value: 0, unit: 'pct' };

/**
 * Apply a discount to an amount. Returns the amount unchanged when the
 * discount value is non-positive. Result never goes below zero.
 */
export function applyDiscount(amount: number, d: DiscountValue | undefined): number {
	if (!d || !Number.isFinite(d.value) || d.value <= 0) return amount;
	if (!Number.isFinite(amount) || amount <= 0) return amount;
	if (d.unit === 'pct') {
		return Math.max(0, amount * (1 - d.value / 100));
	}
	return Math.max(0, amount - d.value);
}

/**
 * Returns the absolute discount amount the value represents against `base`.
 * Useful for showing "you save $X" hints next to a percentage.
 */
export function discountAmount(base: number, d: DiscountValue | undefined): number {
	if (!d || !Number.isFinite(d.value) || d.value <= 0) return 0;
	if (!Number.isFinite(base) || base <= 0) return 0;
	if (d.unit === 'pct') return Math.min(base, base * (d.value / 100));
	return Math.min(base, d.value);
}
