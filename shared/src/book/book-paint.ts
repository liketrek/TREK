import { parseHex, toHex, type Rgb } from './book-colour';
import type { BookPaint, BookPaintStop } from './book-paint.schema';
import type { BookDocument, BookElement, BookShapeElement, BookSpread } from './book.schema';

/**
 * Reading and writing paint, the one place the old colour fields and the new
 * paint are kept in step.
 *
 * Every writer goes through `withShapePaint` and `withSpreadPaint`, the
 * Studio and the page operations alike, so a shape's `fill` and a page's
 * `background` always hold the colour that stands for its paint, and a paint
 * that the old fields can say whole (one opaque colour, the cover fade) is
 * stored in them alone, as it was before paint existed.
 */

/** The cover fade, as the stops `gradient: 'up' | 'down'` has always drawn. */
const FADE_STOPS = [
  { at: 0, alpha: 0 },
  { at: 0.46, alpha: 0.55 },
  { at: 1, alpha: 1 },
] as const;

const lower = (hex: string) => hex.toLowerCase();

/** A paint stop's alpha, 1 when it says none. */
export const stopAlpha = (stop: { alpha?: number }): number => stop.alpha ?? 1;

/** Stops in order along the gradient, so a renderer and a reader never meet them shuffled. */
export function sortedStops(stops: readonly BookPaintStop[]): BookPaintStop[] {
  return [...stops].sort((a, b) => a.at - b.at);
}

/** The paint a shape's old fields describe: its fill, faded towards one edge when `gradient` says so. */
export function legacyShapePaint(el: Pick<BookShapeElement, 'fill' | 'gradient'>): BookPaint | null {
  if (el.fill === null) return null;
  if (el.gradient === 'none') return { type: 'solid', color: lower(el.fill) };
  const color = lower(el.fill);
  return {
    type: 'linear',
    // 'up' is solid at the top, so the line runs towards the top: CSS's 0deg.
    angle: el.gradient === 'up' ? 0 : 180,
    stops: FADE_STOPS.map((s) => ({ at: s.at, color, alpha: s.alpha })),
  };
}

/** What fills a shape: its paint, or what its old fields say. Null is no fill. */
export function shapePaint(el: BookShapeElement): BookPaint | null {
  return el.paint ?? legacyShapePaint(el);
}

/** What fills a page: its paint, or its background colour. Null is the paper. */
export function spreadPaint(spread: Pick<BookSpread, 'background' | 'backgroundPaint'>): BookPaint | null {
  if (spread.backgroundPaint) return spread.backgroundPaint;
  return spread.background ? { type: 'solid', color: lower(spread.background) } : null;
}

/** The paper a see-through paint is read against. */
const PAPER: Rgb = { r: 255, g: 255, b: 255 };

/** A colour at an alpha, as it looks laid on the paper. */
function onPaper(hex: string, alpha: number): Rgb | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const a = Math.max(0, Math.min(1, alpha));
  const mix = (c: number, p: number) => p + (c - p) * a;
  return { r: mix(rgb.r, PAPER.r), g: mix(rgb.g, PAPER.g), b: mix(rgb.b, PAPER.b) };
}

/**
 * The one opaque colour that stands for a paint: what an old reader draws,
 * and what a contrast check measures against.
 *
 * A see-through colour is read as it looks on the paper. A gradient gives the
 * mix of its stops, each weighted by the stretch of the line it holds; a
 * pattern gives its ground, or its ink where it has none, since the ground is
 * what most of the box shows.
 */
export function paintFallbackHex(paint: BookPaint): string {
  switch (paint.type) {
    case 'solid':
      return stopAlpha(paint) >= 1 ? lower(paint.color) : toHex(onPaper(paint.color, stopAlpha(paint)) ?? PAPER);
    case 'pattern':
      return lower(paint.bg ?? paint.fg);
    default:
      return mixStops(sortedStops(paint.stops));
  }
}

function mixStops(stops: readonly BookPaintStop[]): string {
  let sum: Rgb = { r: 0, g: 0, b: 0 };
  let total = 0;
  stops.forEach((stop, i) => {
    const rgb = onPaper(stop.color, stopAlpha(stop));
    if (!rgb) return;
    const before = i === 0 ? stop.at : (stop.at - (stops[i - 1]?.at ?? 0)) / 2;
    const after = i === stops.length - 1 ? 1 - stop.at : ((stops[i + 1]?.at ?? 1) - stop.at) / 2;
    // A gradient whose stops all sit on one point still has a colour: theirs.
    const weight = before + after || 1;
    sum = { r: sum.r + rgb.r * weight, g: sum.g + rgb.g * weight, b: sum.b + rgb.b * weight };
    total += weight;
  });
  return toHex(total > 0 ? { r: sum.r / total, g: sum.g / total, b: sum.b / total } : PAPER);
}

