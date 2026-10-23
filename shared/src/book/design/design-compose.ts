import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { DESIGN_TEXT_HEADROOM, MIN_PRINT_DPI, textHeightNeeded } from '../book-findings';
import type { BookPhotoInfo } from '../book-ops-core';
import { formatBookDate } from '../book-text';
import { bookBadgeValue, bookTravelBadge, type BookTravelContext } from '../book-travel';
import type {
  BookElement,
  BookFrame,
  BookPageSetup,
  BookPhotoElement,
  BookShapeElement,
  BookTextElement,
} from '../book.schema';
import type { BookDesignDirectives } from './design-directives.schema';
import { dpiIn } from './design-photos';
import type { BookDesignGrid, BookDesignLook } from './design-style';

/**
 * The parts a designed page is built from, on the book's grid and in its
 * look: photos placed at print resolution with their focal point on the
 * detail, texts measured before they are set (a frame is as tall as its words
 * need), the title block of a chapter, a story that continues or is cut at a
 * sentence when it does not fit.
 *
 * Everything sits inside the margins or runs exactly to the bleed: nothing
 * stops a few millimetres short of an edge, no words cross the fold, nothing
 * lies on top of a picture except words on a scrim.
 */

export interface ComposeCtx {
  look: BookDesignLook;
  page: BookPageSetup;
  grid: BookDesignGrid;
  newId: (prefix: string) => string;
  locale: string;
  infos: ReadonlyMap<number, BookPhotoInfo>;
  travel: BookTravelContext;
  directives: BookDesignDirectives;
  notes: string[];
}

export type Side = 'left' | 'right' | 'single';

const r2 = (v: number) => Math.round(v * 100) / 100;

export const frameOf = (x: number, y: number, w: number, h: number): BookFrame => ({
  x: r2(x),
  y: r2(y),
  w: r2(w),
  h: r2(h),
});

/** Millimetres scaled from a 210 mm page to this one. */
export const scaled = (c: ComposeCtx, v: number) => (v * c.grid.pageWidth) / 210;

/** Where a page starts on its spread. */
export const pageX = (c: ComposeCtx, side: Side) => (side === 'right' ? c.grid.pageWidth : 0);

/** A page's live area: inside the margins. */
export function liveBox(c: ComposeCtx, side: Side): BookFrame {
  const { margin: m, pageWidth: PW, pageHeight: H } = c.grid;
  return frameOf(pageX(c, side) + m, m, PW - m * 2, H - m * 2);
}

/** A whole page to the bleed, stopping at the fold on a spread. */
export function bleedPage(c: ComposeCtx, side: Side): BookFrame {
  const { bleed: b, pageWidth: PW, pageHeight: H } = c.grid;
  if (side === 'single') return frameOf(-b, -b, PW + b * 2, H + b * 2);
  return frameOf(side === 'left' ? -b : PW, -b, PW + b, H + b * 2);
}

/** The whole spread to the bleed. */
export function bleedSpread(c: ComposeCtx): BookFrame {
  const { bleed: b, pageWidth: PW, pageHeight: H } = c.grid;
  return frameOf(-b, -b, PW * 2 + b * 2, H + b * 2);
}

export const other = (side: 'left' | 'right'): 'left' | 'right' => (side === 'left' ? 'right' : 'left');

// ── photos ─────────────────────────────────────────────────────────────────

/** A frame at least `MIN_PRINT_DPI` for this photo: the frame itself, or a smaller one centred in it. */
function printable(c: ComposeCtx, photo: AutoPhoto, frame: BookFrame): BookFrame {
  const dpi = dpiIn(photo, c.infos.get(photo.photoId), frame);
  if (dpi === null || dpi >= MIN_PRINT_DPI) return frame;
  const k = (dpi / MIN_PRINT_DPI) * 0.98;
  const w = frame.w * k;
  const h = frame.h * k;
  return frameOf(frame.x + (frame.w - w) / 2, frame.y + (frame.h - h) / 2, w, h);
}

/** Whether a photo prints sharply in this frame (or its size is unknown). */
export function printsAt(c: ComposeCtx, photo: AutoPhoto, frame: BookFrame): boolean {
  const dpi = dpiIn(photo, c.infos.get(photo.photoId), frame);
  return dpi === null || dpi >= MIN_PRINT_DPI;
}

interface PhotoOpts {
  /** Runs to the bleed: never decorated or turned, and moved into the margins when it would print soft. */
  bleed?: { side: Side };
  /** The focal point across, when the frame crosses the fold and the detail must stay off it. */
  focalX?: number;
  turn?: number;
}

