import { compareCodeUnits } from '../../common/compare';
import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { contrastRatio, deltaE, readableInk } from '../book-colour';
import { bookFontHasItalic, bookFontRole, nearestBookWeight } from '../book-fonts';
import { buildBookLockup, findBookLockup, type BookLockupPalette, type BookLockupWords } from '../book-lockups';
import { solveBookTextFit } from '../book-text-fit';
import type {
  BookElement,
  BookFrame,
  BookPhotoElement,
  BookShapeElement,
  BookShapeId,
  BookTextElement,
} from '../book.schema';
import { bookThemeFont, isBookFontFamily, mixHex, mutedOn } from '../theme/book-theme';
import type { BookFontSlot, BookThemeFont } from '../theme/book-theme.schema';
import { CALM_ART, withinTilt } from './design-art';
import { bleedPage, frameOf, photoEl, type ComposeCtx } from './design-compose';
import { titleWords, type CoverWords } from './design-cover-words';
import { designRng, type DesignRng } from './design-random';
import { turnedBox } from './design-stickers';

/**
 * What every composed cover is built from (design-cover.ts dispatches to one
 * composer per archetype): the page in millimetres, the words by the roles a
 * lockup names them (the title and subtitle bound to the journey unless the
 * person gave their own, the year, the month, the country), the photos the
 * book holds with the cover photo first, the seed of every variation, and the
 * parts a cover is laid with. Every colour comes from the book's look and
 * reads on what it is set on; every face comes from the theme's slots.
 */

export interface CoverMaterial {
  /** The photos a cover may use, the cover photo first. */
  photos: readonly AutoPhoto[];
  /** The entries the book tells, in order, for the year, the month and the place. */
  entries: readonly AutoEntry[];
}

export interface CoverKit {
  c: ComposeCtx;
  rng: DesignRng;
  title: { words: string; bound: boolean };
  sub: { words: string; bound: boolean };
  /** The words by lockup role: title, subtitle, year, dates, place, kicker. */
  words: BookLockupWords;
  /** Where the journey went, as written in the journal: its stops, in lower case. */
  places: readonly string[];
  photos: readonly AutoPhoto[];
  /** The lockup the directives ask the title to be set as, in place of the archetype's own. */
  lockup: string | undefined;
  /** The page: its width and height, the bleed, the margin and the safe area, in millimetres. */
  W: number;
  H: number;
  b: number;
  m: number;
  safe: number;
}

/** The page a part is laid on: its context and its size, a cover's or a spread's. */
type PageKit = Pick<CoverKit, 'c' | 'W' | 'H' | 'b'>;

/** The kit of a page of the book that is not the cover: the page size from the grid. */
export function pageKit(c: ComposeCtx): PageKit {
  return { c, W: c.grid.pageWidth, H: c.grid.pageHeight, b: c.grid.bleed };
}

/** A composed cover before it becomes a page: its elements back to front, its ground and its lockups. */
export interface CoverDraft {
  elements: BookElement[];
  /** The page's colour; the paper when left out. */
  background?: string;
  /** The ids of each lockup's parts, made one group each. */
  groups: string[][];
}

const r2 = (v: number) => Math.round(v * 100) / 100;
export const mmToPt = (mm: number) => Math.round(((mm * 72) / 25.4) * 4) / 4;

/** A date of the journey as an instant at its local midnight, as formatBookDate reads it. */
const dayOf = (iso: string) => new Date(`${iso}T00:00:00`);

/** The year or years the journey ran: "2026", or "2025/2026" across a new year; empty without dates. */
function yearOf(dates: readonly string[]): string {
  const first = dates[0]?.slice(0, 4);
  const last = dates[dates.length - 1]?.slice(0, 4);
  if (!first || !last) return '';
  return first === last ? first : `${first}/${last}`;
}

/** The month the journey ran in ("May 2026"), or its year when it ran over several months. */
function monthOf(dates: readonly string[], locale: string): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (!first || !last) return '';
  if (first.slice(0, 7) !== last.slice(0, 7)) return yearOf(dates);
  const at = dayOf(first);
  return Number.isNaN(at.getTime()) ? '' : at.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/** A country's name in the book's language, or the code when the platform does not know it. */
