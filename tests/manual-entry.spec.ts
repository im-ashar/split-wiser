import { test, expect } from '@playwright/test';

test('manual entry → totals end to end', async ({ page }) => {
	await page.goto('/');

	// The unauthenticated home page exposes a Manual entry button.
	await expect(page.getByRole('heading', { name: /Split your bill/i })).toBeVisible();
	await page.getByRole('button', { name: /Manual entry/i }).click();

	// Generate 3 person inputs.
	const countInput = page.getByLabel('Number of people');
	await countInput.fill('3');
	await page.getByRole('button', { name: 'Generate inputs' }).click();

	await page.getByPlaceholder('Enter person 1 name').fill('Ali');
	await page.getByPlaceholder('Enter person 2 name').fill('Bea');
	await page.getByPlaceholder('Enter person 3 name').fill('Cy');

	await page.getByRole('button', { name: 'Create bill' }).click();

	// Bill cards should now be visible.
	await expect(page.getByText('Bill configuration')).toBeVisible();

	// Apply GST 18 and total discount 10
	await page.getByLabel('GST %').fill('18');
	await page.getByLabel('Total discount %').fill('10');

	// Add an amount of 100 to the first person card.
	const firstAddBtn = page.getByRole('button', { name: 'Add amount' }).first();
	await firstAddBtn.click();
	const firstAmountInput = page.getByPlaceholder('0.00').first();
	await firstAmountInput.fill('100');

	// Grand total should reflect 100 * 1.18 * 0.9 = 106.20
	await expect(page.getByText(/Grand total/i)).toBeVisible();
	await expect(page.getByText(/106\.20/)).toBeVisible();
});
