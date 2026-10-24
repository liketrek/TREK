import { idSchema } from '../common/primitives.schema';
import {
  bookDesignIdSchema,
  bookFindingSchema,
  bookSpreadIdSchema,
  bookSpreadSummarySchema,
  bookWriteResultSchema,
  editBookPageArgs,
} from './book-ops.schema';
import { BOOK_FONTS_IDS, MAX_SPREADS, MAX_SPREAD_ELEMENTS, bookDocumentSchema } from './book.schema';
import { BOOK_DESIGN_STYLES, bookDesignDirectivesSchema } from './design/design-directives.schema';
import { BOOK_DESIGN_ACTIONS } from './design/design-merge';
import { BOOK_DESIGN_BEATS } from './design/design-pacing';

import { z } from 'zod';

/**
 * The whole-book design as the assistant's tools take and answer it
 * (journey-studio-wp13.md section 6): `design_book` composes a draft the
 * server keeps, `revise_book_design` changes one page of it, `get_book_design`
 * reads it again, `apply_book_design` writes the chosen pages in one
 * transaction and keeps the book as it was as a revision, which
 * `restore_book_revision` puts back. The draft's selection travels over REST
 * for the proposal card. Plain shapes for the tools, strict request schemas
 * beside them, as in book-ops.schema.ts.
 */

export const BOOK_DESIGN_LIMITS = {
  /** Plan rows one answer lists; the rest are counted. */
  planRows: 150,
  /** Photos left out one answer names. */
  leftOut: 60,
  findings: 40,
  notes: 20,
  /** Pages of the book an apply answers with; every applied id is still named. */
  pages: 24,
  /** Pages a selection names at most: every page of a book and every page it drops. */
  selection: MAX_SPREADS * 2,
  /** Revisions a journey keeps, the newest first. */
  revisions: 5,
} as const;

/** Why a page the design would change was not changed by its apply. */
export const BOOK_DESIGN_SKIP_REASONS = ['excluded', 'changed_since', 'photo_gone'] as const;
export type BookDesignSkipReason = (typeof BOOK_DESIGN_SKIP_REASONS)[number];

const version = z.number().int().nonnegative();
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const designBookArgs = { directives: bookDesignDirectivesSchema.optional() };
export const getBookDesignArgs = { designId: bookDesignIdSchema };
/** One page of a draft changed with the operations `edit_book_page` takes. */
export const reviseBookDesignArgs = {
  designId: bookDesignIdSchema,
  spreadId: bookSpreadIdSchema,
  ops: editBookPageArgs.ops,
};
export const applyBookDesignArgs = { designId: bookDesignIdSchema, expectedVersion: version.optional() };
/** The assistant's undo of an applied design: the book put back as the apply found it. */
export const restoreBookRevisionArgs = { revisionId: idSchema, expectedVersion: version };
/**
 * The assistant's undo of `remove_book_layout`: the layout it answered under
 * `previous_layout`, as JSON, parsed again like every argument. A string keeps
 * the tool's schema small; every client loads it with tools/list.
 */
export const restoreBookLayoutArgs = { layout: z.string().min(2).max(400_000), expectedVersion: version };

export const designBookRequestSchema = z.strictObject(designBookArgs);
export const getBookDesignRequestSchema = z.strictObject(getBookDesignArgs);
export const reviseBookDesignRequestSchema = z.strictObject(reviseBookDesignArgs);
export const applyBookDesignRequestSchema = z.strictObject(applyBookDesignArgs);
export const restoreBookRevisionRequestSchema = z.strictObject(restoreBookRevisionArgs);
export const restoreBookLayoutRequestSchema = z.strictObject(restoreBookLayoutArgs);

export type DesignBookRequest = z.infer<typeof designBookRequestSchema>;
export type GetBookDesignRequest = z.infer<typeof getBookDesignRequestSchema>;
export type ReviseBookDesignRequest = z.infer<typeof reviseBookDesignRequestSchema>;
export type ApplyBookDesignRequest = z.infer<typeof applyBookDesignRequestSchema>;
export type RestoreBookRevisionRequest = z.infer<typeof restoreBookRevisionRequestSchema>;
export type RestoreBookLayoutRequest = z.infer<typeof restoreBookLayoutRequestSchema>;

/** One page of a design's plan, as an answer and the draft route carry it. */
export const bookDesignPlanRowSchema = z.object({
  spreadId: bookSpreadIdSchema,
  index: z
    .number()
    .int()
    .min(0)
    .max(MAX_SPREADS * 2),
  action: z.enum(BOOK_DESIGN_ACTIONS),
  beat: z.enum(BOOK_DESIGN_BEATS),
  chapter: z.string().max(80).nullable(),
  entryId: z.number().int().positive().nullable(),
  photoIds: z.array(z.number().int().positive()).max(MAX_SPREAD_ELEMENTS),
  findings: z.object({ severe: z.number().int().nonnegative(), warn: z.number().int().nonnegative() }),
});
export type BookDesignPlanRowOut = z.infer<typeof bookDesignPlanRowSchema>;

