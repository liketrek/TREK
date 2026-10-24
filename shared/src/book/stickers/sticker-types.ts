/**
 * The shape of a sticker in the catalogue: a flat illustration drawn as
 * layered vector paths, with a few named colour slots a book can repaint.
 *
 * A sticker is data, not code. Each one is a list of layers painted back to
 * front inside its own drawing box, the way a cut-paper illustration is laid
 * up: a base colour, the shadow side as a darker flat shape over it, the lit
 * side as a paler one, the details on top. Nothing is blurred or filtered, so
 * every layer prints as a vector path at any size.
 *
 * The colours a book is likely to want to change are slots, numbered from 0:
 * a hibiscus has its petals, its centre and its leaves, and a book in its own
 * palette repaints those three and keeps the drawing. Shading is not a slot.
 * `shade` and `light` are a translucent black and white laid over whatever is
 * under them, which is why a recoloured petal keeps its fold.
 */

/** The themes the catalogue is grouped by, in the order the Studio lists them. */
export const BOOK_STICKER_THEMES = [
  'ephemera',
  'landmarks',
  'tropical',
  'mediterranean',
  'sea',
  'mountains',
  'nordic',
  'asia',
  'food',
  'paper',
  'doodles',
  'ornaments',
] as const;
export type BookStickerTheme = (typeof BOOK_STICKER_THEMES)[number];

/** The most colour slots a sticker has, and so the most colours a sticker element stores. */
export const MAX_STICKER_SLOTS = 4;

/**
 * What a layer is painted with.
 *
 * A number is a slot. `shade` and `light` are the flat shadow and highlight,
 * a translucent black and a translucent white over whatever lies under them.
 * `ink` is the near-black of a drawn outline, `paper` the white of a label or
 * a highlight that should stay white whatever is recoloured. Anything else is
 * a fixed `#rrggbb` that no recolouring touches (the brown of a trunk under a
 * palm a book has painted blue would only look wrong).
 */
export type BookStickerPaint = number | 'shade' | 'light' | 'ink' | 'paper' | `#${string}`;

/**
 * One painted path.
 *
 * `d` is an SVG path in the sticker's own box units. `o` is its opacity, 1 when
 * left out (0.18 for `shade`, 0.35 for `light`). With `w` the path is stroked
 * that many box units wide with round ends instead of filled, which is how a
 * hand-drawn arrow or a stitched line is drawn. `eo` fills by the even-odd rule,
 * for a shape with a hole cut through it.
 */
export interface BookStickerLayer {
  p: BookStickerPaint;
  d: string;
  o?: number;
  w?: number;
  eo?: 1;
}

/** A colour a book may change, by what it colours. */
export interface BookStickerSlot {
  /** One word for the inspector's tooltip and for the model: petals, sky, frame. */
  name: string;
  /** `#rrggbb`, the colour it is drawn in until somebody picks another. */
  color: string;
}

export interface BookStickerDef {
  /** Unique across the catalogue, lowerCamelCase; also the last part of its label key. */
  id: string;
  theme: BookStickerTheme;
  /** English search words: what it is, what it is of, where it belongs. */
  tags: readonly string[];
  /** One sentence for a model picking a sticker it cannot see. */
  descr: string;
  /** The drawing box, width then height, in the units the paths are written in. */
  box: readonly [number, number];
  slots: readonly BookStickerSlot[];
  layers: readonly BookStickerLayer[];
  /** Who drew it and under what terms. Every motif here is drawn for TREK. */
  license: 'in-house';
}
