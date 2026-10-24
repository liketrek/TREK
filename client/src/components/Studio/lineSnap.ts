/**
 * How a dragged point of a line settles: level or plumb when it comes within
 * a couple of degrees of either, and to 15 degree steps while Shift is held.
 * Measured against the point it hangs from, its neighbour on the line.
 */

type Pt = [number, number];

/** How near, in degrees, a segment comes to level or plumb before it is made so. */
const LEVEL_DEG = 2;
const STEP_DEG = 15;

/** The point dragged to `p`, held level, plumb or to a step against the point it hangs from. */
export function constrainPoint(p: Pt, anchor: Pt | undefined, stepped: boolean): Pt {
  if (!anchor) return p;
  const dx = p[0] - anchor[0];
  const dy = p[1] - anchor[1];
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return p;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  let snapped: number | null = null;
  if (stepped) snapped = Math.round(deg / STEP_DEG) * STEP_DEG;
  else {
    const square = Math.round(deg / 90) * 90;
    if (Math.abs(deg - square) <= LEVEL_DEG) snapped = square;
  }
  if (snapped === null) return p;
  const a = (snapped * Math.PI) / 180;
  return [anchor[0] + Math.cos(a) * len, anchor[1] + Math.sin(a) * len];
}
