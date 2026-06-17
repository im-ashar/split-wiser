import { z } from 'zod';
import { env } from './env';
import { UpstreamError } from './errors';

// Hugging Face Inference Providers — OpenAI-compatible chat completions
// router that fans out to Together, Fireworks, Hyperbolic, Sambanova, etc.
// See https://huggingface.co/docs/inference-providers
const HF_URL = 'https://router.huggingface.co/v1/chat/completions';

const SYSTEM_INSTRUCTIONS = `You read photos of receipts and bills. Extract every line item the customer was actually charged for and the totals printed on the receipt.

RULES:
- Each item must be a thing being purchased. Skip subtotal, total, GST/VAT/tax, service charge, tip, discount, change, and anything that is not a sellable line item.
- "name" is the item description as printed (clean it up; if a quantity multiplier was printed like "2x Coffee 4.00", fold the quantity into the printed line price).
- "price" is the displayed price for that line as printed on the receipt. Do NOT add or remove tax — return what is shown.
- "currency" is the ISO-4217 code if visible (USD, EUR, PKR, INR, GBP, AED, etc.). Use null if you cannot tell.
- "gstRate" is the percentage rate (e.g. 18 for 18%) if a tax line names a rate. Use null if no rate is shown.
- "pricesInclude":
    - "gst"      → if the receipt says "incl. GST", "tax included", "VAT inclusive", or similar.
    - "no-gst"   → if there is a separate GST/tax line summed on top of an itemised subtotal.
    - "unknown"  → if it is unclear or no tax is mentioned.
- "subtotal" and "total" are the printed numbers if you can see them, else null.
- If the image is not a receipt or you cannot read prices, return an empty items array.

Respond with ONLY a single JSON object. No prose, no markdown, no code fences.

Schema:
{
  "items": [{ "name": string, "price": number }],
  "currency": string | null,
  "gstRate": number | null,
  "pricesInclude": "gst" | "no-gst" | "unknown",
  "subtotal": number | null,
  "total": number | null
}`;

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

interface HfChatResponse {
	choices?: Array<{
		message?: { content?: string };
		finish_reason?: string;
		native_finish_reason?: string;
		error?: { message?: string; code?: number | string };
	}>;
	error?:
		| string
		| {
				message?: string;
				code?: number | string;
				type?: string;
		  };
}

export function isScanConfigured(): boolean {
	return env.hfToken !== null;
}

/** Strip optional ```json fences some models still emit. */
function stripCodeFence(text: string): string {
	const trimmed = text.trim();
	if (trimmed.startsWith('```')) {
		return trimmed
			.replace(/^```(?:json)?\s*/i, '')
			.replace(/```\s*$/, '')
			.trim();
	}
	return trimmed;
}

/** Some models prepend explanation; pull out the first {...} block. */
function extractJsonObject(text: string): string {
	const start = text.indexOf('{');
	const end = text.lastIndexOf('}');
	if (start === -1 || end === -1 || end < start) return text;
	return text.slice(start, end + 1);
}

function errorMessage(json: HfChatResponse, fallback: string): string {
	const top = json.error;
	if (typeof top === 'string') return top;
	if (top?.message) return top.message;
	const choice = json.choices?.[0]?.error;
	if (choice?.message) return choice.message;
	return fallback;
}

