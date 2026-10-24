import { deltaE, luminance, parseHex, toHsl } from './book-colour';
import { bookFontCountsInMix, bookFontRole } from './book-fonts';
import { visibleSpread } from './book-groups';
import type { BookFinding } from './book-ops.schema';
import type {
  BookDocument,
  BookElement,
  BookFrame,
  BookPageSetup,
  BookShapeElement,
  BookSpread,
  BookTextElement,
} from './book.schema';
import { STICKERS_PER_SPREAD, tiltRange, type DesignArt } from './design/design-art';
import { bookThemeColor } from './theme/book-theme';
import { BOOK_COLOR_TOKENS, type BookTheme } from './theme/book-theme.schema';

/**
 * Whether a page reads as designed, not only as laid out without faults: the
 * checks an art director makes after the print checks pass.
 *
 * - `flat_cover` (warn): a cover with no title of 48 pt or more and nothing
 *   else to carry it: no photo over most of it, no colour block, no coloured
 *   page, no drawing, sticker or ornament. A photo over half the cover carries
 *   it as a colour block does. The sizes are for a page 210 mm wide and scale
 *   with the page width, as the type scale does.
 * - `weak_hierarchy` (info): the largest words on a page are under twice the
 *   next, so nothing leads. Script and mono lines dress a page and are not
 *   weighed, nor are repeats of the same words (an echoed title).
 * - `off_theme` (info): colours or faces on a page that are none of the
 *   theme's and follow no link to it.
 * - `energy_mismatch` (info): a designed book whose stickers per spread or
 *   whose turned photos fall outside what its brief asked for; only a design
 *   made with a brief is judged by one, and only on the pages it made (a page
 *   it kept as it was is the person's).
 */

/** A title this large carries a cover on its own, on a page 210 mm wide; the sizes here scale with the page width. */
const COVER_TITLE_PT = 48;
const REFERENCE_WIDTH = 210;
/** Photos over this share of the cover make a picture cover. */
const PICTURE_SHARE = 0.5;
/** Words this large are a page's title, the one the hierarchy is judged by. */
const TITLE_PT = 20;
/** Two colours this far apart (delta E) are different colours. */
const OFF_PALETTE = 14;

const n1 = (v: number) => `${Math.round(v * 10) / 10}`;

/** How the sizes of the checks scale on this page: its width over the 210 mm they are set for. */
const scaleOf = (page: BookPageSetup) => page.pageWidth / REFERENCE_WIDTH;

/** A frame in millimetres, as the book types it, so a zod-inferred `el.frame` passes in every compile mode. */
type Box = BookFrame;

function shared(a: Box, b: Box): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** A colour that belongs to any palette: a grey, near black or near white. */
function neutral(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return true;
  const hsl = toHsl(rgb);
  return hsl.s < 0.12 || hsl.l < 0.08 || hsl.l > 0.95;
}

/** A colour darker or stronger than a light paper. */
const deep = (hex: string | null | undefined) => {
  const rgb = hex ? parseHex(hex) : null;
  return !!rgb && luminance(rgb) < 0.75;
};

/** A page painted a colour of its own: anything but a light paper, a pattern or a gradient included. */
function colouredPage(spread: BookSpread): boolean {
  const paint = spread.backgroundPaint;
  if (paint) return paint.type === 'solid' ? deep(paint.color) : true;
  return deep(spread.background);
}

/** Thinner than this (mm) a rule or an outline is a hairline, which carries no cover. */
const HAIRLINE = 1.5;

/** A gradient with no paint of its own in a grey: the scrim a title sits on over a photo. */
const scrim = (el: BookShapeElement) => el.gradient !== 'none' && !el.paint && (!el.fill || neutral(el.fill));

/**
 * A drawing, a sticker, an ornament, or a shape that blocks colour: any shape
 * but a scrim fading over a photo or a hairline rule, any line but a plain
 * hairline.
 */
function decorates(el: BookElement): boolean {
  if (el.kind === 'sticker' || el.kind === 'icon') return true;
  if (el.kind === 'line') return el.ornament !== 'none' || el.squiggle !== 'none' || el.strokeWidth >= HAIRLINE;
  if (el.kind !== 'shape' || el.opacity < 0.5 || scrim(el)) return false;
  return Math.min(el.frame.w, el.frame.h) >= HAIRLINE && (el.fill !== null || el.stroke !== null);
}

/**
 * Whether a cover holds something that carries it: big type, photos over most
 * of it (one to the bleed, or a grid of them), a colour block or a drawing.
 */
