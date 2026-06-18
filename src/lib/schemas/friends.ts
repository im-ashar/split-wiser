import { z } from 'zod';

export const createFriendSchema = z.object({
	user_email: z.string().email(),
	user_first_name: z.string().min(1).max(60),
	user_last_name: z.string().max(60).optional()
});
export type CreateFriendInput = z.infer<typeof createFriendSchema>;
