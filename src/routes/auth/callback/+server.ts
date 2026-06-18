import { error, redirect } from '@sveltejs/kit';
import {
	consumeStateCookie,
	exchangeCodeForToken,
	setSessionCookie
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const oauthError = url.searchParams.get('error');

	if (oauthError) {
		throw error(400, `Splitwise rejected the authorization: ${oauthError}`);
	}
	if (!code || !state) {
		throw error(400, 'Missing code or state in callback');
	}
	if (!consumeStateCookie(cookies, state)) {
		throw error(400, 'Invalid or expired OAuth state');
	}

	let session;
	try {
		session = await exchangeCodeForToken(code);
	} catch (e) {
		console.error('OAuth token exchange failed:', e);
		throw error(502, 'Failed to complete sign-in. Try again.');
	}

	setSessionCookie(cookies, session);
	throw redirect(302, '/');
};
