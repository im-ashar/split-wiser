import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	clearSessionCookie(cookies);
	throw redirect(302, '/');
};

export const GET: RequestHandler = async ({ cookies }) => {
	clearSessionCookie(cookies);
	throw redirect(302, '/');
};
