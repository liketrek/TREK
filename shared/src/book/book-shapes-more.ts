import { z } from 'zod';

/**
 * The second shelf of shapes: the craft of a printed travel page rather than
 * its geometry. Arches to cut a photo into, paper cut-outs in the manner of
 * Matisse, postage stamps and postmarks, ribbons, tickets, speech bubbles,
 * arrows that curve, and the flourishes a title sits between.
 *
 * Kept apart from the first list in book.schema.ts so the two can grow
 * without touching each other, and appended behind it: a document only ever
 * stores the id, so the order matters to the panel alone.
 *
 * Every entry is a single filled outline. The client draws them from its
 * shape table (client/src/components/Studio/shapes-more.ts and friends), and a
 * test there holds that every id here has a path.
 */
export const BOOK_SHAPES_MORE = [
  // Arches, the frames a Mediterranean page is built from.
  'arch-tall',
  'arch-pointed',
  'arch-double',
  'arch-half',
  'arch-rainbow',

  // Paper cut-outs: leaves, coral and weed, wonky stars and suns.
  'leaf-palm',
  'leaf-oak',
  'leaf-long',
  'leaf-monstera',
  'coral-1',
  'coral-2',
  'seaweed',
  'star-organic',
  'sun-cutout',
  'organic-1',
  'organic-2',
  'organic-3',

  // Stamps, badges and the things a travel scrapbook is stuck with.
  'stamp-rect',
  'stamp-circle',
  'postmark',
  'rosette',
  'scallop-circle',
  'badge-shield',
  'label-tab',
  'ticket-stub',
  'sunburst-12',
  'sunburst-24',

  // Ribbons and bands.
  'ribbon-ends',
  'ribbon-arc',
  'wavy-band',
  'torn-strip',

  // Speech.
  'bubble-shout',
  'bubble-side',
  'bubble-capsule',

  // Arrows that are drawn rather than ruled.
  'arrow-curve',
  'arrow-circle',
  'arrow-notched',
  'arrow-thin',

  // Hearts and stars.
  'heart-round',
  'heart-pair',
  'star-rounded',
  'star-twinkle',
  'flower-8',

  // Photo frames.
  'frame-notched',
  'frame-chamfer',
  'frame-cushion',

  // Ornaments.
  'flourish-scroll',
  'laurel',
  'fleuron',
  'corner-flourish',
] as const;

/**
 * How the outline of a shape, or of a photo's cut, is finished.
 *
 * `straight` is the drawn outline as it is. The rest replace it with a cut
 * edge that bites into the shape by `edgeSize`: a zigzag of pinking shears,
 * scallops, a postage stamp's perforation, a wave, a torn sheet and the soft
 * irregular deckle of handmade paper.
 */
export const BOOK_EDGES = ['straight', 'zigzag', 'scallop', 'perforated', 'wavy', 'torn', 'deckle'] as const;
export type BookEdge = (typeof BOOK_EDGES)[number];

/**
 * The shapes an edge is cut along: the broad, convex ones, where a bite into
 * the outline stays inside it. A cut along a heart's notch or a star's
 * valleys folds over itself, so those keep their drawn outline.
 */
export const BOOK_EDGE_SHAPES = [
  'rect',
  'squircle',
  'ellipse',
  'capsule',
  'arch',
  'arch-tall',
  'half-circle',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'hexagon-flat',
  'octagon',
  'shield',
  'frame-chamfer',
  'frame-cushion',
  'organic-1',
  'organic-2',
  'organic-3',
] as const;

const EDGE_SET: ReadonlySet<string> = new Set(BOOK_EDGE_SHAPES);

/** Whether an edge is cut along this shape; null is a photo's plain rectangle. */
export function bookShapeTakesEdge(shape: string | null): boolean {
  return shape === null || EDGE_SET.has(shape);
}

/** The finest and the deepest edge, in millimetres. */
export const BOOK_EDGE_SIZE_MIN = 0.5;
export const BOOK_EDGE_SIZE_MAX = 30;

/**
 * The two fields a shape and a photo carry for their edge.
 *
 * Optional rather than defaulted: a document written before edges existed
 * reads exactly as it did, and parses back to exactly what was stored.
 */
export const BOOK_EDGE_FIELDS = {
  edge: z.enum(BOOK_EDGES).optional(),
  /** How deep the cut bites and, with it, how long one tooth is. Millimetres. */
  edgeSize: z
    .number()
    .finite()
    .min(BOOK_EDGE_SIZE_MIN)
    .max(BOOK_EDGE_SIZE_MAX)
    .transform((v) => Math.round(v * 100) / 100)
    .optional(),
};

/**
 * How wide each shape of this shelf is drawn against its height.
 *
 * The table stretches every outline to its frame, so a shape has no
 * proportions of its own once placed; these are the ones it was drawn at,
 * which is the frame the panel and the `add` operation give it and the box
 * its tile is drawn in. A client test holds them to the drawings.
 */
export const BOOK_SHAPE_ASPECT: Readonly<Record<(typeof BOOK_SHAPES_MORE)[number], number>> = {
  'arch-tall': 0.5,
  'arch-pointed': 0.53,
  'arch-double': 1.25,
  'arch-half': 0.63,
  'arch-rainbow': 2,
  'stamp-rect': 0.81,
  'stamp-circle': 1,
  postmark: 1,
  rosette: 0.76,
  'scallop-circle': 1,
  'badge-shield': 1.04,
  'label-tab': 2,
  'ticket-stub': 2.22,
  'sunburst-12': 1,
  'sunburst-24': 1,
  'ribbon-ends': 3.7,
  'ribbon-arc': 3.09,
  'wavy-band': 3.13,
  'torn-strip': 4.78,
  'bubble-shout': 1.02,
  'bubble-side': 1.43,
  'bubble-capsule': 2.08,
  'arrow-curve': 3.59,
  'arrow-circle': 1.12,
  'arrow-notched': 2,
  'arrow-thin': 5.56,
  'heart-round': 1.06,
  'heart-pair': 1.25,
  'star-rounded': 1.05,
  'star-twinkle': 1,
  'flower-8': 1,
  'frame-notched': 1,
  'frame-chamfer': 1,
  'frame-cushion': 1,
  'leaf-palm': 1.06,
  'leaf-oak': 0.46,
  'leaf-long': 0.22,
  'leaf-monstera': 1.11,
  'coral-1': 1.58,
  'coral-2': 1.45,
  seaweed: 0.38,
  'star-organic': 1.05,
  'sun-cutout': 0.98,
  'organic-1': 1.14,
  'organic-2': 0.86,
  'organic-3': 1.11,
  'flourish-scroll': 7.32,
  laurel: 1.19,
  fleuron: 1.29,
  'corner-flourish': 0.99,
};

/**
 * The size a new shape of this shelf arrives at: `side` across for a square
 * one, and the same area at its own proportions otherwise. Null for a shape of
 * the first shelf, which keeps the sizes it always had.
 */
export function bookShapeSize(shape: string, side: number): { w: number; h: number } | null {
  const aspect = (BOOK_SHAPE_ASPECT as Readonly<Record<string, number>>)[shape];
  if (aspect === undefined) return null;
  // Very long ones (a scroll, a thin arrow) are held to a band rather than a needle.
  const root = Math.sqrt(Math.min(aspect, 4));
  const w = side * root;
  return { w, h: w / aspect };
}
