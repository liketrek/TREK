import { z } from 'zod';

/**
 * Place API contract — single source of truth for the /api/trips/:tripId/places
 * endpoints (place pool CRUD, GPX/map/list imports, image search, bulk delete).
 *
 * Trip-scoped; mutations use the 'place_edit' permission. The legacy route
 * (server/src/routes/places.ts) wraps placeService and fires the journey
 * place-created/updated/deleted hooks. Place rows are wide and provider-derived,
 * so create/update payloads stay mostly open with `name` pinned; string fields
 * are capped (name 200, description 2000, address 500, notes 2000) by the legacy
 * validateStringLengths, reproduced in the controller.
 */

const open = z.record(z.string(), z.unknown());

export const placeCreateRequestSchema = open.and(z.object({ name: z.string().min(1) }));
export type PlaceCreateRequest = z.infer<typeof placeCreateRequestSchema>;

export const placeUpdateRequestSchema = open;
export type PlaceUpdateRequest = z.infer<typeof placeUpdateRequestSchema>;

export const placeBulkDeleteRequestSchema = z.object({
  ids: z.array(z.number()),
});
export type PlaceBulkDeleteRequest = z.infer<typeof placeBulkDeleteRequestSchema>;

export const placeImportListRequestSchema = z.object({
  url: z.string().min(1),
});
export type PlaceImportListRequest = z.infer<typeof placeImportListRequestSchema>;

/** Query filters for the place list. */
export const placeListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
});
export type PlaceListQuery = z.infer<typeof placeListQuerySchema>;