function carried(spread: BookSpread, page: BookPageSetup): boolean {
  const area = page.pageWidth * page.pageHeight;
  const cover: Box = { x: 0, y: 0, w: page.pageWidth, h: page.pageHeight };
  const pictured = spread.elements.reduce(
    (sum, el) => sum + (el.kind === 'photo' && el.photoId != null ? shared(el.frame, cover) : 0),
    0,
  );
  if (pictured >= area * PICTURE_SHARE) return true;
  const big = COVER_TITLE_PT * scaleOf(page);
  return spread.elements.some((el) => (el.kind === 'text' ? !!el.text.trim() && el.size >= big : decorates(el)));
}

function flatCover(spread: BookSpread, page: BookPageSetup): BookFinding | null {
  if (spread.role !== 'cover' || !spread.elements.length) return null;
  if (colouredPage(spread) || carried(spread, page)) return null;
  return {
    code: 'flat_cover',
    severity: 'warn',
    elementIds: spread.elements.slice(0, 8).map((e) => e.id),
    message: `the cover has no title of ${n1(COVER_TITLE_PT * scaleOf(page))} pt or more and no photo, colour block or decoration to carry it; set the title larger, give the cover a colour block or a large photo, or design it on an archetype`,
  };
}

/** The texts a page's hierarchy is read from: words, in a face that sets them (no script, no mono). */
const weighed = (el: BookElement): el is BookTextElement =>
  el.kind === 'text' && !!el.text.trim() && bookFontCountsInMix(el.font);

function weakHierarchy(spread: BookSpread, page: BookPageSetup): BookFinding | null {
  const texts = spread.elements.filter(weighed).sort((a, b) => b.size - a.size);
  const [top] = texts;
  if (!top || top.size < TITLE_PT * scaleOf(page)) return null;
  const words = top.text.trim();
  const next = texts.find((t) => t !== top && t.text.trim() !== words);
  if (!next || top.size >= next.size * 2) return null;
  return {
    code: 'weak_hierarchy',
    severity: 'info',
    elementIds: [top.id, next.id],
    message: `the largest text ${top.id} at ${n1(top.size)} pt is under twice text ${next.id} at ${n1(next.size)} pt; set one larger or the other smaller so the page has one lead`,
  };
}

/** The art findings of a page that need no theme: a flat cover and a weak hierarchy. */
export function artFindings(spread: BookSpread, page: BookPageSetup): BookFinding[] {
  const visible = visibleSpread(spread);
  return [flatCover(visible, page), weakHierarchy(visible, page)].filter((f): f is BookFinding => f !== null);
}

/** The colours and faces of an element that are none of the theme's and follow no link to it. */
function strays(el: BookElement, colours: readonly string[], faces: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const colour = (hex: string | null | undefined, linked: boolean) => {
    if (!hex || linked || neutral(hex) || colours.some((t) => deltaE(hex, t) <= OFF_PALETTE)) return;
    out.push(hex.toLowerCase());
  };
  const face = (font: string, linked: boolean) => {
    if (!linked && !faces.has(font) && bookFontRole(font) !== 'mono') out.push(font);
  };
  switch (el.kind) {
    case 'photo':
    case 'sticker':
      return out;
    case 'line':
      colour(el.stroke, false);
      return out;
    case 'shape':
      if (el.gradient === 'none' && (!el.paint || el.paint.type === 'solid')) colour(el.fill, !!el.token);
      return out;
    case 'icon':
      colour(el.color, !!el.token);
      return out;
    case 'text':
      if (el.text.trim()) {
        colour(el.color, !!el.token);
        face(el.font, !!el.fontRole);
      }
      return out;
    default:
      colour(el.color, !!el.token);
      colour(el.accent, !!el.accentToken);
      face(el.font, !!el.fontRole);
      return out;
  }
}

/** Colours or faces on a page outside the book's theme, as one finding; none for a book without a theme. */
export function themeFindings(spread: BookSpread, theme: BookTheme | undefined): BookFinding[] {
  if (!theme) return [];
  const colours = BOOK_COLOR_TOKENS.map((t) => bookThemeColor(theme, t));
  const faces = new Set(Object.values(theme.fonts).flatMap((f) => (f ? [f.font] : [])));
  const found = visibleSpread(spread).elements.flatMap((el) => {
    const what = strays(el, colours, faces);
    return what.length ? [{ id: el.id, what }] : [];
  });
  if (!found.length) return [];
  const named = [...new Set(found.flatMap((f) => f.what))].slice(0, 6);
  return [
    {
      code: 'off_theme',
      severity: 'info',
      elementIds: found.slice(0, 8).map((f) => f.id),
      message: `${found.length} elements are set outside the book's theme (${named.join(', ')}); link them to it with token and fontRole, or set them in its colours and faces`,
    },
  ];
}

