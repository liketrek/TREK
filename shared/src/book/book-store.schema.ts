import { z } from 'zod';
import { bookDocumentSchema } from './book.schema';

/**
 * Storing a book.
 *
 * ── Why a version rather than a lock ──────────────────────────────────────
 *
 * Everyone on a journey can open its book, and TREK's whole premise is that
 * they are editing at once. A lock would mean one person at a time; a
 * last-write-wins save would mean the second person silently erases the first.
 *
 * So every write carries the version it was made against. The server increments
 * on success and refuses a save whose base version has moved — which turns
 * "your work vanished" into "someone else changed this", a problem the client
 * can actually do something about. It is the same shape as an HTTP ETag, and
 * for the same reason.
 *
 * ── Why the whole document ───────────────────────────────────────────────
 *
 * Not a patch. A book is a few hundred kilobytes of JSON at most — the schema
 * caps it at 150 spreads of 60 elements — and a patch protocol would need an
 * ordering guarantee, a merge rule per field, and a way to recover when a
 * client misses one. Sending the document costs bandwidth that autosave already
 * amortises and removes an entire class of bug.
 */

export const bookSummarySchema = z.object({
  id: z.number().int().positive(),
  journeyId: z.number().int().positive(),
  title: z.string(),
  version: z.number().int().nonnegative(),
  updatedAt: z.string().nullable(),
  /** Who saved last, for "edited by" rather than for permission. */
  updatedBy: z.number().int().nullable(),
});
export type BookSummary = z.infer<typeof bookSummarySchema>;

export const bookRecordSchema = bookSummarySchema.extend({
  document: bookDocumentSchema,
});
export type BookRecord = z.infer<typeof bookRecordSchema>;

export const bookSaveRequestSchema = z.object({
  title: z.string().max(200).default(''),
  document: bookDocumentSchema,
  /**
   * The version this edit was made against.
   *
   * Omitted only when creating the first book for a journey. Sending a stale
   * one is answered with a conflict and the current record, so the client can
   * show what happened instead of guessing.
   */
  baseVersion: z.number().int().nonnegative().optional(),
});
export type BookSaveRequest = z.infer<typeof bookSaveRequestSchema>;

/**
 * What a conflict answers with.
 *
 * The current record travels with the error, so the client can reconcile
 * without a second round trip — and, more importantly, so it can show the other
 * version rather than only announcing that one exists.
 */
export const bookConflictSchema = z.object({
  error: z.literal('Book was changed by someone else'),
  current: bookRecordSchema,
});
export type BookConflict = z.infer<typeof bookConflictSchema>;
