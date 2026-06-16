import { json } from '@sveltejs/kit';
import { ZodError, type ZodSchema } from 'zod';
import { AppError, UnauthorizedError, ValidationError } from './errors';

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
	ok: false;
	error: { code: string; message: string; details?: unknown };
};
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export const respond = {
	ok<T>(data: T, init?: ResponseInit): Response {
		return json({ ok: true, data } satisfies ApiSuccess<T>, init);
	},
	fail(error: AppError, init?: ResponseInit): Response {
		return json(
			{
				ok: false,
				error: {
					code: error.code,
					message: error.message,
					...(error.details !== undefined ? { details: error.details } : {})
				}
			} satisfies ApiFailure,
			{ ...init, status: error.status }
		);
	}
};

export async function readJson<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw new ValidationError('Request body must be valid JSON');
	}
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		throw zodToValidation(parsed.error);
	}
	return parsed.data;
}

export function readQuery<T>(url: URL, schema: ZodSchema<T>): T {
	const obj: Record<string, string> = {};
	for (const [k, v] of url.searchParams.entries()) obj[k] = v;
	const parsed = schema.safeParse(obj);
	if (!parsed.success) {
		throw zodToValidation(parsed.error);
	}
	return parsed.data;
}

export function zodToValidation(err: ZodError): ValidationError {
	const first = err.issues[0];
	const message = first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Validation failed';
	return new ValidationError(message, err.flatten());
}

export function requireSession<T extends { locals: App.Locals }>(event: T): NonNullable<T['locals']['session']> {
	if (!event.locals.session) {
		throw new UnauthorizedError();
	}
	return event.locals.session as NonNullable<T['locals']['session']>;
}
