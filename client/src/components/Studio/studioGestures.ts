import type { BookElement, BookFrame, BookSpread } from '@trek/shared';
import { expandToGroups, isWholeGroup } from '@trek/shared';

/**
 * The geometry behind the sheet's gestures that is worth testing on its own:
 * resizing a box from a handle (with the aspect held on Shift), carrying the
 * frames inside it along, and what a marquee picks.
 */

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** About the smallest thing worth having on a page, in millimetres. */
export const MIN_FRAME_MM = 4;

/** The box around frames. */
export function boxOf(frames: readonly BookFrame[]): BookFrame {
  const x = Math.min(...frames.map((f) => f.x));
  const y = Math.min(...frames.map((f) => f.y));
  const right = Math.max(...frames.map((f) => f.x + f.w));
  const bottom = Math.max(...frames.map((f) => f.y + f.h));
  return { x, y, w: right - x, h: bottom - y };
}

/**
 * A box dragged by one of its handles by `dx`/`dy` millimetres.
 *
 * The opposite edge stays where it was, and a box never turns inside out: it
 * stops at the minimum size against that edge. With `keepAspect` a corner
 * keeps the box's proportions, following whichever of the two directions the
 * pointer went further in, and an edge handle grows the other side about the
 * middle, the way design tools do it.
 */
export function resizeBox(
  base: BookFrame,
  handle: HandleId,
  by: { dx: number; dy: number },
  keepAspect: boolean
): BookFrame {
  const side = sidesOf(handle);
  const w = base.w + (side.east ? by.dx : side.west ? -by.dx : 0);
  const h = base.h + (side.south ? by.dy : side.north ? -by.dy : 0);
  const size =
    keepAspect && base.w > 0 && base.h > 0
      ? heldSize(base, side, w, h)
      : { w: Math.max(w, MIN_FRAME_MM), h: Math.max(h, MIN_FRAME_MM) };
  return placed(base, side, size);
}

interface Sides {
  west: boolean;
  east: boolean;
  north: boolean;
  south: boolean;
}

const sidesOf = (handle: HandleId): Sides => ({
  west: handle.includes('w'),
  east: handle.includes('e'),
  north: handle.includes('n'),
  south: handle.includes('s'),
});

/** The size with the base's proportions kept, never under the minimum on either side. */
function heldSize(base: BookFrame, side: Sides, w: number, h: number): { w: number; h: number } {
  const ratio = base.w / base.h;
  const across = side.west || side.east;
  const down = side.north || side.south;
  // On a corner, whichever way the pointer went further leads and the other follows it.
  const widthLeads = across && (!down || Math.abs(w / base.w - 1) >= Math.abs(h / base.h - 1));
  const width = Math.max(widthLeads ? w : h * ratio, MIN_FRAME_MM, MIN_FRAME_MM * ratio);
  return { w: width, h: width / ratio };
}

/** Where the resized box sits: against the edges that did not move, centred on an axis no handle moved. */
function placed(base: BookFrame, side: Sides, size: { w: number; h: number }): BookFrame {
  const x = side.west ? base.x + base.w - size.w : side.east ? base.x : base.x + (base.w - size.w) / 2;
  const y = side.north ? base.y + base.h - size.h : side.south ? base.y : base.y + (base.h - size.h) / 2;
  return { x, y, w: size.w, h: size.h };
}

/** A frame inside `from` carried into `to`, scaled with it. */
export function mapFrame(frame: BookFrame, from: BookFrame, to: BookFrame): BookFrame {
  const sx = from.w > 0 ? to.w / from.w : 1;
  const sy = from.h > 0 ? to.h / from.h : 1;
  return {
    x: to.x + (frame.x - from.x) * sx,
    y: to.y + (frame.y - from.y) * sy,
    w: Math.max(frame.w * sx, 0.5),
    h: Math.max(frame.h * sy, 0.5),
  };
}

/** The rectangle between two points, whichever way it was dragged. */
export function rectBetween(ax: number, ay: number, bx: number, by: number): BookFrame {
  return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
}

const intersects = (a: BookFrame, b: BookFrame) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const contains = (outer: BookFrame, inner: BookFrame) =>
  outer.x <= inner.x &&
  outer.y <= inner.y &&
  outer.x + outer.w >= inner.x + inner.w &&
  outer.y + outer.h >= inner.y + inner.h;

/**
 * What a marquee picks: every element it touches, with its whole group.
 *
 * Locked and hidden elements are left out, as in every design tool. So is an
 * element that holds the whole marquee inside it: a page-sized photo behind
 * everything would otherwise be caught by every marquee drawn over it, which
 * is the one thing nobody drawing one ever wants.
 */
export function marqueeHits(spread: BookSpread, rect: BookFrame): string[] {
  if (rect.w <= 0 && rect.h <= 0) return [];
  const hits = spread.elements
    .filter((e) => !e.locked && !e.hidden)
    .filter((e) => intersects(rect, e.frame) && !contains(e.frame, rect))
    .map((e) => e.id);
  return expandToGroups(spread, hits);
}

export const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Where each handle sits on its box, as percentages from its top left corner, and the cursor it shows. */
type HandlePlace = Record<'x' | 'y' | 'cursor', string>;

export const HANDLE_POS: Record<HandleId, HandlePlace> = {
  nw: { x: '0%', y: '0%', cursor: 'nwse-resize' },
  n: { x: '50%', y: '0%', cursor: 'ns-resize' },
  ne: { x: '100%', y: '0%', cursor: 'nesw-resize' },
  e: { x: '100%', y: '50%', cursor: 'ew-resize' },
  se: { x: '100%', y: '100%', cursor: 'nwse-resize' },
  s: { x: '50%', y: '100%', cursor: 'ns-resize' },
  sw: { x: '0%', y: '100%', cursor: 'nesw-resize' },
  w: { x: '0%', y: '50%', cursor: 'ew-resize' },
};

/** What the selection is, for the chrome: several, their box, one whole group, anything movable. */
export function selectionShape(spread: BookSpread, sel: readonly BookElement[]) {
  const many = sel.length > 1;
  return {
    many,
    box: many ? boxOf(sel.map((e) => e.frame)) : null,
    asGroup:
      many &&
      isWholeGroup(
        spread,
        sel.map((e) => e.id)
      ),
    anyMovable: sel.some((e) => !e.locked),
  };
}

/** The outline class of one selected element: quieter as a member of several, marked when picked inside its group. */
export function selectClass(many: boolean, el: BookElement, enteredGroup: string | null): string {
  const inside = el.group !== undefined && el.group === enteredGroup;
  return ['st-select', many ? 'is-member' : '', inside ? 'is-inside' : ''].filter(Boolean).join(' ');
}
