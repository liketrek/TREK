import type { BookTextCurve } from './book-text-effects.schema';

/**
 * The line a curved text runs along, in the millimetres of its frame.
 *
 * Both the page and the checks read it: the page lays the words on it with SVG
 * `textPath`, the checks compare its length with what the words need. It is
 * computed here rather than in the renderer so the two can never disagree on
 * how long a line is.
 *
 * The frame's SVG is drawn with a viewBox of its own size in millimetres, so a
 * user unit is a millimetre in both directions and an arc command means a
 * circle, never the ellipse it would turn into under a non-uniform scale.
 */
export interface BookTextCurvePath {
  /** SVG path data, in millimetres from the frame's top left. */
  d: string;
  /** The length of the line in millimetres. */
  length: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/** A point on a circle at `deg` degrees, 0 at the top and clockwise, as the page draws it. */
function onCircle(cx: number, cy: number, r: number, deg: number): string {
  const rad = (deg * Math.PI) / 180;
  return `${r2(cx + r * Math.sin(rad))} ${r2(cy - r * Math.cos(rad))}`;
}

/**
 * Where a curved text is laid.
 *
 * `arc`: a chord across the frame, inset by half an em on each side so the
 * first and last letter stay inside it, bowed by `bend` percent of half the
 * chord (a half circle at 100). Up is the arch of a rainbow, down a smile; the
 * letters always stand on the outside of the bow as read left to right, so
 * neither direction prints a word upside down. The bow is centred in the frame
 * with room for the letters above and below it.
 *
 * `circle`: the frame's inscribed circle, its radius brought in by the cap
 * height so the letters stand inside the frame, starting half a turn before
 * `start` so that the middle of the words, where they are anchored, sits at
 * `start`.
 */
export function bookTextCurvePath(curve: BookTextCurve, w: number, h: number, fontMm: number): BookTextCurvePath {
  if (curve.type === 'circle') {
    const r = Math.max(1, Math.min(w, h) / 2 - fontMm * 0.75);
    const from = curve.start - 180;
    const d = `M ${onCircle(w / 2, h / 2, r, from)} A ${r2(r)} ${r2(r)} 0 1 1 ${onCircle(w / 2, h / 2, r, from + 180)} A ${r2(r)} ${r2(r)} 0 1 1 ${onCircle(w / 2, h / 2, r, from + 360)}`;
    return { d, length: 2 * Math.PI * r };
  }

  const inset = Math.min(fontMm * 0.5, w * 0.1);
  const chord = Math.max(1, w - inset * 2);
  const x0 = r2(inset);
  const x1 = r2(inset + chord);
  const sag = (Math.max(-100, Math.min(100, curve.bend)) / 100) * (chord / 2);
  // The baseline through the middle of the frame, moved down by the bow so the
  // whole curve and the letters on it sit centred.
  const mid = h / 2 + fontMm * 0.35;
  if (Math.abs(sag) < 0.01) {
    const y = r2(mid);
    return { d: `M ${x0} ${y} L ${x1} ${y}`, length: chord };
  }
  const ends = r2(mid + sag / 2);
  const radius = (chord * chord) / 4 / (2 * Math.abs(sag)) + Math.abs(sag) / 2;
  // An arch runs clockwise over the top, a smile anticlockwise under it.
  const sweep = sag > 0 ? 1 : 0;
  const length = 2 * radius * Math.asin(Math.min(1, chord / (2 * radius)));
  return { d: `M ${x0} ${ends} A ${r2(radius)} ${r2(radius)} 0 0 ${sweep} ${x1} ${ends}`, length };
}
