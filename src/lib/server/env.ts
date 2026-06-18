import {
	SPLITWISE_CLIENT_ID,
	SPLITWISE_CLIENT_SECRET,
	SPLITWISE_REDIRECT_URI,
	SESSION_COOKIE_SECRET,
	HF_TOKEN,
	HF_MODEL
} from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

function required(name: string, value: string | undefined): string {
	if (!value || value.trim() === '' || value.startsWith('your-') || value === 'replace-me') {
		throw new Error(
			`Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`
		);
	}
	return value;
}

function optional(value: string | undefined): string | null {
	if (!value || value.trim() === '') return null;
	return value;
}

export const env = {
	splitwiseClientId: required('SPLITWISE_CLIENT_ID', SPLITWISE_CLIENT_ID),
	splitwiseClientSecret: required('SPLITWISE_CLIENT_SECRET', SPLITWISE_CLIENT_SECRET),
	splitwiseRedirectUri: required('SPLITWISE_REDIRECT_URI', SPLITWISE_REDIRECT_URI),
	sessionCookieSecret: required('SESSION_COOKIE_SECRET', SESSION_COOKIE_SECRET),
	publicAppUrl: PUBLIC_APP_URL || 'http://localhost:5173',
	hfToken: optional(HF_TOKEN),
	hfModel: optional(HF_MODEL) ?? 'meta-llama/Llama-3.2-11B-Vision-Instruct'
} as const;
