import { redirect } from '@sveltejs/kit';
import {
	buildAuthorizeUrl,
	generateState,
	setStateCookie
} from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const state = generateState();
	setStateCookie(cookies, state);
	throw redirect(302, buildAuthorizeUrl(state));
};
