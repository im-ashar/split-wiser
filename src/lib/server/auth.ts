import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from './env';

export interface SessionPayload {
	token: string;
	userId: number | null;
	expiresAt: number;
}

const SESSION_COOKIE = 'splitwise_session';
const STATE_COOKIE = 'splitwise_oauth_state';
const STATE_TTL_SECONDS = 600;

function base64UrlEncode(input: Buffer | string): string {
	const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
	return buf.toString('base64url');
}

function base64UrlDecode(input: string): Buffer {
	return Buffer.from(input, 'base64url');
}

function sign(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verify(payload: string, signature: string, secret: string): boolean {
	const expected = sign(payload, secret);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export function encodeSession(payload: SessionPayload): string {
	const json = JSON.stringify(payload);
	const body = base64UrlEncode(json);
	const signature = sign(body, env.sessionCookieSecret);
	return `${body}.${signature}`;
}

export function decodeSession(cookie: string | undefined): SessionPayload | null {
	if (!cookie) return null;
	const dot = cookie.lastIndexOf('.');
	if (dot < 0) return null;
	const body = cookie.slice(0, dot);
	const signature = cookie.slice(dot + 1);
	if (!verify(body, signature, env.sessionCookieSecret)) return null;
	try {
		const parsed = JSON.parse(base64UrlDecode(body).toString('utf8')) as SessionPayload;
		if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'number') return null;
		if (parsed.expiresAt <= Date.now()) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function setSessionCookie(cookies: Cookies, payload: SessionPayload): void {
	const value = encodeSession(payload);
	const maxAge = Math.max(0, Math.floor((payload.expiresAt - Date.now()) / 1000));
	cookies.set(SESSION_COOKIE, value, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function readSessionCookie(cookies: Cookies): SessionPayload | null {
	return decodeSession(cookies.get(SESSION_COOKIE));
}

export function generateState(): string {
	return randomBytes(32).toString('base64url');
}

export function setStateCookie(cookies: Cookies, state: string): void {
	const signed = `${state}.${sign(state, env.sessionCookieSecret)}`;
	cookies.set(STATE_COOKIE, signed, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: STATE_TTL_SECONDS
	});
}

export function consumeStateCookie(cookies: Cookies, candidate: string): boolean {
	const raw = cookies.get(STATE_COOKIE);
	cookies.delete(STATE_COOKIE, { path: '/' });
	if (!raw) return false;
	const dot = raw.lastIndexOf('.');
	if (dot < 0) return false;
	const value = raw.slice(0, dot);
	const signature = raw.slice(dot + 1);
	if (!verify(value, signature, env.sessionCookieSecret)) return false;
	const a = Buffer.from(value);
	const b = Buffer.from(candidate);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export function buildAuthorizeUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: env.splitwiseClientId,
		response_type: 'code',
		redirect_uri: env.splitwiseRedirectUri,
		state
	});
	return `https://secure.splitwise.com/oauth/authorize?${params.toString()}`;
}

interface TokenResponse {
	access_token: string;
	token_type?: string;
	expires_in?: number;
}

export async function exchangeCodeForToken(code: string): Promise<SessionPayload> {
	const body = new URLSearchParams({
		client_id: env.splitwiseClientId,
		client_secret: env.splitwiseClientSecret,
		code,
		grant_type: 'authorization_code',
		redirect_uri: env.splitwiseRedirectUri
	});
	const res = await fetch('https://secure.splitwise.com/oauth/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		},
		body: body.toString()
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token exchange failed (${res.status}): ${text}`);
	}
	const data = (await res.json()) as TokenResponse;
	if (!data.access_token) {
		throw new Error('Token exchange response missing access_token');
	}
	const ttlSeconds = data.expires_in ?? 60 * 60 * 24 * 30;
	return {
		token: data.access_token,
		userId: null,
		expiresAt: Date.now() + ttlSeconds * 1000
	};
}