/** A photo element: its focal point on the picture's detail when known, the style's frame around it. */
export function photoEl(c: ComposeCtx, photo: AutoPhoto, frame: BookFrame, opts: PhotoOpts = {}): BookPhotoElement {
  const info = c.infos.get(photo.photoId);
  let placed = frame;
  if (opts.bleed && !printsAt(c, photo, frame)) placed = printable(c, photo, liveBox(c, opts.bleed.side));
  else if (!opts.bleed) placed = printable(c, photo, frame);
  const framed = !opts.bleed || placed !== frame;
  return {
    id: c.newId('p'),
    kind: 'photo',
    frame: placed,
    rotation: framed ? (opts.turn ?? 0) : 0,
    opacity: 1,
    locked: false,
    photoId: photo.photoId,
    fit: 'cover',
    focalX: opts.focalX ?? info?.salient?.x ?? 0.5,
    focalY: info?.salient?.y ?? 0.5,
    radius: 0,
    filter: 'none',
    mask: null,
    frameStyle: framed ? c.look.frameStyle : 'none',
  };
}

/** A scrapbook's slight turn, alternating; nothing for the other styles. */
export const turnOf = (c: ComposeCtx, i: number) => (c.look.tilt ? (i % 2 === 0 ? -c.look.tilt : c.look.tilt) : 0);

// ── texts ──────────────────────────────────────────────────────────────────

type TextRole = 'heading' | 'sub' | 'body' | 'caption' | 'meta';

const WEIGHT: Record<TextRole, BookTextElement['weight']> = {
  heading: 700,
  sub: 600,
  body: 400,
  caption: 500,
  meta: 600,
};
const LEADING: Record<TextRole, number> = { heading: 1.1, sub: 1.25, body: 1.5, caption: 1.35, meta: 1.3 };

interface TextOpts {
  binding?: BookTextElement['binding'];
  overridden?: boolean;
  color?: string;
  align?: BookTextElement['align'];
  size?: number;
}

/** Where a text starts and how wide it runs; a zod-inferred frame passes in every compile mode. */
type TextAt = Pick<BookFrame, 'x' | 'y' | 'w'>;

/** A text in the book's look, its frame as tall as its words need. */
export function textEl(c: ComposeCtx, at: TextAt, words: string, role: TextRole, opts: TextOpts = {}): BookTextElement {
  const defaultColour = role === 'caption' || role === 'meta' ? c.look.muted : c.look.ink;
  const el: BookTextElement = {
    id: c.newId('t'),
    kind: 'text',
    frame: frameOf(at.x, at.y, at.w, 10),
    rotation: 0,
    opacity: 1,
    locked: false,
    text: words,
    font: role === 'heading' || role === 'sub' ? c.look.heading : c.look.body,
    size: opts.size ?? c.look.sizes[role],
    weight: WEIGHT[role],
    italic: false,
    align: opts.align ?? 'left',
    leading: LEADING[role],
    tracking: role === 'meta' ? 0.08 : 0,
    color: opts.color ?? defaultColour,
    binding: opts.binding ?? null,
    overridden: opts.overridden ?? false,
  };
  return { ...el, frame: frameOf(at.x, at.y, at.w, textHeightNeeded(el, DESIGN_TEXT_HEADROOM) + 1.2) };
}

/**
 * A heading that fits `maxH`: set at `opts.size` (the heading size when none
 * is given), then smaller, down to the sub size, until it does.
 */
export function headingEl(
  c: ComposeCtx,
  at: TextAt,
  words: string,
  maxH: number,
  opts: TextOpts = {},
): BookTextElement {
  let size = opts.size ?? c.look.sizes.heading;
  let el = textEl(c, at, words, 'heading', { ...opts, size });
  while (el.frame.h > maxH && size > c.look.sizes.sub) {
    size = Math.max(c.look.sizes.sub, size - 2);
    el = textEl(c, at, words, 'heading', { ...opts, size });
  }
  return el;
}

const NEWLINE = String.fromCharCode(10);

/** Where the last sentence of `head` ends, or -1. */
function sentenceEnd(head: string): number {
  return Math.max(...['. ', '! ', '? ', NEWLINE].map((mark) => head.lastIndexOf(mark)));
}

/** A start of `words` at most `n` characters long, cut at a sentence end where one is near, else at a word. */
export function cutWords(words: string, n: number): string {
  if (words.length <= n) return words;
  const head = words.slice(0, n);
  const sentence = sentenceEnd(head);
  if (sentence > n * 0.5) return head.slice(0, sentence + 1).trimEnd();
  const space = head.lastIndexOf(' ');
  return space > 0 ? `${head.slice(0, space).trimEnd()}…` : '';
}

