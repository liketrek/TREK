import { BOOK_LINE_CAPS, BOOK_LINE_ORNAMENTS, MAX_LINE_POINTS } from './book-line.schema';
import { BOOK_EDGES, BOOK_EDGE_SIZE_MAX, BOOK_EDGE_SIZE_MIN } from './book-shapes-more';

import { z } from 'zod';

/**
 * What the book tools take for the second shelf of shapes: the cut edge a
 * shape or a photo can be given, and the drawn line. Joined into the props and
 * the new-element union of book-element-ops.schema.ts, so `add` and `style`
 * reach them as they reach every other kind.
 *
 * Each enum says in one line what its values draw, since the tool schema is
 * all a model reads of them (book-op-enums.ts has the rest).
 */

const mmIn = z.number().finite().min(-10000).max(10000);

export const bookEdgeSchema = z
  .enum(BOOK_EDGES)
  .describe(
    'A cut outline: zigzag, scallop, perforated (a stamp), wavy, torn, deckle (handmade paper); straight keeps it.',
  );

/** The edge of a shape or a photo, each left as it is when not named. */
export const BOOK_EDGE_PROPS = {
  edge: bookEdgeSchema.optional(),
  edgeSize: z
    .number()
    .finite()
    .min(BOOK_EDGE_SIZE_MIN)
    .max(BOOK_EDGE_SIZE_MAX)
    .describe('Depth of the cut in mm, 2 to 4 for a stamp.')
    .optional(),
};

const capSchema = z.enum(BOOK_LINE_CAPS).describe('An end: arrow, open (a chevron), dot, bar or none.');

/** Points on the spread, in millimetres, from the first end to the last. */
export const bookLinePointsInSchema = z
  .array(z.strictObject({ x: mmIn, y: mmIn }))
  .min(2)
  .max(MAX_LINE_POINTS)
  .describe('Points on the spread in mm, start to end.');

/** How a line is drawn, each field left as it is when not named: the style op's, and the look of a new one. */
export const LINE_PROPS = {
  opacity: z.number().min(0).max(1).optional(),
  stroke: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb')
    .optional(),
  strokeWidth: z.number().finite().min(0.05).max(20).describe('Weight in mm.').optional(),
  dash: z.enum(['solid', 'dashed', 'dotted']).optional(),
  curve: z.enum(['straight', 'smooth']).describe('smooth is one curve through the points.').optional(),
  squiggle: z.enum(['none', 'wave', 'zigzag']).describe('The body drawn as a wave or a zigzag.').optional(),
  startCap: capSchema.optional(),
  endCap: capSchema.optional(),
  wobble: z.number().min(0).max(1).describe('Hand-drawn waver, 0 to 1.').optional(),
  ornament: z.enum(BOOK_LINE_ORNAMENTS).describe('A motif in the middle, as on a divider.').optional(),
  /** Moves the points; the frame is fitted around them. */
  points: bookLinePointsInSchema.optional(),
};
