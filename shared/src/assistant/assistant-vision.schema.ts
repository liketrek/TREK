import { bookSpreadIdSchema } from '../book/book-op-ids';
import { bookDesignIdSchema, editBookPageArgs } from '../book/book-ops.schema';
import { bookSpreadSchema } from '../book/book.schema';
import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * The Studio assistant looking at a page (journey-studio.md section 3). The
 * server cannot draw a page, so it asks the Studio tab that holds the turn's
 * stream for one: a `data-trek-render-request` chunk names the page, the book
 * version and the photos to leave out, the tab draws that one page and
 * uploads it as an image, and the turn hands it to a model that reads images,
 * beside the page's description. Nothing of the image is kept: the message
 * stores what was looked at (`data-trek-page-view`), never the bytes.
 */

export const ASSISTANT_PAGE_IMAGE = {
  /** The long edge a page is drawn at, in pixels, and the JPEG quality the Studio sends it with. */
  longEdge: 1280,
  jpegQuality: 0.82,
  /** What the server takes at most: the bytes, the long edge and the pixels of one image. */
  maxBytes: 1024 * 1024,
  maxEdge: 2048,
  maxPixels: 4_000_000,
  /** Photos one page may name as hidden or drawn: its frames and the pictures its maps mark stops with. */
  maxPagePhotos: 1000,
  /** How long a turn waits for a page image before it goes on with the description alone. */
  timeoutMs: 15_000,
  /** Images one model request carries at most, one per tool answer; earlier ones go as their text. */
  perRequest: 3,
  /** Previews of a proposed change one step and one turn may ask for. */
  previewsPerStep: 3,
  previewsPerTurn: 8,
} as const;

/**
 * A page the server asks the Studio to draw, streamed while the turn waits.
 * `spread` is a proposal's page as the server applied it (a preview): the
 * Studio draws that one in place of the stored page; without it the page is
 * drawn as the book stands at `bookVersion`. The photos in `hiddenPhotoIds`
 * are drawn as empty frames, and a map stop showing one as a plain dot: only
 * the asking user's own photos leave the browser.
 */
export const assistantPageRenderSchema = z.object({
  requestId: z.uuid(),
  threadId: idSchema,
  spreadId: bookSpreadIdSchema,
  bookVersion: z.number().int().nonnegative(),
  /**
   * A proposal's page as the server applied it, with the journey's photos,
   * words and figures: the Studio draws this one in place of the stored page,
   * nothing saved.
   */
  spread: bookSpreadSchema.optional(),
  /** A page of a design draft (design_book) rather than of the book: the Studio draws it from the draft. */
  designId: bookDesignIdSchema.optional(),
  hiddenPhotoIds: z.array(idSchema).max(ASSISTANT_PAGE_IMAGE.maxPagePhotos),
});
export type AssistantPageRender = z.infer<typeof assistantPageRenderSchema>;

/**
 * What a turn looked at, as the message keeps it: the page, the version, the
 * image's size when one reached the model (null when the model read the
 * description alone), and the description itself. Never the image.
 */
export const assistantPageViewSchema = z.object({
  spreadId: bookSpreadIdSchema,
  bookVersion: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  bytes: z.number().int().positive().nullable(),
  description: z.string().max(20_000),
});
export type AssistantPageView = z.infer<typeof assistantPageViewSchema>;

/**
 * `preview_book_page`, a read of the Studio turn's own (no MCP tool): one page
 * as it stands, or with `ops` as an `edit_book_page` with them would leave it,
 * nothing saved. It answers the page's description and findings, and a model
 * that reads images also gets the page as the Studio draws it.
 */
export const previewBookPageRequestSchema = z.strictObject({
  spreadId: bookSpreadIdSchema,
  ops: editBookPageArgs.ops.optional(),
  /** Look at the page of a design draft instead of the book's (design_book's design_id). */
  designId: bookDesignIdSchema.optional(),
});
export type PreviewBookPageRequest = z.infer<typeof previewBookPageRequestSchema>;

/**
 * POST /api/journeys/:journeyId/assistant/threads/:threadId/renders/:requestId,
 * multipart: the image in the field `image`, these as text fields beside it.
 * `drawnPhotoIds` lists the photos the image shows, comma-separated; the
 * server refuses the image when one of them is not the user's to show.
 */
export const assistantRenderUploadRequestSchema = z
  .object({
    bookVersion: z.coerce.number().int().nonnegative(),
    spreadId: bookSpreadIdSchema,
    drawnPhotoIds: z
      .string()
      .max(ASSISTANT_PAGE_IMAGE.maxPagePhotos * 13)
      .regex(/^(?:\d{1,12}(?:,\d{1,12})*)?$/)
      .optional(),
  })
  .strict();
export type AssistantRenderUploadRequest = z.infer<typeof assistantRenderUploadRequestSchema>;

/** The answer to an image the turn took; anything it did not take is refused with an error instead. */
export const assistantRenderUploadResponseSchema = z.object({ accepted: z.literal(true) });
export type AssistantRenderUploadResponse = z.infer<typeof assistantRenderUploadResponseSchema>;

/** The photo ids of an upload's `drawnPhotoIds` field. */
export function drawnPhotoIdsOf(field: string | undefined): number[] {
  return field ? field.split(',').map(Number) : [];
}