/** How far an element is turned from straight, 0 to 180 degrees. */
function turnOf(el: BookElement): number {
  const rest = ((el.rotation % 360) + 360) % 360;
  return Math.min(rest, 360 - rest);
}

/** What a book is judged against: its brief's energy and decoration, and the turns that energy takes. */
export type BookBriefArt = Pick<DesignArt, 'energy' | 'decoration' | 'bare'> & Partial<Pick<DesignArt, 'tilt'>>;

/** Which pages of a book its brief judges, and what the design made of them. */
interface BriefScope {
  /** The pages the design kept as they were: the person's, not judged. */
  kept?: readonly string[];
  /** Whether the design made lively pages (collages, overlays, badges, stamp rows, two-tone splits). */
  lively?: boolean;
  /** Only these pages, as a revised page is judged; what the book as a whole reads like is not said then. */
  only?: readonly string[];
}

/** A photo page's stickers out of the decoration's range: more than its most, or under its least on many pages. */
function decorationFinding(pages: readonly BookSpread[], art: BookBriefArt, whole: boolean): BookFinding | null {
  const [least, most] = art.bare ? [0, 0] : STICKERS_PER_SPREAD[art.decoration];
  const counted = pages.map((s) => ({
    id: s.id,
    n: s.elements.filter((e) => e.kind === 'sticker' && !e.hidden).length,
  }));
  const over = counted.filter((p) => p.n > most);
  const under = counted.filter((p) => p.n < least);
  // A page with no free spot for a sticker takes fewer: the book is under-decorated when a third of its pages are.
  const off = [...over, ...(whole && under.length * 3 > counted.length ? under : [])];
  if (!off.length) return null;
  return {
    code: 'energy_mismatch',
    severity: 'info',
    elementIds: [],
    message: `${off.length} of ${pages.length} photo pages carry stickers outside the ${least} to ${most} per spread the brief's ${art.bare ? 'none' : art.decoration} decoration asks for (${off
      .slice(0, 6)
      .map((p) => `${p.id}: ${p.n}`)
      .join(', ')})`,
  };
}

/**
 * Whether the stickers per spread and the turned prints of a designed book
 * are what its brief asked for, on the pages `scope` judges: every page the
 * design made, or the ones named. A lively book reads calm only when it has
 * no lively page and nothing turned as far as its energy asks.
 */
export function briefFindings(doc: BookDocument, art: BookBriefArt, scope: BriefScope = {}): BookFinding[] {
  const kept = new Set(scope.kept);
  const only = scope.only ? new Set(scope.only) : null;
  const judged = doc.spreads.filter((s) => !kept.has(s.id) && (!only || only.has(s.id)));
  const out: BookFinding[] = [];
  const pages = judged.filter((s) => s.role === 'inner' && s.elements.some((e) => e.kind === 'photo' && !e.hidden));
  const decoration = decorationFinding(pages, art, !only);
  if (decoration) out.push(decoration);
  const [lo, hi] = art.tilt ?? tiltRange(art.energy);
  const turned = judged.flatMap((s) =>
    s.elements.filter((e) => (e.kind === 'photo' || e.kind === 'sticker') && !e.hidden && turnOf(e) > 0.5),
  );
  const steepest = Math.max(0, ...turned.map(turnOf));
  const past = turned.filter((e) => turnOf(e) > hi + 0.5);
  if (past.length) {
    out.push({
      code: 'energy_mismatch',
      severity: 'info',
      elementIds: past.slice(0, 8).map((e) => e.id),
      message: `${past.length} photos or stickers are turned past the ${n1(hi)} degrees a ${art.energy} brief takes, up to ${n1(steepest)}`,
    });
  } else if (!only && art.energy !== 'calm' && steepest < lo && !scope.lively) {
    out.push({
      code: 'energy_mismatch',
      severity: 'info',
      elementIds: [],
      message: `no page is lively and no photo or sticker is turned the ${lo} degrees or more a ${art.energy} brief asks for; the book reads calm`,
    });
  }
  return out;
}

/** The art findings a change of a page answers with: a flat cover, a weak hierarchy, colours or faces off the theme. */
export function pageArtFindings(spread: BookSpread, page: BookPageSetup, theme: BookTheme | undefined): BookFinding[] {
  return [...artFindings(spread, page), ...themeFindings(spread, theme)];
}
