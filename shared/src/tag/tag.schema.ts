import { z } from 'zod';

/**
 * Tag API contract — single source of truth for the /api/tags endpoints.
 *
 * Tags are per-user place labels (used for filtering). Unlike categories they
 * are NOT admin-gated: every endpoint is scoped to the authenticated user's own
 * tags. The legacy route (server/src/routes/tags.ts) wraps services/tagService.ts
 * 1:1; update/delete first verify ownership via getTagByIdAndUser, 404ing
 * otherwise.
 *
 * The bespoke 400 ("Tag name is required") and 404 ("Tag not found") messages are
 * reproduced in the controller so the bodies stay byte-identical.
 */

export const tagSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  color: z.string(),
  created_at: z.string().optional(),
});
export type Tag = z.infer<typeof tagSchema>;

export const createTagRequestSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});
export type CreateTagRequest = z.infer<typeof createTagRequestSchema>;

/** Both fields optional — the service COALESCEs each against the stored value. */
export const updateTagRequestSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
});
export type UpdateTagRequest = z.infer<typeof updateTagRequestSchema>;

export const tagListResponseSchema = z.object({
  tags: z.array(tagSchema),
});
export type TagListResponse = z.infer<typeof tagListResponseSchema>;
