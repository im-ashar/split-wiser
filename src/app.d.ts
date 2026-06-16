// See https://kit.svelte.dev/docs/types#app for information about these interfaces.
import type { SessionPayload } from '$lib/server/auth';

declare global {
	namespace App {
		interface Error {
			code?: string;
			message: string;
		}
		interface Locals {
			session: SessionPayload | null;
		}
		interface PageData {
			isAuthenticated: boolean;
			user: {
				id: number;
				firstName: string;
				lastName: string;
				email?: string;
				avatar?: string;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
