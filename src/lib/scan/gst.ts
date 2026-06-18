/**
 * GST math for the receipt-scan flow.
 *
 * Receipts come in three shapes:
 *   1. Tax-exclusive prices + a separate GST line (net + tax = gross)
 *   2. Tax-inclusive prices ("$11.80 incl. 18% GST")
 *   3. No GST mentioned at all
 *
 * The user picks a single rate + an "inclusive" flag for the whole receipt;
 * each line item is just a gross price. From those we derive net, tax, gross.
 */

export interface GstParts {
	net: number;
	gst: number;
	gross: number;
}

export interface GstSettings {
	rate: number; // percentage, e.g. 18 for 18%
	pricesInclude: boolean; // true = displayed prices already include GST
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Returns net / gst / gross for a single line price under the given settings.
 *
 *  - When prices include GST, the displayed price is the gross.
 *  - When prices exclude GST, the displayed price is the net.
 *  - A non-positive rate returns the price unchanged with zero tax.
 *  - Values are independently rounded to 2dp; callers that need a perfectly
 *    balanced sum should reconcile at the totals level.
 */
export function splitGst(price: number, settings: GstSettings): GstParts {
	if (!Number.isFinite(price) || price <= 0) {
		return { net: 0, gst: 0, gross: 0 };
	}
	const rate = Number.isFinite(settings.rate) ? settings.rate : 0;
	if (rate <= 0) {
		const v = round2(price);
		return { net: v, gst: 0, gross: v };
	}
	if (settings.pricesInclude) {
		const gross = price;
		const net = gross / (1 + rate / 100);
		return {
			net: round2(net),
			gst: round2(gross - net),
			gross: round2(gross)
		};
	}
	const net = price;
	const gst = net * (rate / 100);
	return {
		net: round2(net),
		gst: round2(gst),
		gross: round2(net + gst)
	};
}

export interface ItemTotals {
	net: number;
	gst: number;
	gross: number;
}

/** Sums splitGst across an array of prices. */
export function sumGst(
	prices: number[],
	settings: GstSettings
): ItemTotals {
	let net = 0;
	let gst = 0;
	let gross = 0;
	for (const p of prices) {
		const parts = splitGst(p, settings);
		net += parts.net;
		gst += parts.gst;
		gross += parts.gross;
	}
	return { net: round2(net), gst: round2(gst), gross: round2(gross) };
}

/**
 * Converts a list of gross prices into the *net* values that should be
 * pushed into a person's `listOfAmounts`. The bill-level `gstPercentage`
 * should then be set so the existing `calculateTotals` reconstructs the
 * correct gross.
 *
 *  - Inclusive prices: gross / (1 + rate/100)
 *  - Exclusive or no-GST: returned unchanged
 */
export function toNetForBill(prices: number[], settings: GstSettings): number[] {
	if (settings.rate <= 0 || !settings.pricesInclude) {
		return prices.map((p) => round2(p));
	}
	const factor = 1 + settings.rate / 100;
	return prices.map((p) => round2(p / factor));
}
