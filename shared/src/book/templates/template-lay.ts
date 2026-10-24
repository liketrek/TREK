import { contrastRatio, requiredContrast } from '../book-colour';
import { withShapePaint } from '../book-paint';
import type { BookPaint } from '../book-paint.schema';
import { bookTextHasOwnGround } from '../book-text-findings';
import {
  bookElementSchema,
  type BookElement,
  type BookFrame,
  type BookPageSetup,
  type BookTextElement,
} from '../book.schema';
import { bookThemeColor } from '../theme/book-theme';
import type { BookColorToken, BookTheme } from '../theme/book-theme.schema';
import type {
  BookDecoratedTemplate,
  BookTemplateElement,
  BookTemplatePhotoRole,
  BookTemplateRole,
  BookTemplateTint,
} from './template-format';

/**
 * A template's fractions turned into millimetres on a page (template-format.ts
 * says what each number is a fraction of), its tints into the theme's colours,
 * and every element held to the document's contract on the way out.
 */

const r2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The measures of a page a template is laid on: one page's width and height, the shorter side, the bleed, how many pages across. */
export function templatePage(page: BookPageSetup, across: 1 | 2) {
  return {
    pw: page.pageWidth,
    ph: page.pageHeight,
    /** Every length but a frame's is a fraction of this. */
    unit: Math.min(page.pageWidth, page.pageHeight),
    bleed: page.bleed,
    across,
  };
}
type TemplatePage = ReturnType<typeof templatePage>;

/** Whether an element keeps its proportions when the page is not the shape it was drawn on. */
export function keepsProportions(el: Pick<BookTemplateElement, 'keep' | 'rotation' | 'kind'>): boolean {
  return el.keep === true || el.rotation % 360 !== 0 || el.kind === 'sticker';
}

/**
 * One axis of a frame in millimetres. An edge at or past the trim of the
 * sheet is a bleed, and lands on this page's bleed whatever the template's
 * page bled: three millimetres of a 210 mm page are not three of a 148 mm one.
 */
function axis(start: number, size: number, scale: number, pages: number, bleed: number): [number, number] {
  const end = start + size;
  const from = start <= 0 ? -bleed : start * scale;
  const to = end >= pages ? pages * scale + bleed : end * scale;
  return [from, Math.max(0.5, to - from)];
}

/** A frame in millimetres on the page. */
function templateFrame(el: BookTemplateElement, at: TemplatePage): BookFrame {
  const f = el.frame;
  if (keepsProportions(el)) {
    const w = f.w * at.unit;
    const h = f.h * at.unit;
    const cx = (f.x + f.w / 2) * at.pw;
    const cy = (f.y + f.h / 2) * at.ph;
    return { x: r2(cx - w / 2), y: r2(cy - h / 2), w: r2(w), h: r2(h) };
  }
  const [x, w] = axis(f.x, f.w, at.pw, at.across, at.bleed);
  const [y, h] = axis(f.y, f.h, at.ph, 1, at.bleed);
  return { x: r2(x), y: r2(y), w: r2(w), h: r2(h) };
}

/** A length of the template in millimetres (or points, for a type size). */
const len = (v: number, at: TemplatePage) => r2(v * at.unit);

/** An offset a shadow is moved by, kept inside the reach the document allows. */
const reach = (v: number, at: TemplatePage) => clamp(len(v, at), -30, 30);

type Loose = Record<string, unknown>;

/**
 * The smallest a template's type is set at on a page smaller than it was drawn
 * for: running text from 7 pt, a caption or a date line from 6 pt, the sizes a
 * printed page still reads at. Larger type scales with the page.
 */
const TYPE_FLOOR = { body: 7, line: 6 } as const;

function scaleText(el: Loose, at: TemplatePage, role: BookTemplateRole | undefined): void {
  const floor = role === 'body' ? TYPE_FLOOR.body : TYPE_FLOOR.line;
  const sized = (v: number) => clamp(Math.max(len(v, at), floor), 4, 400);
  if (typeof el.size === 'number') el.size = sized(el.size);
  if (typeof el.fitMax === 'number') el.fitMax = sized(el.fitMax);
  const outline = el.outline as { width: number } | null | undefined;
  if (outline) el.outline = { ...outline, width: clamp(len(outline.width, at), 0.05, 6) };
  const shadow = el.shadow as { dx: number; dy: number } | null | undefined;
  if (shadow) el.shadow = { ...shadow, dx: reach(shadow.dx, at), dy: reach(shadow.dy, at) };
  const band = el.highlight as { padX: number; padY: number; radius: number } | null | undefined;
  if (band) {
    el.highlight = {
      ...band,
      padX: clamp(len(band.padX, at), 0, 20),
      padY: clamp(len(band.padY, at), 0, 20),
      radius: clamp(len(band.radius, at), 0, 20),
    };
  }
}

