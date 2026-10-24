import { groupElements } from './book-groups';
import type { BookLockupRole } from './book-lockup-roles';
import { BOOK_LOCKUPS } from './book-lockups.data';
import type { BookTextCurve, BookTextTransform } from './book-text-effects.schema';
import { solveBookTextFit } from './book-text-fit';
import type {
  BookElement,
  BookFontFamily,
  BookFrame,
  BookPageSetup,
  BookSpread,
  BookShapeElement,
  BookShapeId,
  BookTextElement,
} from './book.schema';

/**
 * Lockups: titles, date lines, badges, postmarks, quotes and chapter marks set
 * as a few texts and shapes that belong together, the way the covers of the
 * reference books are composed.
 *
 * ── How a lockup is described ───────────────────────────────────────────────
 *
 * In the units of a box 100 wide and `height` tall, every size and position in
 * those units and every colour a tone (ink, accent, paper, muted) rather than a
 * value. `buildBookLockup` scales the units onto the box it is placed in and
 * the tones onto the palette it is given, so one description sets a cover
 * title on a large square book and a chapter mark on a small landscape one.
 *
 * ── The words ───────────────────────────────────────────────────────────────
 *
 * A text part names the role its words play (title, year, place …), and the
 * words arrive with the placement: the Studio passes the book's own title and
 * translated samples, the assistant the words it was asked for. A part whose
 * role has no words is left out, so a lockup asked for only a title is a
 * title. Every text part is set to fit its frame, so a long title shrinks into
 * its place instead of running out of it.
 *
 * ── What it builds ──────────────────────────────────────────────────────────
 *
 * Ordinary elements, back to front, which move, restyle, undo and print like
 * any other, placed as one group (`addBookLockup`) so the set moves as one and
 * a double click still reaches a single part.
 */

export { BOOK_LOCKUP_ROLES, type BookLockupRole } from './book-lockup-roles';
export type BookLockupWords = Partial<Record<BookLockupRole, string>>;

/** The colours a lockup is set in, by what they do. */
export type BookLockupTone = 'ink' | 'accent' | 'paper' | 'muted';
export type BookLockupPalette = Record<BookLockupTone, string>;

/**
 * Ink black, a warm terracotta accent, white paper, and a warm grey a shade
 * darker than the Studio's captions, so the small spaced lines it sets still
 * read at the 4.5:1 small type needs.
 */
export const BOOK_LOCKUP_PALETTE: BookLockupPalette = {
  ink: '#1a1a1a',
  accent: '#b4532a',
  paper: '#ffffff',
  muted: '#7a7468',
};

interface PartBox {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees, turned about the part's own centre. */
  rotation?: number;
}

export interface BookLockupTextPart extends PartBox {
  kind: 'text';
  /** Where the words come from. */
  role: BookLockupRole;
  /** Fixed words, for a mark such as a quotation mark: set whatever the words given. */
  literal?: string;
  font: BookFontFamily;
  size: number;
  weight?: BookTextElement['weight'];
  italic?: boolean;
  align?: BookTextElement['align'];
  leading?: number;
  tracking?: number;
  tone: BookLockupTone;
  transform?: BookTextTransform;
  outline?: { tone: BookLockupTone; width: number };
  shadow?: { dx: number; dy: number; tone: BookLockupTone; alpha?: number };
  highlight?: { tone: BookLockupTone; padX: number; padY: number; radius?: number; alpha?: number };
  curve?: BookTextCurve;
  /** `photo` fills the letters with the photo the placement names, else with the accent; a tone with alpha 0 leaves them hollow. */
  fill?: 'photo' | { tone: BookLockupTone; alpha: number };
}

export interface BookLockupShapePart extends PartBox {
  kind: 'shape';
  shape: BookShapeId;
  fill: BookLockupTone | null;
  stroke?: BookLockupTone;
  strokeWidth?: number;
  strokeStyle?: BookShapeElement['strokeStyle'];
  radius?: number;
}

export type BookLockupPart = BookLockupTextPart | BookLockupShapePart;

