export type RangeDays = 30 | 90 | 365;
export const VALID_RANGES: RangeDays[] = [30, 90, 365];

export function parseRange(value: string | null): RangeDays {
	const n = Number(value);
	if (VALID_RANGES.includes(n as RangeDays)) return n as RangeDays;
	return 30;
}