function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** The place a cover names: the one country the journey stayed in, else where it began. */
function placeOf(entries: readonly AutoEntry[], locale: string): string {
  const countries = [...new Set(entries.flatMap((e) => (e.country ? [e.country] : [])))];
  const [only] = countries;
  if (only && countries.length === 1) return countryName(only, locale);
  return entries.find((e) => e.location?.trim())?.location?.trim() ?? '';
}

/** The kit a cover is composed with. */
export function coverKit(c: ComposeCtx, key: string, words: CoverWords, material: CoverMaterial): CoverKit {
  const title = titleWords(words.ownTitle, words.title);
  const sub = titleWords(words.ownSubtitle, words.subtitle ?? '');
  const dates = material.entries.flatMap((e) => (e.date ? [e.date] : [])).sort(compareCodeUnits);
  const month = monthOf(dates, c.locale);
  const lockupWords: BookLockupWords = {
    title: title.words.trim(),
    subtitle: sub.words.trim(),
    year: yearOf(dates),
    dates: month,
    kicker: sub.words.trim() ? month : '',
    place: placeOf(material.entries, c.locale),
  };
  const { pageWidth: W, pageHeight: H, bleed: b, margin: m, safe } = c.grid;
  const seed = (c.art ?? CALM_ART).seed;
  const lockup = c.directives.cover?.lockup;
  const places = [
    ...new Set(material.entries.flatMap((e) => (e.location?.trim() ? [e.location.trim().toLowerCase()] : []))),
  ];
  const rng = designRng(seed, `cover:${key}`);
  return { c, rng, title, sub, words: lockupWords, places, photos: material.photos, lockup, W, H, b, m, safe };
}

// ── colours ────────────────────────────────────────────────────────────────

/** The ink that reads on a ground: the book's own at 4.5:1, else near black or white. */
export function inkOn(c: ComposeCtx, ground: string): string {
  return contrastRatio(c.look.ink, ground) >= 4.5 ? c.look.ink : readableInk(ground);
}

/**
 * A ground small words can be set on: the colour itself when near black or
 * white reads on it at 4.6:1, else the colour taken towards the dark until
 * white does. A mid-tone accent reads under large type but not under a year
 * or a date line in spaced capitals.
 */
export function deepened(colour: string): string {
  let ground = colour;
  for (let step = 0; step < 8 && contrastRatio(readableInk(ground), ground) < 4.6; step++) {
    ground = mixHex(ground, '#000000', 0.12);
  }
  return ground;
}

/**
 * A colour of the book's palette that stands out on a ground, for a shape laid
 * on it: the first accent plainly another colour (delta E over 18) and a shade
 * lighter or darker, else the ink. Shapes only; words take `inkOn`.
 */
export function standOut(c: ComposeCtx, ground: string, skip: readonly string[] = []): string {
  const p = c.look.theme.palette;
  const tried = [c.look.accent, p.accent2, p.accent3].filter((h) => !skip.includes(h));
  return tried.find((h) => deltaE(h, ground) > 18 && contrastRatio(h, ground) >= 1.4) ?? inkOn(c, ground);
}

/**
 * A lockup's tones on a ground: the ground as its paper, an ink and a muted
 * ink that read on it, and an accent that reads on it at 4.5:1, so the words
 * a lockup sets in paper on an accent shape read just as well.
 */
function lockupTones(c: ComposeCtx, ground: string): BookLockupPalette {
  const ink = inkOn(c, ground);
  const p = c.look.theme.palette;
  const accent = [c.look.accent, p.accent3, p.accent2].find((h) => contrastRatio(h, ground) >= 4.5) ?? ink;
  return { ink, accent, paper: ground, muted: mutedOn(ground, ink) };
}

// ── type ───────────────────────────────────────────────────────────────────

/** The theme's face for a slot, when this build sets it. */
function slotFace(c: ComposeCtx, slot: BookFontSlot): BookThemeFont | null {
  const face = bookThemeFont(c.look.theme, slot);
  return face && isBookFontFamily(face.font) ? face : null;
}

/** The face a slot is set in: the theme's own, else its heading face (a theme without a script sets that line in it). */
function faceFor(c: ComposeCtx, slot: BookFontSlot): BookThemeFont | null {
  return slotFace(c, slot) ?? slotFace(c, 'heading');
}

/**
 * The slot a lockup's text is set in: the display face for its title, a
 * script for a script, the body face for running words, the heading face for
 * every other line (a subtitle in a display face included, so the title
 * stays the one display line); a mono line keeps its face.
 */
