import { z } from 'zod';

/**
 * File + photo API contract.
 *
 * Files live under /api/trips/:tripId/files (upload, metadata, star, trash,
 * reservation links, authenticated download). Photos live under /api/photos
 * (thumbnail/original streaming + info) and are global, not trip-scoped.
 *
 * Uploads are multipart/form-data so the file itself isn't modelled here; these
 * schemas pin the JSON-ish metadata fields that ride along or come as request
 * bodies. The bespoke 400/403/404 controller messages pin the rest.
 */

const nullableIdField = z.union([z.string(), z.number()]).nullable().optional();

/**
 * Multipart text fields riding along with the upload — always strings on the
 * wire (multipart/form-data has no other type), so no numeric coercion here.
 */
export const fileUploadRequestSchema = z.object({
  place_id: z.string().optional(),
  description: z.string().optional(),
  reservation_id: z.string().optional(),
  budget_item_id: z.string().optional(),
});
export type FileUploadRequest = z.infer<typeof fileUploadRequestSchema>;

export const fileUpdateRequestSchema = z.object({
  description: z.string().optional(),
  place_id: nullableIdField,
  reservation_id: nullableIdField,
  budget_item_id: nullableIdField,
});
export type FileUpdateRequest = z.infer<typeof fileUpdateRequestSchema>;

export const fileLinkRequestSchema = z.object({
  reservation_id: nullableIdField,
  assignment_id: nullableIdField,
  place_id: nullableIdField,
  budget_item_id: nullableIdField,
});
export type FileLinkRequest = z.infer<typeof fileLinkRequestSchema>;

/** Variants the photo streaming endpoints accept. */
export const photoVariantSchema = z.enum(['thumbnail', 'original']);
export type PhotoVariant = z.infer<typeof photoVariantSchema>;

// ── Responses ───────────────────────────────────────────────────────────────

/** A trip_files row as the file routes return it: the stored columns, the joins, and the download URL. */
export const tripFileSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  place_id: z.number().nullable(),
  reservation_id: z.number().nullable(),
  filename: z.string(),
  original_name: z.string(),
  file_size: z.number().nullable(),
  mime_type: z.string().nullable(),
  description: z.string().nullable(),
  created_at: z.string().nullable(),
  note_id: z.number().nullable(),
  uploaded_by: z.number().nullable(),
  starred: z.number().nullable(),
  deleted_at: z.string().nullable(),
  message_id: z.number().nullable(),
  reservation_title: z.string().nullable(),
  uploaded_by_name: z.string().nullable(),
  uploaded_by_avatar: z.string().nullable(),
  url: z.string(),
});
export type TripFile = z.infer<typeof tripFileSchema>;

/** A file in the list, with the ids of what it is linked to. */
export const tripFileListItemSchema = tripFileSchema.extend({
  linked_reservation_ids: z.array(z.number()),
  linked_place_ids: z.array(z.number()),
  linked_budget_item_ids: z.array(z.number()),
});
export type TripFileListItem = z.infer<typeof tripFileListItemSchema>;

/** GET /files */
export const tripFilesResponseSchema = z.object({ files: z.array(tripFileListItemSchema) });
export type TripFilesResponse = z.infer<typeof tripFilesResponseSchema>;

/** POST /files, PUT /files/:id, PATCH :id/star, POST :id/restore */
export const tripFileResponseSchema = z.object({ file: tripFileSchema });
export type TripFileResponse = z.infer<typeof tripFileResponseSchema>;

/** A file_links row. */
export const fileLinkSchema = z.object({
  id: z.number(),
  file_id: z.number(),
  reservation_id: z.number().nullable(),
  assignment_id: z.number().nullable(),
  place_id: z.number().nullable(),
  created_at: z.string().nullable(),
  budget_item_id: z.number().nullable(),
});
export type FileLink = z.infer<typeof fileLinkSchema>;

/** POST :id/link: the file's links after the write. */
export const fileLinkCreateResponseSchema = z.object({ success: z.literal(true), links: z.array(fileLinkSchema) });
export type FileLinkCreateResponse = z.infer<typeof fileLinkCreateResponseSchema>;

/** GET :id/links: the file's links with the linked reservation's title. */
export const fileLinksResponseSchema = z.object({
  links: z.array(fileLinkSchema.extend({ reservation_title: z.string().nullable() })),
});
export type FileLinksResponse = z.infer<typeof fileLinksResponseSchema>;

/** DELETE trash/empty: how many files were removed for good. */
export const fileTrashEmptyResponseSchema = z.object({ success: z.literal(true), deleted: z.number() });
export type FileTrashEmptyResponse = z.infer<typeof fileTrashEmptyResponseSchema>;