/** Whether a paint is exactly the cover fade the old `gradient` field can say. */
function legacyFade(paint: BookPaint): { color: string; gradient: 'up' | 'down' } | null {
  if (paint.type !== 'linear' || (paint.angle !== 0 && paint.angle !== 180)) return null;
  const stops = sortedStops(paint.stops);
  const color = stops[0]?.color.toLowerCase();
  if (!color || stops.length !== FADE_STOPS.length) return null;
  const same = stops.every((s, i) => {
    const want = FADE_STOPS[i];
    return !!want && s.color.toLowerCase() === color && s.at === want.at && stopAlpha(s) === want.alpha;
  });
  return same ? { color, gradient: paint.angle === 0 ? 'up' : 'down' } : null;
}

const opaqueSolid = (paint: BookPaint): paint is Extract<BookPaint, { type: 'solid' }> =>
  paint.type === 'solid' && stopAlpha(paint) >= 1;

/**
 * A shape with this paint. Null takes the fill away. One opaque colour and the
 * cover fade go into `fill` and `gradient` alone; anything else is kept as
 * `paint`, with `fill` set to the colour that stands for it.
 */
export function withShapePaint<T extends BookShapeElement>(el: T, paint: BookPaint | null): T {
  const { paint: _old, ...rest } = el;
  if (paint === null) return { ...rest, fill: null, gradient: 'none' } as T;
  if (opaqueSolid(paint)) return { ...rest, fill: lower(paint.color), gradient: 'none' } as T;
  const fade = legacyFade(paint);
  if (fade) return { ...rest, fill: fade.color, gradient: fade.gradient } as T;
  return { ...rest, paint, fill: paintFallbackHex(paint), gradient: 'none' } as T;
}

/** A page with this paint. Null is the paper; one opaque colour is `background` alone, as before. */
export function withSpreadPaint<T extends BookSpread>(spread: T, paint: BookPaint | null): T {
  const { backgroundPaint: _old, ...rest } = spread;
  if (paint === null) return { ...rest, background: null } as T;
  if (opaqueSolid(paint)) return { ...rest, background: lower(paint.color) } as T;
  return { ...rest, backgroundPaint: paint, background: paintFallbackHex(paint) } as T;
}

/**
 * A page painted by hand: this paint, and the page's link to a theme colour
 * (`backgroundToken`) taken away, so the next theme applied leaves the colour
 * somebody chose. The `background` operation and the Studio's background
 * picker both paint a page through it.
 */
export function withSpreadPaintByHand(spread: BookSpread, paint: BookPaint | null): BookSpread {
  const { backgroundToken: _unlinked, ...rest } = spread;
  return withSpreadPaint(rest, paint);
}

/** Every colour a paint is made of, in the order it names them. */
export function paintColours(paint: BookPaint | null | undefined): string[] {
  if (!paint) return [];
  switch (paint.type) {
    case 'solid':
      return [lower(paint.color)];
    case 'pattern':
      return paint.bg ? [lower(paint.fg), lower(paint.bg)] : [lower(paint.fg)];
    default:
      return sortedStops(paint.stops).map((s) => lower(s.color));
  }
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const deg = (v: number) => `${Math.round(v)} deg`;
const colourWord = (color: string, alpha: number | undefined) =>
  alpha !== undefined && alpha < 1 ? `${lower(color)} at ${pct(alpha)}` : lower(color);

/** A paint in words, for describe_book_page: the kind, its colours and the numbers that place them. */
export function paintWords(paint: BookPaint): string {
  switch (paint.type) {
    case 'solid':
      return colourWord(paint.color, paint.alpha);
    case 'pattern':
      return `${paint.pattern} pattern, ${lower(paint.fg)} on ${paint.bg ? lower(paint.bg) : 'nothing (see-through)'}, scale ${paint.scale}, turned ${deg(paint.angle)}`;
    default: {
      const stops = sortedStops(paint.stops)
        .map((s) => `${colourWord(s.color, s.alpha)} at ${pct(s.at)}`)
        .join(', ');
      return paint.type === 'linear'
        ? `linear gradient towards ${deg(paint.angle)}: ${stops}`
        : `radial gradient from ${pct(paint.cx)} ${pct(paint.cy)}, radius ${paint.r}: ${stops}`;
    }
  }
}

/** The colours an element is drawn in, as they are stored. */
function elementColours(el: BookElement): string[] {
  switch (el.kind) {
    case 'photo':
      return [];
    case 'shape':
      return [...paintColours(shapePaint(el)), ...(el.stroke ? [lower(el.stroke)] : [])];
    case 'text':
    case 'icon':
      return [lower(el.color)];
    case 'sticker':
      return el.colors.map(lower);
    case 'line':
      return [lower(el.stroke)];
    default:
      return [lower(el.color), lower(el.accent)];
  }
}

/**
 * The book's own palette: the colours its pages and elements are drawn in,
 * most used first, so a colour chosen once is one click away on every page.
 */
export function bookColours(doc: BookDocument | null | undefined, limit = 8): string[] {
  const counts = new Map<string, number>();
  const add = (hex: string) => counts.set(hex, (counts.get(hex) ?? 0) + 1);
  for (const spread of doc?.spreads ?? []) {
    paintColours(spreadPaint(spread)).forEach(add);
    for (const el of spread.elements) elementColours(el).forEach(add);
  }
  return [...counts]
    .filter(([hex]) => parseHex(hex))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([hex]) => hex);
}