function slotOf(font: string): BookFontSlot | null {
  const role = bookFontRole(font);
  if (role === 'mono') return null;
  return role === 'display' ? 'heading' : role;
}

/** Under the title, no line of a lockup is set at more than this share of its size. */
const UNDER_TITLE = 1 / 2.2;

/** A lockup's other lines kept under the title: one set larger than the share is fitted at it. */
function underTitle(made: BookElement[], title: string | undefined): BookElement[] {
  const top = made.find((e): e is BookTextElement => e.kind === 'text' && !!title && e.text.trim() === title);
  if (!top) return made;
  const most = Math.max(7, Math.floor(top.size * UNDER_TITLE * 4) / 4);
  return made.map((e) => {
    if (e === top || e.kind !== 'text' || e.size <= most || bookFontRole(e.font) === 'script') return e;
    const capped = { ...e, fitMax: most };
    return { ...capped, size: solveBookTextFit(capped, most) };
  });
}

/** A text set in a face, at a weight and slant the family has, refitted to its frame. */
function setIn(el: BookTextElement, face: BookThemeFont | null): BookTextElement {
  if (!face) return el;
  const font = face.font as BookTextElement['font'];
  const weight = nearestBookWeight(font, face.weight ?? el.weight) as BookTextElement['weight'];
  const italic = (face.italic ?? el.italic) && bookFontHasItalic(font, weight);
  const next = { ...el, font, weight, italic };
  return el.fit === 'shrink' ? { ...next, size: solveBookTextFit(next, el.fitMax ?? el.size) } : next;
}

/** How the texts of a placed lockup are bound and which one is set in the display face. */
interface LockupBinding {
  /** The words set in the theme's display face: a cover's title. */
  display?: string;
  /** The binding a text of these words keeps, or null for none. */
  bind?: (words: string) => BookTextElement['binding'];
}

/**
 * A lockup in a box on a ground, turned by `turn` degrees, its texts in the
 * theme's faces (each in the slot its own face stands for) and bound as
 * `binding` says; empty when none of its texts has words.
 */
export function lockupOn(
  c: ComposeCtx,
  at: { id: string; box: BookFrame; ground: string; words: BookLockupWords; turn?: number; photoId?: number | null },
  binding: LockupBinding = {},
): BookElement[] {
  const lockup = findBookLockup(at.id);
  if (!lockup) return [];
  const turned = at.turn ? { ...lockup, rotation: (lockup.rotation ?? 0) + at.turn } : lockup;
  const made = buildBookLockup(turned, at.box, {
    words: at.words,
    palette: lockupTones(c, at.ground),
    photoId: at.photoId ?? null,
    newId: c.newId,
  });
  const set = made.map((el) => {
    if (el.kind !== 'text') return el;
    const words = el.text.trim();
    const slot: BookFontSlot | null = binding.display && words === binding.display ? 'display' : slotOf(el.font);
    const faced = setIn(el, slot ? faceFor(c, slot) : null);
    const bound = binding.bind?.(words) ?? null;
    return bound ? { ...faced, binding: bound } : faced;
  });
  return underTitle(set, binding.display);
}

/** A cover's lockup: the title in the display face, the title and subtitle bound to the journey when they are its words. */
function coverLockup(k: CoverKit, id: string, box: BookFrame, ground: string, turn = 0): BookElement[] {
  const title = k.title.words.trim();
  const sub = k.sub.words.trim();
  const bind = (words: string): BookTextElement['binding'] => {
    if (title && words === title) return k.title.bound ? { source: 'journey.title' } : null;
    return sub && words === sub && k.sub.bound ? { source: 'journey.subtitle' } : null;
  };
  const at = { id, box, ground, words: k.words, turn, photoId: k.photos[0]?.photoId ?? null };
  return lockupOn(k.c, at, { display: title, bind });
}

/** Parts laid on a draft, made one group when they are several. */
function laid(draft: CoverDraft, made: BookElement[]): BookElement[] {
  draft.elements.push(...made);
  if (made.length > 1) draft.groups.push(made.map((e) => e.id));
  return made;
}

/**
 * The lockup the directives ask the title to be set as, in a box: its parts
 * when it sets the cover's title, else none, and the notes say why (a quote
 * or a caption lockup has no place for a title).
 */
