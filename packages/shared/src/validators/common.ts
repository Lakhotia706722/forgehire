import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const uuidSchema = z.string().uuid('Invalid UUID format');

export type PaginationInput = z.infer<typeof paginationSchema>;