export async function scanReceipt(
	imageBase64: string,
	mimeType: string
): Promise<ReceiptScanResult> {
	const token = env.hfToken;
	if (!token) {
		throw new UpstreamError('Receipt scanning is not configured on this server');
	}

	const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

	const body = {
		model: env.hfModel,
		messages: [
			{ role: 'system', content: SYSTEM_INSTRUCTIONS },
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: 'Extract the items and tax information from this receipt as JSON.'
					},
					{ type: 'image_url', image_url: { url: imageDataUrl } }
				]
			}
		],
		response_format: { type: 'json_object' },
		temperature: 0.1,
		max_tokens: 4096,
		stream: false
	};

	let res: Response;
	try {
		res = await fetch(HF_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});
	} catch (e) {
		console.error('[scan] Hugging Face fetch threw:', e);
		throw new UpstreamError(
			e instanceof Error
				? `Hugging Face request failed: ${e.message}`
				: 'Hugging Face request failed'
		);
	}

	const rawText = await res.text();
	let json: HfChatResponse;
	try {
		json = JSON.parse(rawText) as HfChatResponse;
	} catch {
		console.error(
			`[scan] Hugging Face returned ${res.status} with non-JSON body (model=${env.hfModel}):`,
			rawText.slice(0, 2000)
		);
		throw new UpstreamError(
			`Hugging Face returned ${res.status} with non-JSON body. Check server logs.`
		);
	}

	const responseError = json.error ?? json.choices?.[0]?.error ?? null;
	if (!res.ok || responseError) {
		const msg = errorMessage(json, `Hugging Face responded ${res.status}`);
		console.error(
			`[scan] Hugging Face error (status=${res.status}, model=${env.hfModel}):`,
			JSON.stringify(json, null, 2)
		);

		if (res.status === 429 || /quota|rate.?limit|monthly.?included/i.test(msg)) {
			throw new UpstreamError(
				`Rate-limited or out of monthly inference credits on ${env.hfModel}. Try again later, switch HF_MODEL, or top up at https://huggingface.co/settings/billing.`
			);
		}
		if (res.status === 401 || res.status === 403) {
			throw new UpstreamError(
				'Hugging Face rejected the token. Check HF_TOKEN (it must have "Inference" permission) at https://huggingface.co/settings/tokens.'
			);
		}
		if (res.status === 404 || /not.?found|no.?provider/i.test(msg)) {
			throw new UpstreamError(
				`No inference provider available for ${env.hfModel}. Pick a different HF_MODEL (e.g. Qwen/Qwen2.5-VL-7B-Instruct, meta-llama/Llama-3.2-11B-Vision-Instruct).`
			);
		}
		throw new UpstreamError(`${msg} (model=${env.hfModel})`);
	}

	const choice = json.choices?.[0];
	const content = choice?.message?.content;
	if (!content || typeof content !== 'string') {
		const finish = choice?.finish_reason ?? choice?.native_finish_reason ?? 'unknown';
		console.error(
			`[scan] Hugging Face response had no content (model=${env.hfModel}, finish_reason=${finish}):`,
			JSON.stringify(json, null, 2)
		);
		if (finish === 'length' || finish === 'max_tokens') {
			throw new UpstreamError(
				`${env.hfModel} ran out of token budget before writing JSON. Switch HF_MODEL to a non-reasoning vision model (e.g. Qwen/Qwen2.5-VL-7B-Instruct, meta-llama/Llama-3.2-11B-Vision-Instruct).`
			);
		}
		if (finish === 'content_filter') {
			throw new UpstreamError(
				`${env.hfModel} blocked the image for content reasons. Try a different model.`
			);
		}
		throw new UpstreamError(
			`Hugging Face returned no content (finish_reason=${finish}). Check server logs.`
		);
	}

	const cleaned = extractJsonObject(stripCodeFence(content));
	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		console.error(
			`[scan] Model output was not valid JSON (model=${env.hfModel}). Raw content:`,
			content
		);
		throw new UpstreamError(
			'The model did not return valid JSON. Check server logs, or switch HF_MODEL.'
		);
	}

	const validated = receiptScanSchema.safeParse(parsed);
	if (!validated.success) {
		console.error(
			`[scan] Model output failed schema validation (model=${env.hfModel}). Issues:`,
			JSON.stringify(validated.error.issues, null, 2),
			'\nParsed payload:',
			JSON.stringify(parsed, null, 2)
		);
		throw new UpstreamError(
			'The model returned JSON that did not match the expected schema. Check server logs.'
		);
	}
	return validated.data;
}