export function askedLockup(k: CoverKit, box: BookFrame, ground: string, turn = 0): BookElement[] {
  if (!k.lockup) return [];
  const made = coverLockup(k, k.lockup, box, ground, turn);
  const title = k.title.words.trim();
  if (made.length && (!title || made.some((e) => e.kind === 'text' && e.text.trim() === title))) return made;
  k.c.notes.push(`the lockup ${k.lockup} has no place for the cover's title, so the cover sets the title its own way`);
  return [];
}

/** Whether a lockup brings an ornament of its own (a ring, a disc, a sun, a band), not hairlines alone. */
export function lockupOrnamented(id: string): boolean {
  return !!findBookLockup(id)?.parts.some((p) => p.kind === 'shape' && Math.min(p.w, p.h) >= 3);
}

/** The asked lockup laid on a draft as one group, else the `fallback` lockup; the parts laid, none when neither sets words. */
export function addLockup(
  k: CoverKit,
  draft: CoverDraft,
  at: { box: BookFrame; ground: string; turn?: number; fallback?: string },
): BookElement[] {
  const asked = askedLockup(k, at.box, at.ground, at.turn ?? 0);
  if (asked.length || !at.fallback) return laid(draft, asked);
  return laid(draft, coverLockup(k, at.fallback, at.box, at.ground, at.turn ?? 0));
}

/** A lockup of the archetype's own, whatever was asked for the title (a postmark beside it). */
export function placeLockup(
  k: CoverKit,
  draft: CoverDraft,
  at: { id: string; box: BookFrame; ground: string; turn?: number },
): BookElement[] {
  return laid(draft, coverLockup(k, at.id, at.box, at.ground, at.turn ?? 0));
}

interface CoverTextOpts {
  slot: BookFontSlot;
  /** The largest size, in points; the text is fitted below it. */
  max: number;
  color: string;
  align?: BookTextElement['align'];
  weight?: BookTextElement['weight'];
  tracking?: number;
  leading?: number;
  transform?: BookTextElement['transform'];
  rotation?: number;
  binding?: BookTextElement['binding'];
  outline?: BookTextElement['outline'];
}

/** One text of a cover in a theme face, as large as its frame holds up to `max`. */
export function coverText(k: PageKit, words: string, frame: BookFrame, o: CoverTextOpts): BookTextElement {
  const face = faceFor(k.c, o.slot);
  const font = (face?.font ?? k.c.look.heading) as BookTextElement['font'];
  const el: BookTextElement = {
    id: k.c.newId('t'),
    kind: 'text',
    frame: frameOf(frame.x, frame.y, frame.w, frame.h),
    rotation: o.rotation ?? 0,
    opacity: 1,
    locked: false,
    text: words,
    font,
    size: o.max,
    weight: nearestBookWeight(font, o.weight ?? face?.weight ?? 400) as BookTextElement['weight'],
    italic: false,
    align: o.align ?? 'center',
    leading: o.leading ?? 1.05,
    tracking: o.tracking ?? 0,
    color: o.color,
    binding: o.binding ?? null,
    overridden: false,
    vAlign: 'middle',
    fit: 'shrink',
    fitMax: o.max,
    ...(o.transform ? { transform: o.transform } : {}),
    ...(o.outline ? { outline: o.outline } : {}),
  };
  return { ...el, size: solveBookTextFit(el, o.max) };
}

/** The cover title as a text of its own, bound to the journey's unless the person gave theirs. */
export function titleText(k: CoverKit, frame: BookFrame, o: Omit<CoverTextOpts, 'slot' | 'binding'>): BookTextElement {
  const binding = k.title.bound ? { source: 'journey.title' as const } : null;
  return coverText(k, k.title.words.trim(), frame, { ...o, slot: 'display', binding });
}

/**
 * A short line of spaced capitals (a year, a month, a subtitle), in the
 * heading face, at `max` points times `type.scale` as far as its frame holds.
 */
export function spacedLine(k: PageKit, words: string, frame: BookFrame, color: string, max = 9): BookTextElement {
  const size = Math.round(max * (k.c.directives.type?.scale ?? 1) * 4) / 4;
  return coverText(k, words, frame, {
    slot: 'heading',
    max: size,
    color,
    weight: 600,
    tracking: 0.3,
    transform: 'upper',
  });
}

// ── shapes and photos ──────────────────────────────────────────────────────

