import {
  BOOK_FINDING_CODES,
  BOOK_OP_LIMITS,
  bookAnyTemplateIdSchema,
  bookPageOpSchema,
  bookSpreadIdSchema,
} from '../../book/book-ops.schema';
import { bookSpreadSchema, MAX_BOOK_TITLE, MAX_SPREADS } from '../../book/book.schema';
import { idSchema } from '../../common/primitives.schema';
import { cardCountSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A change to a journey's photo book as the Studio's chat shows it: the pages
 * a held book write works on, what it lays them out on and brings onto them,
 * and what the server's check of the result found. For an edit or the cover
 * it carries the page after as the server's trial of the change made it, so
 * the Studio draws the page before and after with the view the editor uses,
 * never from an image, and the page after as the server would write it. The
 * page operations ride along for a card without that page and for a book
 * that moved on since the trial: the Studio runs them on its own book with
 * the same engine. Once applied it names the pages as the change left them.
 */

/** How much of a change a card carries; the server cuts to the same numbers. */
export const BOOK_PAGE_CARD_LIMITS = { findings: 6, layout: 60 } as const;

/** What the change does to its pages: makes them, changes them, moves one, or deletes them. */
export const BOOK_PAGE_CARD_CHANGES = ['new', 'changed', 'moved', 'willDelete'] as const;

/** One page as a card names it. */
export const bookCardPageSchema = z.object({
  spreadId: bookSpreadIdSchema,
  /** Where it stands in the book, the cover at 0. */
  index: z
    .number()
    .int()
    .min(0)
    .max(MAX_SPREADS - 1),
  role: bookSpreadSchema.shape.role.unwrap(),
  /** Its place among the double pages, from 1; null for a single page (the covers, the first and the last). */
  number: z.number().int().min(1).max(MAX_SPREADS).nullable(),
  /** Photos placed on it. */
  photos: cardCountSchema,
});
export type BookCardPage = z.infer<typeof bookCardPageSchema>;

/** A finding of the server's check, by its code: the client names it in the user's language. */
export const bookCardFindingSchema = z.object({
  code: z.enum(BOOK_FINDING_CODES),
  severity: z.enum(['severe', 'warn', 'info']),
});
export type BookCardFinding = z.infer<typeof bookCardFindingSchema>;

/** The layout a change lays a page out on. A saved layout carries its own name; the built-in ones the client names. */
export const bookCardLayoutSchema = z.object({
  kind: z.enum(['template', 'grid', 'saved', 'auto']),
  id: cardText(BOOK_PAGE_CARD_LIMITS.layout),
  name: cardText(BOOK_PAGE_CARD_LIMITS.layout).nullable(),
});
export type BookCardLayout = z.infer<typeof bookCardLayoutSchema>;

/** `set_book_cover`'s arguments, null where the call leaves a part of the cover as it is. */
export const bookCardCoverSchema = z.object({
  template: bookAnyTemplateIdSchema.nullable(),
  photoId: idSchema.nullable(),
  title: z.string().max(MAX_BOOK_TITLE).nullable(),
  subtitle: z.string().max(MAX_BOOK_TITLE).nullable(),
});
export type BookCardCover = z.infer<typeof bookCardCoverSchema>;

export const bookPageCardSchema = z.object({
  kind: z.literal('bookPage'),
  journeyId: idSchema,
  change: z.enum(BOOK_PAGE_CARD_CHANGES),
  /** The book's version the change was checked against; null for a journey without a book. */
  baseVersion: cardCountSchema.nullable(),
  /**
   * The pages the change works on, as they stand before it: the page edited,
   * the cover, the page moved, the pages deleted, the page new ones follow.
   * Once applied, the pages as the change left them, new ones included.
   */
  pages: z.array(bookCardPageSchema).max(BOOK_OP_LIMITS.pagesPerCall),
  /** How many pages the change adds or deletes; for a new book, its pages. */
  count: cardCountSchema,
  /** Where a moved page lands among the double pages, from 1. */
  movedTo: z.number().int().min(1).max(MAX_SPREADS).nullable(),
  /**
   * `edit_book_page`'s operations, to draw the page after where the card has
   * no `after` or the Studio's book moved on from `baseVersion`; empty for
   * another tool, when too long to carry, or when the page after needs their
   * room.
   */
  ops: z.array(bookPageOpSchema).max(BOOK_OP_LIMITS.opsPerCall),
  cover: bookCardCoverSchema.nullable(),
  /**
   * The page an edit or the cover leaves, as the server's trial of the change
   * made it with the journey's photos, words and figures: a caption from its
   * photo's caption, a text from its entry, a map from the route. The Studio
   * draws the page after from it while its book is at `baseVersion`. Absent
   * on a card from before it, on a page too heavy to carry and on another
   * tool's card, where the Studio runs `ops` or `cover` on its own book, as
   * it does once its book moved on; absent once applied, where it draws the
   * page as it is. One a later build cannot read drops itself, never the card.
   */
  after: bookSpreadSchema.optional().catch(undefined),
  layout: bookCardLayoutSchema.nullable(),
  /** Photos the change brings onto its pages that were not on them. */
  photosAdded: cardCountSchema,
  /** The check's findings on the pages after the change, the most severe first. */
  findings: z.array(bookCardFindingSchema).max(BOOK_PAGE_CARD_LIMITS.findings),
  /** Severe findings and warnings past those; the info ones past them are not counted. */
  moreFindings: cardCountSchema,
});
export type BookPageCard = z.infer<typeof bookPageCardSchema>;
