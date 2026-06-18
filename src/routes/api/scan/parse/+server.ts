import type { RequestHandler } from './$types';
import { requireSession, respond } from '$lib/server/respond';
import { AppError, UpstreamError, ValidationError } from '$lib/server/errors';
import { isScanConfigured, scanReceipt } from '$lib/server/scan';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set([
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif'
]);

// Crude per-session token-bucket: max 30 scans / 10 min per session.
// Keeps a personal site within Gemini's free tier even if you go nuts.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(token: string): string {
	// Hash the token to a short prefix so we don't keep raw tokens in memory.
	let h = 0;
	for (let i = 0; i < token.length; i++) {
		h = (h * 31 + token.charCodeAt(i)) | 0;
	}
	return `s${h}`;
}

function checkRateLimit(token: string): void {
	const key = rateLimitKey(token);
	const now = Date.now();
	const existing = buckets.get(key);
	if (!existing || existing.resetAt < now) {
		buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return;
	}
	if (existing.count >= RATE_LIMIT_MAX) {
		throw new ValidationError(
			'Too many scans in a short window. Try again in a few minutes.'
		);
	}
	existing.count += 1;
}

export const POST: RequestHandler = async (event) => {
	try {
		const session = requireSession(event);
		if (!isScanConfigured()) {
			throw new UpstreamError(
				'Receipt scanning is not configured. Set GEMINI_API_KEY on the server.'
			);
		}
		checkRateLimit(session.token);

		const contentType = event.request.headers.get('content-type') ?? '';
		if (!contentType.startsWith('multipart/form-data')) {
			throw new ValidationError('Expected multipart/form-data with an "image" field');
		}

		const formData = await event.request.formData();
		const file = formData.get('image');
		if (!(file instanceof File)) {
			throw new ValidationError('No image uploaded');
		}
		if (file.size === 0) {
			throw new ValidationError('Uploaded image is empty');
		}
		if (file.size > MAX_BYTES) {
			throw new ValidationError(
				`Image is ${(file.size / 1_000_000).toFixed(1)}MB; max is ${MAX_BYTES / 1_000_000}MB`
			);
		}
		const mimeType = file.type || 'image/jpeg';
		if (!ALLOWED_MIME.has(mimeType.toLowerCase())) {
			throw new ValidationError(
				`Unsupported image type "${mimeType}". Use JPEG, PNG, WebP, or HEIC.`
			);
		}

		const buf = Buffer.from(await file.arrayBuffer());
		const base64 = buf.toString('base64');

		const result = await scanReceipt(base64, mimeType);
		return respond.ok(result);
	} catch (e) {
		if (e instanceof AppError) return respond.fail(e);
		console.error('Receipt scan failed:', e);
		throw e;
	}
};