function scalePhoto(el: Loose, at: TemplatePage): void {
  for (const key of ['border', 'cutout'] as const) {
    const edge = el[key] as { width: number } | null | undefined;
    if (edge) el[key] = { ...edge, width: clamp(len(edge.width, at), 0.1, 30) };
  }
  const shadow = el.shadow as { dx: number; dy: number } | null | undefined;
  if (shadow) el.shadow = { ...shadow, dx: reach(shadow.dx, at), dy: reach(shadow.dy, at) };
}

/** Every length of an element scaled from its fraction, kept inside the document's ranges. */
function scaleLengths(el: Loose, at: TemplatePage, role: BookTemplateRole | undefined): void {
  if (typeof el.radius === 'number') el.radius = Math.max(0, len(el.radius, at));
  if (typeof el.strokeWidth === 'number') {
    el.strokeWidth =
      el.kind === 'line' ? clamp(len(el.strokeWidth, at), 0.05, 20) : Math.max(0, len(el.strokeWidth, at));
  }
  if (typeof el.edgeSize === 'number') el.edgeSize = clamp(len(el.edgeSize, at), 0.5, 30);
  if (el.kind === 'text') scaleText(el, at, role);
  if (el.kind === 'photo') scalePhoto(el, at);
}

/*
 * ── Tints ───────────────────────────────────────────────────────────────
 */

type Colour = (token: BookColorToken) => string;

/** A colour object's `color` set from a token, the object kept as it is without one. */
function tinted<T extends { color: string }>(
  value: T | null | undefined,
  token: BookColorToken | undefined,
  colour: Colour,
) {
  return value && token ? { ...value, color: colour(token) } : value;
}

/** A paint's colours set from its tints. */
function tintedPaint(paint: BookPaint, tint: BookTemplateTint, colour: Colour): BookPaint {
  if (paint.type === 'pattern') {
    return {
      ...paint,
      ...(tint.fg ? { fg: colour(tint.fg) } : {}),
      ...(tint.bg && paint.bg !== null ? { bg: colour(tint.bg) } : {}),
    };
  }
  if (paint.type === 'solid') return tint.fill ? { ...paint, color: colour(tint.fill) } : paint;
  const stops = tint.stops;
  if (!stops) return paint;
  return {
    ...paint,
    stops: paint.stops.map((s, i) => {
      const t = stops[i];
      return t ? { ...s, color: colour(t) } : s;
    }),
  };
}

function tintPhoto(el: Loose, tint: BookTemplateTint, colour: Colour): void {
  el.border = tinted(el.border as { color: string } | null | undefined, tint.border, colour);
  el.shadow = tinted(el.shadow as { color: string } | null | undefined, tint.shadow, colour);
  el.cutout = tinted(el.cutout as { color: string } | null | undefined, tint.cutout, colour);
}

function tintText(el: Loose, tint: BookTemplateTint, colour: Colour): void {
  el.outline = tinted(el.outline as { color: string } | null | undefined, tint.outline, colour);
  el.shadow = tinted(el.shadow as { color: string } | null | undefined, tint.shadow, colour);
  el.highlight = tinted(el.highlight as { color: string } | null | undefined, tint.highlight, colour);
  const fill = el.fillPaint as { type: string; color?: string } | null | undefined;
  if (fill?.type === 'solid' && tint.fill) el.fillPaint = { ...fill, color: colour(tint.fill) };
}

function tintSticker(el: Loose, tint: BookTemplateTint, colour: Colour): void {
  if (!tint.colors) return;
  const drawn = (el.colors as string[] | undefined) ?? [];
  el.colors = drawn.map((c, i) => {
    const t = tint.colors?.[i];
    return t ? colour(t) : c;
  });
}