/** The longest start of `words` that fits a box at body size, cut at a sentence end where one is near. */
function cutToFit(c: ComposeCtx, words: string, box: Pick<BookFrame, 'w' | 'h'>): string {
  const fits = (s: string) => textEl(c, { x: 0, y: 0, w: box.w }, s, 'body').frame.h <= box.h;
  if (fits(words)) return words;
  let lo = 0;
  let hi = words.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(`${words.slice(0, mid)}…`)) lo = mid;
    else hi = mid - 1;
  }
  return cutWords(words, lo);
}

// ── the title block ────────────────────────────────────────────────────────

interface TitleOpts {
  /** Words on a scrim over a photo: set in the scrim's colour. */
  onScrim?: boolean;
}

/**
 * A chapter's title block, top down in a box: the day chip, the date, the
 * title, the place, a short rule in the accent. Returns the elements and
 * where the block ends.
 */
export function titleBlock(
  c: ComposeCtx,
  entry: AutoEntry,
  box: BookFrame,
  opts: TitleOpts = {},
): { els: BookElement[]; bottom: number } {
  const els: BookElement[] = [];
  const colour = opts.onScrim ? c.look.onScrim : undefined;
  const captions = c.directives.text?.captions ?? 'entry';
  let y = box.y;
  if ((c.directives.travel?.dayBadges ?? true) && entry.dayNumber) {
    const value = bookBadgeValue(c.travel, 'day', entry);
    if (value) {
      const chip = frameOf(box.x, y, scaled(c, 24), scaled(c, 7));
      const badge = bookTravelBadge({ id: c.newId('bd'), frame: chip, variant: 'day', value });
      els.push({ ...badge, font: c.look.heading, accent: c.look.accent });
      y += chip.h + 4;
    }
  }
  if (captions !== 'none' && entry.date) {
    const words = formatBookDate(entry.date, c.locale);
    const binding = { source: 'entry.date' as const, entryId: entry.id, value: entry.date };
    if (words) {
      const date = textEl(c, { x: box.x, y, w: box.w }, words, 'meta', { binding, color: colour });
      els.push(date);
      y += date.frame.h + 2;
    }
  }
  const heading = entry.title || entry.location || '';
  if (heading) {
    const binding = { source: 'entry.title' as const, entryId: entry.id };
    const title = headingEl(c, { x: box.x, y, w: box.w }, heading, box.h * 0.45, { binding, color: colour });
    els.push(title);
    y += title.frame.h + 3;
  }
  if (captions !== 'none' && entry.title && entry.location) {
    const binding = { source: 'entry.location' as const, entryId: entry.id };
    const place = textEl(c, { x: box.x, y, w: box.w }, entry.location, 'caption', { binding, color: colour });
    els.push(place);
    y += place.frame.h + 3;
  }
  els.push(ruleEl(c, box.x, y + 1));
  return { els, bottom: y + 6 };
}

/** A short rule in the accent. */
export function ruleEl(c: ComposeCtx, x: number, y: number): BookShapeElement {
  return {
    id: c.newId('s'),
    kind: 'shape',
    frame: frameOf(x, y, scaled(c, 14), 0.5),
    rotation: 0,
    opacity: 1,
    locked: false,
    shape: 'rect',
    fill: c.look.accent,
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    strokeStyle: 'solid',
    radius: 0,
  };
}

/** A fading panel under words set on a photograph. */
export function scrimEl(c: ComposeCtx, frame: BookFrame): BookShapeElement {
  return {
    ...ruleEl(c, 0, 0),
    frame,
    fill: c.look.scrim,
    gradient: 'up',
    opacity: c.look.scrimOpacity,
  };
}

// ── the story ──────────────────────────────────────────────────────────────

/**
 * An entry's story in a box: bound when it fits whole; cut at a sentence
 * when it does not (no longer bound, said in the notes), with the rest handed
 * back for a quiet page when the story is to be set in full.
 */
export function storyEl(
  c: ComposeCtx,
  entry: AutoEntry,
  words: string,
  box: BookFrame,
  whole: boolean,
): { el: BookTextElement | null; rest: string } {
  const mode = c.directives.text?.story ?? 'full';
  const limit = mode === 'excerpt' ? (c.directives.text?.excerptChars ?? 600) : Infinity;
  const binding = { source: 'entry.story' as const, entryId: entry.id };
  if (!words || mode === 'none' || box.h < c.look.sizes.body * 1.6) return { el: null, rest: words };
  const fitting = cutToFit(c, cutWords(words, limit), box);
  if (!fitting) return { el: null, rest: words };
  const bound = whole && fitting === words;
  if (!bound) c.notes.push(`the story of entry ${entry.id} is cut to fit its page and no longer follows the journal`);
  const el = textEl(c, box, fitting, 'body', { binding, overridden: !bound });
  const rest = mode === 'full' && !bound ? words.slice(fitting.replace(/…$/, '').length).trim() : '';
  return { el, rest };
}
