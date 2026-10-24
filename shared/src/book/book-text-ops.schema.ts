import { idSchema } from '../common/primitives.schema';
import { BOOK_LOCKUP_ROLES } from './book-lockup-roles';
import { BOOK_LOCKUPS } from './book-lockups.data';
import { BOOK_TEXT_EFFECT_FIELDS } from './book-text-effects.schema';

import { z } from 'zod';

/**
 * The assistant's side of the text effects and the lockups: the effect fields
 * a `style` or an `add` of a text may set, and the `add_lockup` operation.
 * The values are the document's own (book-text-effects.schema.ts); only a line
 * on what each means is added, since the tool schema is all a model reads.
 */

const f = BOOK_TEXT_EFFECT_FIELDS;
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');

/** The effect fields of a text's style, each left as it is when not named; null takes an effect off. */
export const TEXT_EFFECT_PROPS = {
  transform: f.transform,
  vAlign: f.vAlign,
  outline: f.outline.describe('Width in mm outside the letters.'),
  shadow: f.shadow.describe('Hard, never blurred; dx, dy in mm.'),
  highlight: f.highlight.describe('A marker band behind each line; pads in mm.'),
  curve: f.curve.describe('One line on an arc (bend > 0 arches up) or round a circle (start: degrees, 0 top).'),
  fillPaint: f.fillPaint.describe(
    'Replaces color: solid (alpha 0 is hollow, with an outline), a gallery photo, or a linear/radial gradient or pattern shaped as on a shape.',
  ),
  fit: f.fit.describe('shrink: the largest size up to size that holds the frame.'),
};

const lockupIds = BOOK_LOCKUPS.map((l) => l.id) as [string, ...string[]];

/** Every lockup by id; the ids say what each sets. */
export const bookLockupIdSchema = z
  .enum(lockupIds)
  .describe('A set title, badge, postmark, quote, caption or chapter mark.');

/** The words of a lockup, by the role each plays. */
export const bookLockupWordsSchema = z
  .strictObject(Object.fromEntries(BOOK_LOCKUP_ROLES.map((r) => [r, z.string().max(200).optional()])))
  .describe('Words by role (label as "Day"); a part without words is left out.');

/**
 * Set a lockup: a title, badge, postmark, quote, caption or chapter mark made
 * of a few texts and shapes that belong together. Placed in `box`, or at its
 * own size centred on the page; every text in it fits its frame.
 */
export const bookAddLockupOpSchema = z.strictObject({
  op: z.literal('add_lockup'),
  lockup: bookLockupIdSchema,
  words: bookLockupWordsSchema,
  box: z
    .strictObject({
      x: z.number().finite().min(-10000).max(10000),
      y: z.number().finite().min(-10000).max(10000),
      w: z.number().finite().min(1).max(10000),
      h: z.number().finite().min(1).max(10000),
    })
    .optional(),
  ink: hex.optional(),
  accent: hex.describe('Best taken from the photos.').optional(),
  photoId: idSchema.describe('Fills the letters of photo-word.').optional(),
});
export type BookAddLockupOp = z.infer<typeof bookAddLockupOpSchema>;
