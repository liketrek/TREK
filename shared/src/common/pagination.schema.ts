import { z } from 'zod';

/**
 * Generic pagination query helper. Individual endpoints opt in by extending
 * this; it is NOT applied globally (many TREK list endpoints return full sets).
 * Defaults are conservative and only used where a route already paginates.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(200).default(50),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
