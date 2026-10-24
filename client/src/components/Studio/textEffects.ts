import type { BookSpread, BookTextElement } from '@trek/shared';
import { readableInk } from '@trek/shared';

/**
 * The arithmetic behind TextEffectsView, kept apart from the component so it
 * can be read and tested without a DOM: which texts take the effect path at
 * all, the colours with their alpha, where each line of a drawn text sits and
 * how a photo covers the letters it fills.
 */

/** Whether a text has anything SpreadView's plain text does not draw. A plain one keeps the plain path. */
export function hasTextEffects(el: BookTextElement): boolean {
  return (
    (!!el.transform && el.transform !== 'none') ||
    (!!el.vAlign && el.vAlign !== 'top') ||
    !!el.outline ||
    !!el.shadow ||
    !!el.highlight ||
    !!el.curve ||
    !!el.fillPaint
  );
}

/** `#rrggbb` with an alpha, as CSS and SVG both take it. Fully opaque stays the hex itself. */
export function withAlpha(hex: string, alpha = 1): string {
  if (alpha >= 1) return hex;
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, alpha)})`;
}

/** The colour the letters are filled with, or null when a photograph, a gradient or a pattern fills them. */
export function letterFill(el: BookTextElement): string | null {
  const fill = el.fillPaint;
  if (!fill) return el.color;
  return fill.type === 'solid' ? withAlpha(fill.color, fill.alpha) : null;
}

/** Hollow letters: a solid fill of no alpha, which leaves the outline alone on the page. */
export function isHollow(el: BookTextElement): boolean {
  return el.fillPaint?.type === 'solid' && el.fillPaint.alpha === 0;
}

/**
 * How wide an outline's stroke is drawn, in millimetres. A stroke is centred
 * on the letter's edge and the fill covers its inner half, so a solid letter is
 * stroked twice the outline's width; a hollow one shows the whole stroke, so it
 * is stroked at the width itself. Zero without an outline.
 */
export function outlineStrokeMm(el: BookTextElement): number {
  if (!el.outline) return 0;
  return isHollow(el) ? el.outline.width : el.outline.width * 2;
}

/** Points to millimetres, the unit a drawn text's SVG is laid out in. */
export const ptToMm = (pt: number) => (pt * 25.4) / 72;

/** The CSS of a text's case. */
export function caseStyle(el: BookTextElement): {
  textTransform?: 'uppercase' | 'lowercase';
  fontVariantCaps?: 'small-caps';
} {
  if (el.transform === 'upper') return { textTransform: 'uppercase' };
  if (el.transform === 'lower') return { textTransform: 'lowercase' };
  if (el.transform === 'smallcaps') return { fontVariantCaps: 'small-caps' };
  return {};
}

/** The SVG anchor of a text's alignment, in the page's own left to right coordinates; justified sets from the start. */
const anchorOf = (align: BookTextElement['align']): 'start' | 'middle' | 'end' =>
  align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
/** How far across the frame, and along a curve, each anchor sits. */
const ACROSS = { start: 0, middle: 0.5, end: 1 } as const;
/** How far down the frame's spare room the block of lines sits. */
const DOWN = { top: 0, middle: 0.5, bottom: 1 } as const;

/** Where a drawn line starts and how it is anchored, from the text's alignment. */
export function lineAnchor(
  align: BookTextElement['align'],
  w: number
): { x: number; anchor: 'start' | 'middle' | 'end' } {
  const anchor = anchorOf(align);
  return { x: w * ACROSS[anchor], anchor };
}

/** The same anchor along a curve: where on the path the words are pinned. */
export function curveAnchor(align: BookTextElement['align']): { offset: string; anchor: 'start' | 'middle' | 'end' } {
  const anchor = anchorOf(align);
  return { offset: `${ACROSS[anchor] * 100}%`, anchor };
}

/**
 * The centre line of each line of a drawn text, in millimetres from the
 * frame's top: the lines stacked at the text's leading, the block set at the
 * top, middle or foot of the frame. Drawn with `dominant-baseline: central`,
 * which centres the letters on these lines.
 */
export function lineCentres(
  count: number,
  fontMm: number,
  leading: number,
  h: number,
  vAlign: BookTextElement['vAlign']
): number[] {
  const lineH = fontMm * leading;
  const total = lineH * count;
  const top = (h - total) * DOWN[vAlign ?? 'top'];
  return Array.from({ length: count }, (_, i) => top + lineH * i + lineH / 2);
}

/**
 * How a photograph lies under the letters it fills: a box `zoom` times the
 * frame, moved so the focal point stays where it is wanted, and the picture
 * cropped into that box from the side the focal point is on.
 */
export function photoCover(
  w: number,
  h: number,
  fill: { focalX: number; focalY: number; zoom: number }
): { x: number; y: number; width: number; height: number; preserveAspectRatio: string } {
  const width = w * fill.zoom;
  const height = h * fill.zoom;
  const side = (v: number) => {
    if (v < 0.34) return 'Min';
    return v > 0.66 ? 'Max' : 'Mid';
  };
  return {
    x: (w - width) * fill.focalX,
    y: (h - height) * fill.focalY,
    width,
    height,
    preserveAspectRatio: `x${side(fill.focalX)}Y${side(fill.focalY)} slice`,
  };
}

/** An id fit for `url(#…)`, from React's useId, which carries colons. */
export function svgId(prefix: string, reactId: string): string {
  return `${prefix}${reactId.replace(/[^A-Za-z0-9_-]/g, '')}`;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/** An outline as it is first switched on: a contrasting line about a twentieth of the letter height. */
export function defaultOutline(el: BookTextElement): NonNullable<BookTextElement['outline']> {
  return { color: readableInk(el.color), width: Math.max(0.1, r2(ptToMm(el.size) * 0.05)) };
}

/** A hard shadow as it is first switched on: offset down and to the right by a twelfth of the letter height. */
export function defaultShadow(el: BookTextElement): NonNullable<BookTextElement['shadow']> {
  const off = Math.max(0.2, r2(ptToMm(el.size) * 0.08));
  return { dx: off, dy: off, color: readableInk(el.color), alpha: 1 };
}

/** A band as it is first switched on: a contrasting ground with room of a quarter em either side. */
export function defaultBand(el: BookTextElement): NonNullable<BookTextElement['highlight']> {
  const em = ptToMm(el.size);
  return { color: readableInk(el.color), alpha: 1, padX: r2(em * 0.25), padY: r2(em * 0.06), radius: 0 };
}

/** The photo a photo fill starts from: the first picture on the page, else the first of the journey. */
export function firstFillPhoto(spread: BookSpread | undefined, gallery: readonly { photoId: number }[]): number | null {
  const onPage = spread?.elements.find((e) => e.kind === 'photo' && e.photoId != null);
  if (onPage?.kind === 'photo' && onPage.photoId != null) return onPage.photoId;
  return gallery[0]?.photoId ?? null;
}
