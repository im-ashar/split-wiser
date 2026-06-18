import { describe, expect, it } from 'vitest';
import { splitGst, sumGst, toNetForBill } from './gst';

describe('splitGst', () => {
	it('returns the price unchanged when rate is 0', () => {
		const r = splitGst(100, { rate: 0, pricesInclude: false });
		expect(r).toEqual({ net: 100, gst: 0, gross: 100 });
	});

	it('adds tax when prices exclude GST', () => {
		const r = splitGst(100, { rate: 18, pricesInclude: false });
		expect(r.net).toBe(100);
		expect(r.gst).toBe(18);
		expect(r.gross).toBe(118);
	});

	it('extracts tax when prices include GST', () => {
		// 118 incl 18% → net 100, gst 18
		const r = splitGst(118, { rate: 18, pricesInclude: true });
		expect(r.net).toBe(100);
		expect(r.gst).toBe(18);
		expect(r.gross).toBe(118);
	});

	it('rounds each component independently to 2dp', () => {
		// 11.80 incl 18% → 10.0000…/1.7966… → 10.00 / 1.80
		const r = splitGst(11.8, { rate: 18, pricesInclude: true });
		expect(r.net).toBe(10);
		expect(r.gst).toBe(1.8);
		expect(r.gross).toBe(11.8);
	});

	it('returns zeros for non-positive prices', () => {
		expect(splitGst(0, { rate: 18, pricesInclude: false })).toEqual({
			net: 0,
			gst: 0,
			gross: 0
		});
		expect(splitGst(-5, { rate: 18, pricesInclude: false })).toEqual({
			net: 0,
			gst: 0,
			gross: 0
		});
	});
});

describe('sumGst', () => {
	it('sums over multiple line items', () => {
		const r = sumGst([100, 50, 25], { rate: 18, pricesInclude: false });
		expect(r.net).toBe(175);
		expect(r.gst).toBe(31.5);
		expect(r.gross).toBe(206.5);
	});
});

describe('toNetForBill', () => {
	it('passes prices through when rate is 0 (rounded to 2dp)', () => {
		expect(toNetForBill([10.123, 20.5], { rate: 0, pricesInclude: false })).toEqual([10.12, 20.5]);
	});

	it('passes prices through when prices already exclude GST', () => {
		expect(toNetForBill([100, 50], { rate: 18, pricesInclude: false })).toEqual([100, 50]);
	});

	it('strips inclusive GST so bill-level gstPercentage can re-add it', () => {
		// 118 incl 18% → 100 net; bill-level GST 18% then yields 118 again.
		expect(toNetForBill([118, 59], { rate: 18, pricesInclude: true })).toEqual([100, 50]);
	});
});