export interface BookLockup {
  id: string;
  /** The box is 100 units wide and this tall. */
  height: number;
  /** How much of a page's width it takes when placed without a box. */
  share: number;
  /** The whole lockup turned about its centre, in degrees: a stamp set at an angle. */
  rotation?: number;
  /** What it is, for the assistant's schema and the shelf's tooltips. */
  descr: string;
  parts: readonly BookLockupPart[];
}

export function findBookLockup(id: string): BookLockup | undefined {
  return BOOK_LOCKUPS.find((l) => l.id === id);
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Where a lockup goes when no box is named: its share of the page width,
 * centred on the page, or on the right-hand page of a double spread so it never
 * lands in the fold.
 */
export function bookLockupBox(lockup: BookLockup, page: BookPageSetup, single: boolean): BookFrame {
  const w = Math.min(page.pageWidth * lockup.share, ((page.pageHeight * 0.8) / lockup.height) * 100);
  const h = (w / 100) * lockup.height;
  const origin = single ? 0 : page.pageWidth;
  return { x: r2(origin + (page.pageWidth - w) / 2), y: r2((page.pageHeight - h) / 2), w: r2(w), h: r2(h) };
}

/** The lockup's own proportions, as large as the box allows and centred in it. */
function fitted(lockup: BookLockup, box: BookFrame): { x: number; y: number; scale: number } {
  const scale = Math.min(box.w / 100, box.h / lockup.height);
  return {
    x: box.x + (box.w - 100 * scale) / 2,
    y: box.y + (box.h - lockup.height * scale) / 2,
    scale,
  };
}

interface Placement {
  origin: { x: number; y: number; scale: number };
  centre: { x: number; y: number };
  turn: number;
}

/** A part's frame on the page and its rotation, the lockup's own turn applied about the lockup's centre. */
function placed(part: PartBox, at: Placement): { frame: BookFrame; rotation: number } {
  const { x, y, scale } = at.origin;
  const w = part.w * scale;
  const h = part.h * scale;
  let cx = x + (part.x + part.w / 2) * scale;
  let cy = y + (part.y + part.h / 2) * scale;
  if (at.turn) {
    const rad = (at.turn * Math.PI) / 180;
    const dx = cx - at.centre.x;
    const dy = cy - at.centre.y;
    cx = at.centre.x + dx * Math.cos(rad) - dy * Math.sin(rad);
    cy = at.centre.y + dx * Math.sin(rad) + dy * Math.cos(rad);
  }
  const frame = { x: r2(cx - w / 2), y: r2(cy - h / 2), w: r2(Math.max(0.5, w)), h: r2(Math.max(0.3, h)) };
  return { frame, rotation: r2((part.rotation ?? 0) + at.turn) };
}

/** Units to points at a scale of `scale` millimetres a unit, inside the document's range. */
const unitsToPt = (units: number, scale: number) =>
  Math.min(400, Math.max(4, Math.round(((units * scale * 72) / 25.4) * 10) / 10));

export interface BuildLockupOptions {
  words: BookLockupWords;
  palette?: Partial<BookLockupPalette>;
  /** The photo a photo-filled part is filled with; without one it is filled with the accent. */
  photoId?: number | null;
  newId: (prefix: string) => string;
}

const BASE = { opacity: 1, locked: false };

function textFill(part: BookLockupTextPart, tones: BookLockupPalette, photoId: number | null | undefined) {
  if (part.fill === 'photo') {
    return photoId ? { type: 'photo' as const, photoId, focalX: 0.5, focalY: 0.5, zoom: 1 } : null;
  }
  return part.fill ? { type: 'solid' as const, color: tones[part.fill.tone], alpha: part.fill.alpha } : null;
}

function textPart(
  part: BookLockupTextPart,
  words: string,
  at: Placement,
  opts: BuildLockupOptions,
  tones: BookLockupPalette,
) {
  const { frame, rotation } = placed(part, at);
  const s = at.origin.scale;
  const size = unitsToPt(part.size, s);
  const fillPaint = textFill(part, tones, opts.photoId);
  const el: BookTextElement = {
    ...BASE,
    id: opts.newId('t'),
    kind: 'text',
    frame,
    rotation,
    text: words,
    font: part.font,
    size,
    weight: part.weight ?? 400,
    italic: part.italic ?? false,
    align: part.align ?? 'center',
    leading: part.leading ?? 1.1,
    tracking: part.tracking ?? 0,
    // A photo fill that found no photo falls back to the accent, so the word still carries colour.
    color: part.fill === 'photo' && !fillPaint ? tones.accent : tones[part.tone],
    binding: null,
    overridden: false,
    vAlign: 'middle',
    fit: 'shrink',
    fitMax: size,
    ...(part.transform ? { transform: part.transform } : {}),
    ...(fillPaint ? { fillPaint } : {}),
    ...(part.outline ? { outline: { color: tones[part.outline.tone], width: r2(part.outline.width * s) } } : {}),
    ...(part.shadow
      ? {
          shadow: {
            dx: r2(part.shadow.dx * s),
            dy: r2(part.shadow.dy * s),
            color: tones[part.shadow.tone],
            alpha: part.shadow.alpha ?? 1,
          },
        }
      : {}),
    ...(part.highlight
      ? {
          highlight: {
            color: tones[part.highlight.tone],
            alpha: part.highlight.alpha ?? 1,
            padX: r2(part.highlight.padX * s),
            padY: r2(part.highlight.padY * s),
            radius: r2((part.highlight.radius ?? 0) * s),
          },
        }
      : {}),
    ...(part.curve ? { curve: part.curve } : {}),
  };
  return { ...el, size: solveBookTextFit(el, size) };
}

function shapePart(part: BookLockupShapePart, at: Placement, opts: BuildLockupOptions, tones: BookLockupPalette) {
  const { frame, rotation } = placed(part, at);
  const s = at.origin.scale;
  const el: BookShapeElement = {
    ...BASE,
    id: opts.newId('s'),
    kind: 'shape',
    frame,
    rotation,
    shape: part.shape,
    fill: part.fill ? tones[part.fill] : null,
    gradient: 'none',
    stroke: part.stroke ? tones[part.stroke] : null,
    strokeWidth: part.stroke ? r2(Math.max(0.1, (part.strokeWidth ?? 0.4) * s)) : 0,
    strokeStyle: part.strokeStyle ?? 'solid',
    radius: r2((part.radius ?? 0) * s),
  };
  return el;
}

/**
 * The lockup's elements in `box`, back to front, its parts without words left
 * out. Empty when no text part has words: a lockup of ornaments alone is not
 * what anybody placed.
 */
export function buildBookLockup(lockup: BookLockup, box: BookFrame, opts: BuildLockupOptions): BookElement[] {
  const tones = { ...BOOK_LOCKUP_PALETTE, ...opts.palette };
  const origin = fitted(lockup, box);
  const at: Placement = {
    origin,
    centre: { x: origin.x + 50 * origin.scale, y: origin.y + (lockup.height / 2) * origin.scale },
    turn: lockup.rotation ?? 0,
  };
  const out: BookElement[] = [];
  let words = 0;
  for (const part of lockup.parts) {
    if (part.kind === 'shape') {
      out.push(shapePart(part, at, opts, tones));
      continue;
    }
    const text = (part.literal ?? opts.words[part.role] ?? '').trim();
    if (!text) continue;
    if (!part.literal) words += 1;
    out.push(textPart(part, text, at, opts, tones));
  }
  return words ? out : [];
}

/**
 * A lockup's elements laid on a spread in front of what is there, made one
 * group under `groupId` when there is more than one of them.
 */
export function addBookLockup(spread: BookSpread, made: readonly BookElement[], groupId: string): BookSpread {
  const placed = { ...spread, elements: [...spread.elements, ...made] };
  if (made.length < 2) return placed;
  return groupElements(
    placed,
    made.map((e) => e.id),
    groupId,
  );
}
