import { Client } from 'splitwise-ts';
import { UnauthorizedError, UpstreamError } from './errors';

interface AuthAware {
	locals: App.Locals;
}

/**
 * Lightweight AuthClient compatible with `splitwise-ts`'s `Client` constructor.
 * The SDK only reads `.accessToken` at request time, so a getter is all we need.
 * `requestAccessToken` is a no-op because we already obtained the token via
 * our own server-side OAuth callback.
 */
class BearerAuth {
	#token: string;
	constructor(token: string) {
		this.#token = token;
	}
	get accessToken(): string {
		return this.#token;
	}
	async requestAccessToken(): Promise<{ access_token: string }> {
		return { access_token: this.#token };
	}
}

export function getClient(event: AuthAware): Client {
	const session = event.locals.session;
	if (!session) throw new UnauthorizedError();
	// SDK's AuthClient is a non-exported abstract class; structural compatibility
	// is enforced by TS through the `Client` constructor signature.
	return new Client(new BearerAuth(session.token) as never);
}

export async function callSplitwise<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof Error && /401|unauthor/i.test(e.message)) {
			throw new UnauthorizedError('Splitwise session expired. Please reconnect.');
		}
		throw new UpstreamError(
			e instanceof Error ? e.message : 'Splitwise request failed'
		);
	}
}
