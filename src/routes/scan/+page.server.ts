import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { isScanConfigured } from '$lib/server/scan';

export const load: PageServerLoad = (event) => {
	if (!event.locals.session) {
		throw redirect(302, '/auth/login');
	}
	return { scanEnabled: isScanConfigured() };
};