/** The book's look a design chose: its style, colours and two typefaces. */
export const bookDesignStyleSchema = z.object({
  style: z.enum(BOOK_DESIGN_STYLES),
  paper: hex,
  ink: hex,
  accent: hex,
  heading: z.enum(BOOK_FONTS_IDS),
  body: z.enum(BOOK_FONTS_IDS),
});
export type BookDesignStyleOut = z.infer<typeof bookDesignStyleSchema>;

/** `design_book` and `get_book_design`: the draft in words, nothing of the book written. */
export const bookDesignAnswerSchema = z.object({
  design_id: bookDesignIdSchema,
  journey_id: idSchema,
  /** The book's version the draft was made against; null for a journey without a book. */
  base_version: version.nullable(),
  /** When the server forgets the draft (ISO); design_book makes it again. */
  expires_at: z.string(),
  plan: z.array(bookDesignPlanRowSchema).max(BOOK_DESIGN_LIMITS.planRows),
  /** Plan rows past those listed. */
  more_rows: z.number().int().nonnegative(),
  /** The pages apply_book_design writes unless the person takes some out. */
  selected: z.array(bookSpreadIdSchema).max(BOOK_DESIGN_LIMITS.selection),
  style: bookDesignStyleSchema,
  photos: z.object({
    used: z.number().int().nonnegative(),
    left_out: z
      .array(z.object({ photoId: z.number().int().positive(), reason: z.string().max(40) }))
      .max(BOOK_DESIGN_LIMITS.leftOut),
    left_out_more: z.number().int().nonnegative(),
  }),
  findings: z.array(bookFindingSchema).max(BOOK_DESIGN_LIMITS.findings),
  notes: z.array(z.string().max(300)).max(BOOK_DESIGN_LIMITS.notes),
});
export type BookDesignAnswer = z.infer<typeof bookDesignAnswerSchema>;

/** `revise_book_design`: the page of the draft as it is now, with its findings. */
export const bookDesignRevisionAnswerSchema = z.object({
  design_id: bookDesignIdSchema,
  page: bookSpreadSummarySchema,
  action: z.enum(BOOK_DESIGN_ACTIONS),
  findings: z.array(bookFindingSchema).max(BOOK_DESIGN_LIMITS.findings),
});
export type BookDesignRevisionAnswer = z.infer<typeof bookDesignRevisionAnswerSchema>;

/** A page the apply left as it was, and why. */
export const bookDesignSkippedSchema = z.object({
  spreadId: bookSpreadIdSchema,
  reason: z.enum(BOOK_DESIGN_SKIP_REASONS),
});
export type BookDesignSkipped = z.infer<typeof bookDesignSkippedSchema>;

/**
 * `apply_book_design`: a book write's answer (the first pages it changed),
 * the revision that takes it back, the pages it changed and the ones it left.
 */
export const bookDesignApplyResultSchema = bookWriteResultSchema.extend({
  design_id: bookDesignIdSchema,
  /** The revision that takes the apply back; null when the journey had no book before it. */
  revision_id: idSchema.nullable(),
  applied: z.array(bookSpreadIdSchema).max(BOOK_DESIGN_LIMITS.selection),
  skipped: z.array(bookDesignSkippedSchema).max(BOOK_DESIGN_LIMITS.selection),
});
export type BookDesignApplyResult = z.infer<typeof bookDesignApplyResultSchema>;

/** PUT /api/journeys/:journeyId/book-designs/:designId/selection: the pages the apply writes. */
export const bookDesignSelectionRequestSchema = z.strictObject({
  spreadIds: z.array(bookSpreadIdSchema).max(BOOK_DESIGN_LIMITS.selection),
});
export type BookDesignSelectionRequest = z.infer<typeof bookDesignSelectionRequestSchema>;

export const bookDesignSelectionResponseSchema = z.object({
  selection: z.array(bookSpreadIdSchema).max(BOOK_DESIGN_LIMITS.selection),
});
export type BookDesignSelectionResponse = z.infer<typeof bookDesignSelectionResponseSchema>;

/** GET /api/journeys/:journeyId/book-designs/:designId: the draft for the proposal card's pages. */
export const bookDesignDraftResponseSchema = z.object({
  designId: bookDesignIdSchema,
  baseVersion: version.nullable(),
  expiresAt: z.string(),
  document: bookDocumentSchema,
  plan: z.array(bookDesignPlanRowSchema).max(BOOK_DESIGN_LIMITS.selection),
  selection: z.array(bookSpreadIdSchema).max(BOOK_DESIGN_LIMITS.selection),
});
export type BookDesignDraftResponse = z.infer<typeof bookDesignDraftResponseSchema>;
