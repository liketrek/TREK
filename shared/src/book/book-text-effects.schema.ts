import {
  bookLinearPaintSchema,
  bookPatternPaintSchema,
  bookRadialPaintSchema,
  type BookPaint,
} from './book-paint.schema';

import { z } from 'zod';

/**
 * What a text can be besides words in a face: outlined, given a hard shadow,
 * set on a marker band, bent along an arc or round a circle, filled with a
 * photograph, set in capitals or small caps, sat at the top, middle or foot of
 * its frame, and shrunk to fit it.
 *
 * ── Why every field is optional ─────────────────────────────────────────────
 *
 * The fields are merged into the text element (book.schema.ts) and none of
 * them has a default. A text written before they existed parses to exactly
 * the object it was, so the stored book does not grow a key on its next save,
 * and an absent field means what it always meant: no effect. Removing an
 * effect is `null`, which reads the same as absent.
 *
 * ── Why each one is drawn the way it is ────────────────────────────────────
 *
 * All of them print as vectors (TextEffectsView.tsx in the client): the shadow
 * is a second copy of the words, offset, never a blur; the outline is a
 * stroked copy laid under the fill, so it grows outwards and never eats the
 * letter; the band is a span background; a curve is SVG `textPath` on a path
 * computed in millimetres; a photo fill is the words as an SVG clip over an
 * `<image>`, which the print view waits for. Nothing here asks the renderer to
 * measure, so the page stays synchronous: a fitted size is solved when the
 * text is edited and stored (book-text-fit.ts).
 *
 * ── The fill and the paint system ──────────────────────────────────────────
 *
 * `fillPaint` takes a solid colour with its own alpha, a photograph, or one
 * of the book's paints of more than one colour: a linear or radial gradient or
 * a pattern, in exactly the shape a shape or a page takes them, so one picker
 * and one renderer serve all three. A gradient or pattern fill is drawn as SVG
 * like a photo fill, the paint clipped to the letters.
 */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');
const alpha = z.number().min(0).max(1);

/** How the letters are cased. `smallcaps` sets the lower case as small capitals. */
export const BOOK_TEXT_TRANSFORMS = ['none', 'upper', 'lower', 'smallcaps'] as const;
export type BookTextTransform = (typeof BOOK_TEXT_TRANSFORMS)[number];

/** Where the lines sit in the frame, top to bottom. */
export const BOOK_TEXT_VALIGNS = ['top', 'middle', 'bottom'] as const;
export type BookTextVAlign = (typeof BOOK_TEXT_VALIGNS)[number];

/** A line round each letter. `width` is millimetres outside the letter. */
export const bookTextOutlineSchema = z.object({
  color: hex,
  width: z.number().min(0.05).max(6),
});
export type BookTextOutline = z.infer<typeof bookTextOutlineSchema>;

/** A hard shadow: the words again, offset by `dx`/`dy` millimetres behind them. No blur, ever. */
export const bookTextShadowSchema = z.object({
  dx: z.number().min(-30).max(30),
  dy: z.number().min(-30).max(30),
  color: hex,
  alpha: alpha.default(1),
});
export type BookTextShadow = z.infer<typeof bookTextShadowSchema>;

/** A marker band behind each line of words, `padX`/`padY` millimetres round them. */
export const bookTextHighlightSchema = z.object({
  color: hex,
  alpha: alpha.default(1),
  padX: z.number().min(0).max(20).default(1.2),
  padY: z.number().min(0).max(20).default(0.3),
  radius: z.number().min(0).max(20).default(0),
});
export type BookTextHighlight = z.infer<typeof bookTextHighlightSchema>;

/**
 * Words on a curve. `arc` bends a line across the frame, up for a positive
 * `bend` and down for a negative one, a half circle at 100; `circle` runs the
 * words round the frame's inscribed circle with their middle at `start`
 * degrees, 0 at the top and clockwise.
 */
export const BOOK_TEXT_CURVES = ['arc', 'circle'] as const;
export const bookTextCurveSchema = z.object({
  type: z.enum(BOOK_TEXT_CURVES),
  bend: z.number().min(-100).max(100).default(40),
  start: z.number().min(-180).max(180).default(0),
});
export type BookTextCurve = z.infer<typeof bookTextCurveSchema>;

/**
 * What fills the letters in place of `color`: a colour with its own alpha (0
 * leaves an outline only), a photograph, or a gradient or pattern.
 */
export const bookTextFillSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: hex, alpha: alpha.default(1) }),
  z.object({
    type: z.literal('photo'),
    /** `trek_photos.id`, as a photo element keeps it. */
    photoId: z.number().int().positive(),
    focalX: z.number().min(0).max(1).default(0.5),
    focalY: z.number().min(0).max(1).default(0.5),
    zoom: z.number().min(1).max(4).default(1),
  }),
  bookLinearPaintSchema,
  bookRadialPaintSchema,
  bookPatternPaintSchema,
]);
export type BookTextFill = z.infer<typeof bookTextFillSchema>;

/** The letters' gradient or pattern, as the paint a shape would take, or null for any other fill. */
export function bookTextPaintFill(el: { fillPaint?: BookTextFill | null }): BookPaint | null {
  const fill = el.fillPaint;
  return fill && (fill.type === 'linear' || fill.type === 'radial' || fill.type === 'pattern') ? fill : null;
}

/** `shrink` sets the text at the largest size up to `fitMax` that holds the frame, solved on edit and stored in `size`. */
export const BOOK_TEXT_FITS = ['none', 'shrink'] as const;

/** The largest text size, in points: a word across a whole cover. */
export const MAX_BOOK_TEXT_SIZE = 400;

/** The effect fields of a text element, merged into its schema. */
export const BOOK_TEXT_EFFECT_FIELDS = {
  transform: z.enum(BOOK_TEXT_TRANSFORMS).optional(),
  vAlign: z.enum(BOOK_TEXT_VALIGNS).optional(),
  outline: bookTextOutlineSchema.nullable().optional(),
  shadow: bookTextShadowSchema.nullable().optional(),
  highlight: bookTextHighlightSchema.nullable().optional(),
  curve: bookTextCurveSchema.nullable().optional(),
  fillPaint: bookTextFillSchema.nullable().optional(),
  fit: z.enum(BOOK_TEXT_FITS).optional(),
  /** The size a fitted text is set at when its frame holds it: the size the person chose. */
  fitMax: z.number().min(4).max(MAX_BOOK_TEXT_SIZE).optional(),
};

/** The effect fields as one object, what a renderer or a check reads off a text. */
export interface BookTextEffects {
  transform?: BookTextTransform;
  vAlign?: BookTextVAlign;
  outline?: BookTextOutline | null;
  shadow?: BookTextShadow | null;
  highlight?: BookTextHighlight | null;
  curve?: BookTextCurve | null;
  fillPaint?: BookTextFill | null;
  fit?: (typeof BOOK_TEXT_FITS)[number];
  fitMax?: number;
}

/**
 * Whether a text is drawn as SVG rather than as a box of HTML type: on a
 * curve, or filled with a photograph, a gradient or a pattern. Such a text is
 * set line by line as written, never wrapped, which is what word art wants and
 * what the checks measure it by.
 */
export function bookTextIsDrawn(el: BookTextEffects): boolean {
  return !!el.curve || el.fillPaint?.type === 'photo' || !!bookTextPaintFill(el);
}
