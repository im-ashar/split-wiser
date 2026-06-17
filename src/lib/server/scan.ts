import { z } from 'zod';
import { env } from './env';
import { UpstreamError } from './errors';

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTIONS = `You read photos of receipts and bills. Extract every line item the customer was actually charged for and the totals printed on the receipt.

RULES:
- Each item must be a thing being purchased. Skip subtotal, total, GST/VAT/tax, service charge, tip, discount, change, and anything that is not a sellable line item.
- "name" is the item description as printed (clean it up, no quantity prefixes like "2x" — fold quantity into a separate line if printed twice, otherwise multiply price by quantity).
- "price" is the displayed price for that line as printed on the receipt (so quantity × unit price if a multiplier was printed). Do NOT add or remove tax — return what is shown.
- "currency" is the ISO-4217 code if visible (USD, EUR, PKR, INR, GBP, AED, etc.). Use null if you cannot tell.
- "gstRate" is the percentage rate (e.g. 18 for 18%) if a tax line names a rate. Use null if no rate is shown.
- "pricesInclude":
    - "gst"      → if the receipt says "incl. GST", "tax included", "VAT inclusive", or similar.
    - "no-gst"   → if there is a separate GST/tax line summed on top of an itemised subtotal.
    - "unknown"  → if it is unclear or no tax is mentioned.
- "subtotal" and "total" are the printed numbers if you can see them, else null.
- If the image is not a receipt or you cannot read prices, return an empty items array.`;

const RESPONSE_SCHEMA = {
	type: 'object',
	properties: {
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					price: { type: 'number' }
				},
				required: ['name', 'price']
			}
		},
		currency: { type: 'string', nullable: true },
		gstRate: { type: 'number', nullable: true },
		pricesInclude: { type: 'string', enum: ['gst', 'no-gst', 'unknown'] },
		subtotal: { type: 'number', nullable: true },
		total: { type: 'number', nullable: true }
	},
	required: ['items', 'pricesInclude']
} as const;

export const receiptScanSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().min(1).max(120),
				price: z.number().finite()
			})
		)
		.max(200),
	currency: z.string().nullish().transform((v) => v ?? null),
	gstRate: z.number().finite().nullish().transform((v) => v ?? null),
	pricesInclude: z.enum(['gst', 'no-gst', 'unknown']),
	subtotal: z.number().finite().nullish().transform((v) => v ?? null),
	total: z.number().finite().nullish().transform((v) => v ?? null)
});

export type ReceiptScanResult = z.infer<typeof receiptScanSchema>;

interface GeminiCandidate {
	content?: {
		parts?: Array<{ text?: string }>;
	};
}

interface GeminiResponse {
	candidates?: GeminiCandidate[];
	error?: { message?: string; code?: number };
	promptFeedback?: { blockReason?: string };
}

export function isScanConfigured(): boolean {
	return env.geminiApiKey !== null;
}

/**
 * Sends a base64-encoded image to Gemini and returns the validated parsed
 * receipt. Throws UpstreamError on any failure so callers can render a
 * stable error envelope.
 */
export async function scanReceipt(
	imageBase64: string,
	mimeType: string
): Promise<ReceiptScanResult> {
	const apiKey = env.geminiApiKey;
	if (!apiKey) {
		throw new UpstreamError('Receipt scanning is not configured on this server');
	}

	const body = {
		systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
		contents: [
			{
				role: 'user',
				parts: [
					{ inlineData: { mimeType, data: imageBase64 } },
					{ text: 'Extract the items and tax information from this receipt.' }
				]
			}
		],
		generationConfig: {
			temperature: 0.1,
			responseMimeType: 'application/json',
			responseSchema: RESPONSE_SCHEMA
		},
		safetySettings: [
			{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
			{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
			{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
			{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
		]
	};

	let res: Response;
	try {
		res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
	} catch (e) {
		throw new UpstreamError(
			e instanceof Error ? `Gemini request failed: ${e.message}` : 'Gemini request failed'
		);
	}

	let json: GeminiResponse;
	try {
		json = (await res.json()) as GeminiResponse;
	} catch {
		throw new UpstreamError(`Gemini returned ${res.status} with non-JSON body`);
	}

	if (!res.ok) {
		throw new UpstreamError(
			json.error?.message ?? `Gemini responded ${res.status}`
		);
	}
	if (json.promptFeedback?.blockReason) {
		throw new UpstreamError(
			`Gemini blocked the request: ${json.promptFeedback.blockReason}`
		);
	}

	const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) {
		throw new UpstreamError('Gemini response was empty');
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new UpstreamError('Gemini response was not valid JSON');
	}

	const validated = receiptScanSchema.safeParse(parsed);
	if (!validated.success) {
		throw new UpstreamError('Gemini response did not match the expected schema');
	}
	return validated.data;
}
