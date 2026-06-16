export function formatMoney(value: number, currency = 'PKR'): string {
	const safe = Number.isFinite(value) ? value : 0;
	try {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(safe);
	} catch {
		return `${currency} ${safe.toFixed(2)}`;
	}
}

export function round2(value: number): number {
	return Math.round(value * 100) / 100;
}
