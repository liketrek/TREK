import { z } from 'zod';

/**
 * A drawn line: a rule, a route across a map, an arrow from a caption to the
 * picture it is about, a hand-drawn squiggle under a title.
 *
 * ── Why its own kind ─────────────────────────────────────────────────────
 *
 * The rule the Studio always had is a hairline rectangle, and it stays: it
 * is a box, snaps like a box and every book made so far is full of them. A
 * box cannot point anywhere, though. A line has two ends that go where they
 * are put, a head on either end, a bend, and a body that can be dashed,
 * dotted, wavy or wobbled as though drawn by hand.
 *
 * ── Why the points are fractions of the frame ───────────────────────────
 *
 * The element keeps a frame like every other one, so it moves, turns, locks,
 * aligns and parks with no special case anywhere in the editor or the engine.
 * Its points are stored as fractions of that frame, so anything that moves or
 * scales the frame (a drag, the `frame` operation, a spread pasted into a
 * book of another size) carries the line along without knowing it is one.
 * Dragging an end moves the point and refits the frame around the points
 * (book-line.ts), which is the only place the two have to agree.
 */

const unit = z.number().finite().min(0).max(1);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected #rrggbb');

export const MAX_LINE_POINTS = 32;

/** What sits on an end: nothing, a filled head, an open chevron, a dot, a cross bar. */
export const BOOK_LINE_CAPS = ['none', 'arrow', 'open', 'dot', 'bar'] as const;
export type BookLineCap = (typeof BOOK_LINE_CAPS)[number];

/** A motif in the middle of a rule, the way a title is set between two hairlines. */
export const BOOK_LINE_ORNAMENTS = ['none', 'diamond', 'dot', 'star', 'sun', 'heart'] as const;
export type BookLineOrnament = (typeof BOOK_LINE_ORNAMENTS)[number];

export const BOOK_LINE_FIELDS = {
  kind: z.literal('line'),
  /** The points in order, as fractions of the frame. Two is a line, more a path. */
  points: z
    .array(z.object({ x: unit, y: unit }))
    .min(2)
    .max(MAX_LINE_POINTS)
    .default([
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 },
    ]),
  /** Straight between the points, or one smooth curve through them. */
  curve: z.enum(['straight', 'smooth']).default('straight'),
  stroke: hex.default('#141414'),
  /** Millimetres. Named as a shape's outline is, so every place that rescales one rescales the other. */
  strokeWidth: z
    .number()
    .finite()
    .min(0.05)
    .max(20)
    .transform((v) => Math.round(v * 100) / 100)
    .default(0.5),
  dash: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  /** The body of the line drawn as a wave or a zigzag along its course. */
  squiggle: z.enum(['none', 'wave', 'zigzag']).default('none'),
  startCap: z.enum(BOOK_LINE_CAPS).default('none'),
  endCap: z.enum(BOOK_LINE_CAPS).default('none'),
  /** How much it wavers, as if drawn by hand: 0 is ruled. Seeded by the element, so it wavers the same way every time. */
  wobble: z.number().min(0).max(1).default(0),
  ornament: z.enum(BOOK_LINE_ORNAMENTS).default('none'),
};