/** The colours a template links nowhere in the document, set from the theme. Changes `el` in place. */
function applyTint(el: Loose, tint: BookTemplateTint, theme: BookTheme): void {
  const colour: Colour = (t) => bookThemeColor(theme, t);
  if (el.kind === 'photo') tintPhoto(el, tint, colour);
  else if (el.kind === 'text') tintText(el, tint, colour);
  else if (el.kind === 'sticker') tintSticker(el, tint, colour);
  else if (el.kind === 'line' && tint.stroke) el.stroke = colour(tint.stroke);
}

/** The band set behind a text that reads on neither ink nor paper: its padding as a share of the letter height. */
const READING_BAND = { x: 0.6, y: 0.3 } as const;

/**
 * A laid text on the colour `on`, set so it reads there in this theme at the
 * size it was fitted to. Its own colour stays while it reads; else it takes
 * whichever of ink and paper reads better, and a hard shadow that would vanish
 * into the new colour takes the old one; when neither reads, the better of the
 * two goes on a band of the other. A text with its own ground (a band, a
 * picture in its letters, a heavy outline) already reads on it.
 */
export function readableOn(el: BookTextElement, on: BookColorToken, theme: BookTheme): BookTextElement {
  if (bookTextHasOwnGround(el)) return el;
  const ground = bookThemeColor(theme, on);
  const need = requiredContrast(el.size);
  if (contrastRatio(el.color, ground) >= need) return el;
  const ink = bookThemeColor(theme, 'ink');
  const paper = bookThemeColor(theme, 'paper');
  const pick: BookColorToken = contrastRatio(ink, ground) >= contrastRatio(paper, ground) ? 'ink' : 'paper';
  const color = pick === 'ink' ? ink : paper;
  const next: BookTextElement = { ...el, token: pick, color };
  if (el.shadow?.color.toLowerCase() === color.toLowerCase()) {
    next.shadow = { ...el.shadow, color: el.color };
  }
  if (contrastRatio(color, ground) >= need) return next;
  const letter = (el.size * 25.4) / 72;
  const pad = (share: number) => clamp(r2(letter * share), 0, 20);
  const band = pick === 'ink' ? paper : ink;
  return {
    ...next,
    highlight: { color: band, alpha: 1, padX: pad(READING_BAND.x), padY: pad(READING_BAND.y), radius: 0 },
  };
}

/** A laid element, with what the template says about it kept beside it for the pour. */
export interface LaidElement {
  el: BookElement;
  role: BookTemplateRole | undefined;
  fillPhoto: BookTemplatePhotoRole | undefined;
  /** The colour a text is set on, for `readableOn` once its words are in and fitted. */
  on: BookColorToken | undefined;
}

/**
 * One template element on this page: in millimetres, its tints in the theme's
 * colours when the book has a theme, its template fields gone, parsed as the
 * document parses an element. Null for one the contract refuses, which a
 * shipped template never is (a spec holds them) and a drawn one may be.
 */
export function layTemplateElement(
  src: BookTemplateElement,
  at: TemplatePage,
  theme: BookTheme | null,
  id: string,
): LaidElement | null {
  const { role, tint, keep: _keep, fillPhoto, on, ...rest } = src;
  const el: Loose = { ...rest, id, frame: templateFrame(src, at) };
  scaleLengths(el, at, role);
  if (tint && theme) applyTint(el, tint, theme);
  const parsed = bookElementSchema.safeParse(el);
  if (!parsed.success) return null;
  let out = parsed.data;
  // A shape whose paint took the theme keeps its fill the colour that stands for it.
  if (out.kind === 'shape' && out.paint && tint && theme) {
    out = withShapePaint(
      out,
      tintedPaint(out.paint, tint, (t) => bookThemeColor(theme, t)),
    );
  }
  return { el: out, role, fillPhoto, on: out.kind === 'text' ? on : undefined };
}

/** The page's own paint, its tints taken from the theme. */
export function templateBackgroundPaint(tpl: BookDecoratedTemplate, theme: BookTheme | null): BookPaint | undefined {
  const paint = tpl.backgroundPaint;
  if (!paint || !theme || !tpl.backgroundTint) return paint;
  return tintedPaint(paint, tpl.backgroundTint, (t) => bookThemeColor(theme, t));
}
