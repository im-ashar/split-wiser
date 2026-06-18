import type { Handle, HandleServerError } from '@sveltejs/kit';
import { readSessionCookie } from '$lib/server/auth';
import { AppError } from '$lib/server/errors';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = readSessionCookie(event.cookies);
	return resolve(event);
};

export const handleError: HandleServerError = ({ error, status }) => {
	if (error instanceof AppError) {
		return { code: error.code, message: error.message };
	}
	if (status >= 500) {
		console.error('Unhandled server error:', error);
	}
	return {
		code: 'unknown',
		message: error instanceof Error ? error.message : 'Unexpected server error'
	};
};
