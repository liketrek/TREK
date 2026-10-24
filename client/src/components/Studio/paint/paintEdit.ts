import {
  MAX_PAINT_STOPS,
  PATTERN_SCALE,
  RADIAL_RADIUS,
  paintColours,
  parseHex,
  sortedStops,
  stopAlpha,
  toHex,
  type BookGradientPaint,
  type BookPaint,
  type BookPaintStop,
  type BookPattern,
} from '@trek/shared';

/**
 * The arithmetic of the paint picker, kept out of the components so it can
 * be tested on its own: switching between kinds without losing the colour,
 * stops added where they are clicked in the colour already there, angles
 * read off a pointer and snapped to the ones people mean.
 */

export type PaintKind = 'none' | 'solid' | 'gradient' | 'pattern';

const WHITE = '#ffffff';
const INK = '#111111';

export const kindOf = (paint: BookPaint | null): PaintKind =>
  !paint ? 'none' : paint.type === 'linear' || paint.type === 'radial' ? 'gradient' : paint.type;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Two colours mixed, `t` of the way from `a` to `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a.toLowerCase();
  const m = (x: number, y: number) => x + (y - x) * t;
  return toHex({ r: m(ca.r, cb.r), g: m(ca.g, cb.g), b: m(ca.b, cb.b) });
}

/** The colour a paint leads with: what a solid keeps when it becomes a gradient, and back. */
export function leadColour(paint: BookPaint | null, fallback = INK): string {
  return paintColours(paint)[0] ?? fallback;
}

/** A lighter partner for a colour, for the second stop of a fresh gradient or a pattern's ground. */
export function partnerOf(color: string, t = 0.65): string {
  const rgb = parseHex(color);
  if (!rgb) return WHITE;
  // Light colours get a darker partner, so the gradient never runs white into white.
  const light = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 200;
  return mixHex(color, light ? INK : WHITE, light ? 0.35 : t);
}

/** The angle a pattern looks right at when first picked: stripes on the diagonal, the rest square. */
export const PATTERN_ANGLE: Partial<Record<BookPattern, number>> = { stripes: 45, pinstripe: 0 };

/**
 * The paint of another kind, built from the one there is. `memory` holds the
 * last paint of each kind the picker showed, so going to gradient and back to
 * pattern returns the pattern as it was rather than a fresh default.
 */
export function paintAs(
  kind: PaintKind,
  from: BookPaint | null,
  memory: Partial<Record<PaintKind, BookPaint>> = {}
): BookPaint | null {
  if (kind === 'none') return null;
  const remembered = memory[kind];
  if (remembered) return remembered;
  const lead = leadColour(from);
  switch (kind) {
    case 'solid':
      return { type: 'solid', color: lead };
    case 'gradient':
      return {
        type: 'linear',
        angle: 180,
        stops: [
          { at: 0, color: lead },
          { at: 1, color: partnerOf(lead) },
        ],
      };
    case 'pattern':
      return { type: 'pattern', pattern: 'stripes', fg: lead, bg: partnerOf(lead, 0.82), scale: 1, angle: 45 };
  }
}

/** The colour a gradient shows at a point, alpha included, for a stop added there. */
export function colourAt(stops: readonly BookPaintStop[], at: number): { color: string; alpha: number } {
  const list = sortedStops(stops);
  const first = list[0];
  const last = list[list.length - 1];
  if (!first || !last) return { color: INK, alpha: 1 };
  if (at <= first.at) return { color: first.color.toLowerCase(), alpha: stopAlpha(first) };
  if (at >= last.at) return { color: last.color.toLowerCase(), alpha: stopAlpha(last) };
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1];
    const b = list[i];
    if (!a || !b || at > b.at) continue;
    const t = b.at === a.at ? 0 : (at - a.at) / (b.at - a.at);
    return { color: mixHex(a.color, b.color, t), alpha: r3(stopAlpha(a) + (stopAlpha(b) - stopAlpha(a)) * t) };
  }
  return { color: last.color.toLowerCase(), alpha: stopAlpha(last) };
}

const stopOf = (at: number, color: string, alpha: number): BookPaintStop =>
  alpha < 1 ? { at, color, alpha } : { at, color };

/** A stop added at `at` in the colour the gradient already has there. Null when the gradient is full. */
export function addStop(paint: BookGradientPaint, at: number): { paint: BookGradientPaint; index: number } | null {
  if (paint.stops.length >= MAX_PAINT_STOPS) return null;
  const pos = r3(clamp(at, 0, 1));
  const { color, alpha } = colourAt(paint.stops, pos);
  const stops = [...paint.stops, stopOf(pos, color, alpha)];
  return { paint: { ...paint, stops }, index: stops.length - 1 };
}

/** A gradient without one of its stops. A gradient keeps at least two. */
export function removeStop(paint: BookGradientPaint, index: number): BookGradientPaint {
  if (paint.stops.length <= 2 || index < 0 || index >= paint.stops.length) return paint;
  return { ...paint, stops: paint.stops.filter((_, i) => i !== index) };
}

/** One stop changed; its position kept between 0 and 1 and to three decimals. */
export function updateStop(paint: BookGradientPaint, index: number, patch: Partial<BookPaintStop>): BookGradientPaint {
  const stops = paint.stops.map((s, i) => {
    if (i !== index) return s;
    const next = { ...s, ...patch, at: r3(clamp(patch.at ?? s.at, 0, 1)) };
    if (next.alpha !== undefined && next.alpha >= 1) delete next.alpha;
    return next;
  });
  return { ...paint, stops };
}

/** The gradient run the other way. */
export function reverseStops(paint: BookGradientPaint): BookGradientPaint {
  return { ...paint, stops: paint.stops.map((s) => ({ ...s, at: r3(1 - s.at) })) };
}

/** Linear or radial, keeping the stops. */
export function gradientAs(paint: BookGradientPaint, type: 'linear' | 'radial'): BookGradientPaint {
  if (paint.type === type) return paint;
  return type === 'linear'
    ? { type: 'linear', angle: 180, stops: paint.stops }
    : { type: 'radial', cx: 0.5, cy: 0.5, r: 1, stops: paint.stops };
}

/** A whole-degree angle between 0 and 359. */
export function normAngle(deg: number): number {
  const a = Math.round(deg) % 360;
  return a < 0 ? a + 360 : a;
}

/**
 * The angle a pointer at (`dx`, `dy`) from the dial's centre points at, 0 up
 * and clockwise like the paint itself. Within a few degrees of a multiple of
 * 45 it lands on it, since those are the angles people mean; `fine` (a held
 * modifier) turns the snap off.
 */
export function dialAngle(dx: number, dy: number, fine = false): number {
  const raw = normAngle((Math.atan2(dx, -dy) * 180) / Math.PI);
  if (fine) return raw;
  const near = Math.round(raw / 45) * 45;
  return Math.abs(raw - near) <= 4 ? normAngle(near) : raw;
}

export const clampScale = (v: number) => r3(clamp(v, PATTERN_SCALE.min, PATTERN_SCALE.max));
export const clampRadius = (v: number) => r3(clamp(v, RADIAL_RADIUS.min, RADIAL_RADIUS.max));
export const clampUnit = (v: number) => r3(clamp(v, 0, 1));

/** A CSS gradient for the picker's own previews (the stop bar, the tab swatches): not for the page. */
export function cssStops(stops: readonly BookPaintStop[]): string {
  return sortedStops(stops)
    .map((s) => {
      const rgb = parseHex(s.color);
      const c = rgb ? `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${stopAlpha(s)})` : s.color;
      return `${c} ${Math.round(s.at * 1000) / 10}%`;
    })
    .join(', ');
}

/** A paint as a CSS background, for a preview chip in the picker. */
export function cssPaint(paint: BookPaint | null): string | undefined {
  if (!paint) return undefined;
  switch (paint.type) {
    case 'solid': {
      const rgb = parseHex(paint.color);
      return rgb ? `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${stopAlpha(paint)})` : paint.color;
    }
    case 'linear':
      return `linear-gradient(${paint.angle}deg, ${cssStops(paint.stops)})`;
    case 'radial':
      return `radial-gradient(circle at ${paint.cx * 100}% ${paint.cy * 100}%, ${cssStops(paint.stops)})`;
    case 'pattern':
      return paint.bg ?? undefined;
  }
}
