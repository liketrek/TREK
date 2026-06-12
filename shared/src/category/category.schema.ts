import { z } from 'zod';

/**
 * Category API contract — single source of truth for the /api/categories endpoints.
 *
 * Categories are the place-category palette (also the admin "Personalization"
 * surface). Reading is open to any authenticated user; create/update/delete are
 * admin-only. The legacy route (server/src/routes/categories.ts) wraps
 * services/categoryService.ts 1:1.
 *
 * The bespoke 400 ("Category name is required") and 404 ("Category not found")
 * messages are reproduced in the controller so the bodies stay byte-identical.
 */

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  user_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryRequestSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

/** All fields optional — the service COALESCEs each against the stored value. */
export const updateCategoryRequestSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;

export const categoryListResponseSchema = z.object({
  categories: z.array(categorySchema),
});
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
