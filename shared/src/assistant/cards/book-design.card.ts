import { BOOK_DESIGN_SKIP_REASONS } from '../../book/book-design-tools.schema';
import { bookDesignIdSchema, bookSpreadIdSchema } from '../../book/book-ops.schema';
import { BOOK_FONTS_IDS } from '../../book/book.schema';
import { BOOK_DESIGN_STYLES } from '../../book/design/design-directives.schema';
import { BOOK_DESIGN_ACTIONS } from '../../book/design/design-merge';
import { BOOK_DESIGN_BEATS } from '../../book/design/design-pacing';
import { idSchema } from '../../common/primitives.schema';
import { cardCountSchema, cardHexColorSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A whole-book design as the Studio's chat shows it: the book's look (style,
 * paper, ink, accent, the two typefaces) and the plan page by page, what
 * each page becomes and how many findings the server's check left on it.
 * `none` is the answer of `design_book` (a draft, nothing proposed yet),
 * `proposed` the held `apply_book_design`, `applied` its receipt with the
 * revision that takes it back and the pages it left as they were. The pages
 * themselves are drawn from the draft (GET /api/journeys/:id/book-designs/:designId),
 * never carried in the card.
 */

export const BOOK_DESIGN_CARD_LIMITS = { spreads: 120, chapter: 40 } as const;

export const BOOK_DESIGN_CARD_CHANGES = ['none', 'proposed', 'applied'] as const;

/** One page of the plan as a card names it. */
export const bookDesignCardSpreadSchema = z.object({
  spreadId: bookSpreadIdSchema,
  index: cardCountSchema,
  action: z.enum(BOOK_DESIGN_ACTIONS),
  beat: z.enum(BOOK_DESIGN_BEATS),
  chapter: cardText(BOOK_DESIGN_CARD_LIMITS.chapter).nullable(),
  entryId: idSchema.nullable(),
  photoCount: cardCountSchema,
  severe: cardCountSchema,
  warn: cardCountSchema,
});
export type BookDesignCardSpread = z.infer<typeof bookDesignCardSpreadSchema>;

export const bookDesignCardSchema = z.object({
  kind: z.literal('bookDesign'),
  change: z.enum(BOOK_DESIGN_CARD_CHANGES),
  journeyId: idSchema,
  designId: bookDesignIdSchema,
  /** The book's version the draft was made against; null for a journey without a book. */
  baseVersion: cardCountSchema.nullable(),
  style: z.enum(BOOK_DESIGN_STYLES),
  paper: cardHexColorSchema,
  ink: cardHexColorSchema,
  accent: cardHexColorSchema,
  heading: z.enum(BOOK_FONTS_IDS),
  body: z.enum(BOOK_FONTS_IDS),
  spreads: z.array(bookDesignCardSpreadSchema).max(BOOK_DESIGN_CARD_LIMITS.spreads),
  /** Plan pages past the ones listed. */
  more: cardCountSchema,
  /** Photos of the journey the design left out. */
  leftOut: cardCountSchema,
  /** Once applied: the revision the undo restores. */
  revisionId: idSchema.nullable(),
  /** Once applied: the pages the apply left as they were, and why. */
  skipped: z
    .array(z.object({ spreadId: bookSpreadIdSchema, reason: z.enum(BOOK_DESIGN_SKIP_REASONS) }))
    .max(BOOK_DESIGN_CARD_LIMITS.spreads),
});
export type BookDesignCard = z.infer<typeof bookDesignCardSchema>;