/** A filled shape, unturned unless said, with no outline. */
export function shapeEl(
  k: PageKit,
  shape: BookShapeId,
  frame: BookFrame,
  fill: string,
  rotation = 0,
): BookShapeElement {
  return {
    id: k.c.newId('s'),
    kind: 'shape',
    frame: frameOf(frame.x, frame.y, frame.w, frame.h),
    rotation: r2(rotation),
    opacity: 1,
    locked: false,
    shape,
    fill,
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    strokeStyle: 'solid',
    radius: 0,
  };
}

/** Where a span starts so that neither of its ends stops a sliver short of the trim or between trim and bleed. */
function settle(lo: number, span: number, extent: number, bleed: number): number {
  let start = lo;
  if (start > -(bleed + 1) && start < 2) start = start < 0.5 ? -(bleed + 1) : 2;
  const end = start + span;
  if (end < extent + bleed + 1 && end > extent - 2) {
    const target = end > extent - 0.5 ? extent + bleed + 1 : extent - 2;
    start = target - span;
  }
  return start;
}

/**
 * A box, turned by `rotation`, moved so that every edge is either well inside
 * the page (2 mm or more) or runs past the bleed: never one that stops a
 * sliver short of the trim or between the trim and the bleed edge, which a
 * print shop would cut badly.
 */
export function clearOfTrim(k: PageKit, frame: BookFrame, rotation = 0): BookFrame {
  const turned = turnedBox(frame, rotation);
  const dx = (turned.w - frame.w) / 2;
  const dy = (turned.h - frame.h) / 2;
  const x = settle(frame.x - dx, turned.w, k.W, k.b) + dx;
  const y = settle(frame.y - dy, turned.h, k.H, k.b) + dy;
  return frameOf(x, y, frame.w, frame.h);
}

/** The cover photo to the bleed of the page, as a cover takes it. */
export function bleedPhoto(k: CoverKit, photo: AutoPhoto): BookPhotoElement {
  return photoEl(k.c, photo, bleedPage(k.c, 'single'), { bleed: { side: 'single' } });
}

interface PrintLook {
  turn?: number;
  border?: { width: number; color: string };
  shadow?: boolean;
  mask?: BookShapeId;
  edge?: { edge: NonNullable<BookPhotoElement['edge']>; size: number };
  cutout?: { width: number; color: string };
}

/** A photo laid on the cover as a print: framed at print resolution, turned, with the look asked for. */
export function printEl(k: PageKit, photo: AutoPhoto, frame: BookFrame, look: PrintLook = {}): BookPhotoElement {
  const el = photoEl(k.c, photo, frame, { turn: look.turn ?? 0 });
  return {
    ...el,
    frameStyle: 'none',
    ...(look.border ? { border: look.border } : {}),
    ...(look.shadow ? { shadow: { dx: r2(k.W / 160), dy: r2(k.W / 160), color: k.c.look.ink, alpha: 0.22 } } : {}),
    ...(look.mask ? { mask: look.mask } : {}),
    ...(look.edge ? { edge: look.edge.edge, edgeSize: look.edge.size } : {}),
    ...(look.cutout ? { cutout: look.cutout } : {}),
  };
}

/** A turn the archetype asks for, kept to the most the book's energy takes: a calm book's prints lie nearly straight. */
export function keptTurn(k: PageKit, turn: number): number {
  return withinTilt(k.c.art ?? CALM_ART, turn);
}

/** Millimetres scaled from a 210 mm page to this one. */
export const mmOn = (k: PageKit, v: number) => (v * k.W) / 210;

/**
 * How wide a round badge laid at a point over photos may be, from `most` down
 * to `least`, so that no photo's detail (its focal point) is hidden under it;
 * `least` when even that hides one.
 */
export function badgeSpan(
  photos: readonly BookPhotoElement[],
  at: [number, number],
  most: number,
  least: number,
): number {
  const hidden = (d: number) =>
    photos.some((p) => {
      const fx = p.frame.x + p.focalX * p.frame.w;
      const fy = p.frame.y + p.focalY * p.frame.h;
      return Math.abs(fx - at[0]) <= d / 2 + 1 && Math.abs(fy - at[1]) <= d / 2 + 1;
    });
  for (let d = most; d > least; d -= (most - least) / 6) if (!hidden(d)) return d;
  return least;
}
