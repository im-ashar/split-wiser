import { z } from 'zod';

export const createCommentSchema = z.object({
	expense_id: z.number().int().positive(),
	content: z.string().min(1).max(1000)
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const listCommentsQuerySchema = z.object({
	expense_id: z.coerce.number().int().positive()
});
