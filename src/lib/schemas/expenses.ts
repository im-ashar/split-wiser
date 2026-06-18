import { z } from 'zod';

export const expenseUserSchema = z.object({
	user_id: z.number().int().positive(),
	paid_share: z.string().regex(/^\d+(\.\d{1,2})?$/),
	owed_share: z.string().regex(/^\d+(\.\d{1,2})?$/)
});

export const createExpenseSchema = z.object({
	cost: z.string().regex(/^\d+(\.\d{1,2})?$/),
	description: z.string().min(1).max(255),
	currency_code: z.string().min(2).max(8),
	group_id: z.number().int().nonnegative(),
	category_id: z.number().int().positive().optional(),
	date: z.string().optional(),
	users: z.array(expenseUserSchema).min(1)
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = z.object({
	group_id: z.coerce.number().int().nonnegative().optional(),
	friend_id: z.coerce.number().int().nonnegative().optional(),
	dated_after: z.string().optional(),
	dated_before: z.string().optional(),
	updated_after: z.string().optional(),
	updated_before: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	offset: z.coerce.number().int().min(0).optional()
});
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
