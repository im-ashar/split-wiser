import { describe, expect, it } from 'vitest';
import { capitalizeFullName } from './capitalize';

describe('capitalizeFullName', () => {
	it('capitalises each word and lowercases the rest', () => {
		expect(capitalizeFullName('john DOE')).toBe('John Doe');
		expect(capitalizeFullName('mary  jane')).toBe('Mary Jane');
		expect(capitalizeFullName('  ali ')).toBe('Ali');
	});

	it('returns empty string for empty input', () => {
		expect(capitalizeFullName('')).toBe('');
		expect(capitalizeFullName('   ')).toBe('');
	});
});
