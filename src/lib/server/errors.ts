export type ErrorCode =
	| 'unauthorized'
	| 'validation'
	| 'not_found'
	| 'upstream'
	| 'unknown';

export class AppError extends Error {
	readonly code: ErrorCode;
	readonly status: number;
	readonly details?: unknown;

	constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
		super(message);
		this.name = 'AppError';
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = 'Sign in with Splitwise to continue') {
		super('unauthorized', message, 401);
		this.name = 'UnauthorizedError';
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super('validation', message, 400, details);
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Resource not found') {
		super('not_found', message, 404);
		this.name = 'NotFoundError';
	}
}

export class UpstreamError extends AppError {
	constructor(message: string, details?: unknown) {
		super('upstream', message, 502, details);
		this.name = 'UpstreamError';
	}
}
