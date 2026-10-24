import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { formatBookDate } from '../book-text';
import { bookEntryListItems, bookTravelList, bookTravelMap, bookTravelSize } from '../book-travel';
import type { BookElement, BookFrame, BookSpread, BookTextElement } from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import {
  bleedPage,
  bleedSpread,
  frameOf,
  liveBox,
  other,
  pageX,
  photoEl,
  printsAt,
  scaled,
  scrimEl,
  storyEl,
  textEl,
  titleBlock,
  turnOf,
  type ComposeCtx,
  type Side,
} from './design-compose';
import { isLandscape } from './design-photos';
import { paperBackground } from './design-style';

/**
 * The spreads of a chapter, one composer per beat: the opener, the hero, a
 * quiet page for the words that run long, two, three and four to six photos,
 * and a panorama across the fold. Each takes the photos the plan gave it and
 * the page (left or right) its photos lead on, and hands back the elements and
 * whatever of the chapter's words it could not set. The words flow in reading
 * order from the opener (or the panorama) onto the quiet pages: the first
 * entry's story, its pros and cons under it where they leave room, then the
 * story of every further entry of the chapter under a small heading of its
 * title. Pros and cons with no room where they fall wait, with the words after
 * them, for a later page that takes words.
 */

/** An entry's story still to be set: the whole of it, or what a page before left of it. */
interface Passage {
  kind: 'story';
  entry: AutoEntry;
  words: string;
  /** Whether a page before set its start, so the part left is set unbound. */
  begun: boolean;
  /** Whether a small heading of the entry's title goes over its first words: an entry after its chapter's first. */
  headed: boolean;
}

/** What a chapter still has to set, in reading order: stories, and its first entry's pros and cons after its story. */
export type FlowItem = Passage | { kind: 'list'; entry: AutoEntry };

/** A chapter's words as a page gets them. */
export interface Words {
  /** What is still to set, in reading order. */
  flow: readonly FlowItem[];
  /** Whether a later page of the chapter takes words, so pros and cons with no room where they fall wait for it. */
  later: boolean;
}

export interface Composed {
  elements: BookElement[];
  /** The chapter's words still to be set, for the next page that takes words; absent on a page that takes none. */
  rest?: FlowItem[];
}

type Hand = 'left' | 'right';

/** A photo's caption under it, when the directives ask for photo captions and it has one. */
function captionFor(c: ComposeCtx, photo: AutoPhoto, frame: BookFrame, entryId: number | null): BookElement | null {
  if ((c.directives.text?.captions ?? 'entry') !== 'photo' || !photo.caption?.trim()) return null;
  const binding = { source: 'photo.caption' as const, photoId: photo.photoId, ...(entryId ? { entryId } : {}) };
  const at = { x: frame.x, y: frame.y + frame.h + 2, w: frame.w };
  return textEl(c, at, photo.caption.trim(), 'caption', { binding });
}

/** The room a caption takes under a photo, when one will be set. */
function captionRoom(c: ComposeCtx, photos: readonly AutoPhoto[]): number {
  if ((c.directives.text?.captions ?? 'entry') !== 'photo') return 0;
  return photos.some((p) => p.caption?.trim()) ? scaled(c, 9) : 0;
}

/** Photos in a page's live area: one, two (stacked or side by side by their shape) or three. */
function pagePhotos(c: ComposeCtx, photos: readonly AutoPhoto[], side: Side, entryId: number | null): BookElement[] {
  const box = liveBox(c, side);
  const g = c.grid.gutter;
  const room = captionRoom(c, photos);
  const cells = cellsFor(photos, box, g, room);
  const out: BookElement[] = [];
  photos.forEach((p, i) => {
    const cell = cells[i];
    if (!cell) return;
    const el = photoEl(c, p, cell, { turn: turnOf(c, i) });
    out.push(el);
    const caption = captionFor(c, p, el.frame, entryId);
    if (caption) out.push(caption);
  });
  return out;
}

/** Cells for up to three photos in a box, the gutter between them and room under each for a caption. */
function cellsFor(photos: readonly AutoPhoto[], box: BookFrame, g: number, room: number): BookFrame[] {
  const n = Math.min(3, photos.length);
  const sideBySide = photos.slice(0, 2).every((p) => !isLandscape(p));
  if (n === 1) return [frameOf(box.x, box.y, box.w, box.h - room)];
  if (n === 2 && sideBySide) {
    const w = (box.w - g) / 2;
    return [frameOf(box.x, box.y, w, box.h - room), frameOf(box.x + w + g, box.y, w, box.h - room)];
  }
  if (n === 2) {
    const h = (box.h - g - room * 2) / 2;
    return [frameOf(box.x, box.y, box.w, h), frameOf(box.x, box.y + h + room + g, box.w, h)];
  }
  const top = (box.h - g - room * 2) * 0.58;
  const low = box.h - g - room * 2 - top;
  const w = (box.w - g) / 2;
  const y2 = box.y + top + room + g;
  return [frameOf(box.x, box.y, box.w, top), frameOf(box.x, y2, w, low), frameOf(box.x + w + g, y2, w, low)];
}

/** Where a column has room left: from under the words set in it (a gutter apart) to its foot. */
interface Foot {
  x: number;
  w: number;
  top: number;
  bottom: number;
}

/** How tall an entry's pros and cons are as a list: a row for each on the longer side. */
function listHeight(c: ComposeCtx, entry: AutoEntry): number {
  const items = bookEntryListItems(entry);
  const pros = items.filter((i) => i.tone === 'pro').length;
  return bookTravelSize('list', c.page, { rows: Math.max(pros, items.length - pros) }).h;
}

/**
 * An entry's pros and cons as a list in the room under its words, headed in
 * the book's language and set in its look; null when the entry has none or
 * the room is too small. The words are never moved for it.
 */
function listUnder(c: ComposeCtx, entry: AutoEntry, foot: Foot): BookElement | null {
  const items = bookEntryListItems(entry);
  if (!items.length) return null;
  const h = listHeight(c, entry);
  if (foot.top + h > foot.bottom) return null;
  const labels = { pros: c.travel.labels.pros, cons: c.travel.labels.cons };
  const list = bookTravelList(labels, { id: c.newId('li'), frame: frameOf(foot.x, foot.top, foot.w, h), items });
  return { ...list, font: c.look.figures, color: c.look.ink, accent: c.look.accent };
}

/**
 * A small heading over a later entry's story, bound to the entry: its title,
 * else its place (as the title block sets them), else its date; null when it
 * has none of them.
 */
function runIn(c: ComposeCtx, entry: AutoEntry, foot: Foot): BookTextElement | null {
  const at = { x: foot.x, y: foot.top, w: foot.w };
  const name = entry.title || entry.location;
  if (name) return textEl(c, at, name, 'sub', { binding: { source: 'entry.title', entryId: entry.id } });
  const iso = entry.date ?? '';
  const date = formatBookDate(iso, c.locale);
  if (!date) return null;
  return textEl(c, at, date, 'sub', { binding: { source: 'entry.date', entryId: entry.id, value: iso } });
}

/** One step down a column: what it set, where that ends, the words left after it. */
interface Step {
  els: BookElement[];
  end: number;
  rest: FlowItem[];
  /** Whether a story was cut: the column is full and the rest of it goes to the next page. */
  cut: boolean;
}

/**
 * As much of a story as the room holds, under its heading where it opens (a
 * heading is never left without words under it), `after` the words that come
 * next; null when not a line of it fits.
 */
function setPassage(c: ComposeCtx, passage: Passage, after: readonly FlowItem[], foot: Foot): Step | null {
  const head = passage.headed && !passage.begun ? runIn(c, passage.entry, foot) : null;
  const top = head ? head.frame.y + head.frame.h + 3 : foot.top;
  const box = frameOf(foot.x, top, foot.w, foot.bottom - top);
  const story = storyEl(c, passage.entry, passage.words, box, !passage.begun);
  if (!story.el) return null;
  const left: FlowItem[] = story.rest ? [{ ...passage, words: story.rest, begun: true }] : [];
  return {
    els: head ? [head, story.el] : [story.el],
    end: story.el.frame.y + story.el.frame.h,
    rest: [...left, ...after],
    cut: left.length > 0,
  };
}

/**
 * The next of a chapter's words, `item`, in the room under those set: a
 * story, or the list where it has room. A list with no room where it falls
 * waits, with the words `after` it, when a later page `waits` for them and
 * holds it; else the words go on without it, and the notes say it is left
 * out. Null when nothing fits.
 */
function setNext(c: ComposeCtx, item: FlowItem, after: readonly FlowItem[], foot: Foot, waits: boolean): Step | null {
  if (item.kind === 'story') return setPassage(c, item, after, foot);
  const list = listUnder(c, item.entry, foot);
  if (list) return { els: [list], end: list.frame.y + list.frame.h, rest: [...after], cut: false };
  if (waits && listHeight(c, item.entry) <= liveBox(c, 'left').h) return null;
  const [next, ...later] = after;
  return next?.kind === 'story' ? setPassage(c, next, later, foot) : null;
}

interface Flowed {
  elements: BookElement[];
  rest: FlowItem[];
}

/**
 * A chapter's words down a column in reading order, each a gutter under the
 * one before: a story as far as it fits (cut at a sentence, the rest handed
 * on), every further entry's under a small heading of its title, the first
 * entry's pros and cons under its story where they leave room, else on a
 * later page when one `waits` for the words.
 */
function flowWords(c: ComposeCtx, flow: readonly FlowItem[], column: BookFrame, waits: boolean): Flowed {
  const elements: BookElement[] = [];
  let top = column.y;
  let rest = [...flow];
  let item: FlowItem | undefined = rest[0];
  while (item) {
    const foot = { x: column.x, w: column.w, top, bottom: column.y + column.h };
    const step = setNext(c, item, rest.slice(1), foot, waits);
    if (!step) break;
    elements.push(...step.els);
    top = step.end + c.grid.gutter;
    rest = step.rest;
    item = step.cut ? undefined : rest[0];
  }
  return { elements, rest };
}

/**
 * The chapter opens: the title block and the chapter's words on one page, a
 * photo to the bleed on the other. Without a photo the words run on across
 * both pages.
 */
export function composeOpener(
  c: ComposeCtx,
  entry: AutoEntry,
  photo: AutoPhoto | null,
  hand: Hand,
  words: Words,
): Composed {
  const textSide = photo ? other(hand) : 'left';
  const box = liveBox(c, textSide);
  const head = titleBlock(c, entry, box);
  const els: BookElement[] = [...head.els];
  let bottom = box.y + box.h;
  const map = chapterMap(c, entry, box);
  if (map) {
    els.push(map);
    bottom = map.frame.y - c.grid.gutter;
  }
  const column = frameOf(box.x, head.bottom + 2, box.w, bottom - head.bottom - 2);
  const set = flowWords(c, words.flow, column, words.later || !photo);
  els.push(...set.elements);
  if (photo) {
    els.unshift(photoEl(c, photo, bleedPage(c, hand), { bleed: { side: hand } }));
    return { elements: els, rest: set.rest };
  }
  if (!set.rest.length) return { elements: els, rest: set.rest };
  const more = flowWords(c, set.rest, liveBox(c, 'right'), words.later);
  return { elements: [...els, ...more.elements], rest: more.rest };
}

/** The trip a chapter's stop is on: the stop read from its entry, else the one at its place; null for none. */
export function tripOf(stats: JourneyStats, entry: AutoEntry): number | null {
  const own = stats.points.find((p) => p.entryId === entry.id);
  const stop = own ?? stats.points.find((p) => p.lat === entry.lat && p.lng === entry.lng);
  return stop?.tripId ?? null;
}

/**
 * A small map of the chapter's trip at the foot of the title page, when the
 * directives ask for one. A stored map is of the journey or of one trip, so a
 * map of the trip is current when placed and stays the trip's when refreshed;
 * a stop on no trip gets none (the journey's map is the summary's).
 */
function chapterMap(c: ComposeCtx, entry: AutoEntry, box: BookFrame): BookElement | null {
  const stats = c.travel.stats;
  if (!c.directives.travel?.chapterMaps || !stats) return null;
  const tripId = tripOf(stats, entry);
  if (tripId === null) return null;
  const h = box.h * 0.3;
  const frame = frameOf(box.x, box.y + box.h - h, box.w, h);
  const map = bookTravelMap(c.travel, stats, { id: c.newId('mp'), frame, scope: { tripId } });
  const look = { style: c.look.mapStyle, font: c.look.figures, color: c.look.ink, accent: c.look.accent };
  return { ...map, ...look, pinStyle: 'dot' };
}

/**
 * One photo across the whole spread, the title on a scrim at the foot of a
 * page. The detail is kept off the fold; the chapter's words go to the next
 * page that takes words.
 */
export function composeHero(c: ComposeCtx, entry: AutoEntry, photo: AutoPhoto, hand: Hand): Composed {
  const { pageWidth: PW, pageHeight: H, bleed: b, margin: m } = c.grid;
  const sx = c.infos.get(photo.photoId)?.salient?.x;
  const focalX = sx !== undefined && (sx < 0.4 || sx > 0.6) ? sx : 0.62;
  const els: BookElement[] = [photoEl(c, photo, bleedSpread(c), { bleed: { side: 'left' }, focalX })];
  const top = H * 0.55;
  const textSide = other(hand);
  els.push(scrimEl(c, frameOf(textSide === 'left' ? -b : PW, top, PW + b, H - top + b)));
  const box = frameOf(pageX(c, textSide) + m, top + m * 0.6, PW - m * 2, H - top - m * 1.6);
  els.push(...titleBlock(c, entry, box, { onScrim: true }).els);
  return { elements: els };
}

/** The narrow column of a quiet page: the page's live area, set in on both sides. */
function quietColumn(c: ComposeCtx, side: Hand): BookFrame {
  const box = liveBox(c, side);
  const inset = box.w * 0.08;
  return frameOf(box.x + inset, box.y, box.w - inset * 2, box.h);
}

/**
 * A page for the chapter's words the pages before had no room for: the words
 * in a narrow column, the first entry's pros and cons in their place among
 * them (at the head of the column when its words were all set before), a
 * photo on the other page when there is one. Without a photo the column runs
 * on from the left page onto the right, so a day of several stories keeps to
 * its one spread.
 */
export function composeQuiet(
  c: ComposeCtx,
  words: Words,
  photo: AutoPhoto | null,
  hand: Hand,
  entryId: number | null,
): Composed {
  const sides: Hand[] = photo ? [other(hand)] : ['left', 'right'];
  const els: BookElement[] = [];
  let rest = [...words.flow];
  for (const side of sides) {
    if (!rest.length) break;
    // The left page of a spread without a photo hands on to the right one.
    const set = flowWords(c, rest, quietColumn(c, side), words.later || (!photo && side === 'left'));
    els.push(...set.elements);
    rest = set.rest;
  }
  if (photo) els.push(...pagePhotos(c, [photo], hand, entryId));
  return { elements: els, rest };
}

/** Two photos: one to the bleed of its page, the other framed on the facing page. */
export function composeDuo(c: ComposeCtx, list: readonly AutoPhoto[], hand: Hand, entryId: number | null): Composed {
  const [a, ...rest] = list;
  const els: BookElement[] = [];
  if (a) els.push(photoEl(c, a, bleedPage(c, hand), { bleed: { side: hand } }));
  els.push(...pagePhotos(c, rest.slice(0, 1), other(hand), entryId));
  return { elements: els };
}

/** Three photos: one to the bleed of its page, two framed on the facing page. */
export function composeTrio(c: ComposeCtx, list: readonly AutoPhoto[], hand: Hand, entryId: number | null): Composed {
  const [a, ...rest] = list;
  const els: BookElement[] = [];
  if (a) els.push(photoEl(c, a, bleedPage(c, hand), { bleed: { side: hand } }));
  els.push(...pagePhotos(c, rest.slice(0, 2), other(hand), entryId));
  return { elements: els };
}

/** Four to six photos, framed on both pages, the fuller page on the leading side. */
export function composeGrid(c: ComposeCtx, list: readonly AutoPhoto[], hand: Hand, entryId: number | null): Composed {
  const lead = Math.min(3, Math.ceil(list.length / 2));
  const els = [
    ...pagePhotos(c, list.slice(0, lead), hand, entryId),
    ...pagePhotos(c, list.slice(lead, lead + 3), other(hand), entryId),
  ];
  return { elements: els };
}

/**
 * A panorama across the top of the spread, the title and the chapter's words
 * under it on one page, up to two photos under it on the other.
 */
export function composePano(
  c: ComposeCtx,
  entry: AutoEntry,
  pano: AutoPhoto,
  others: readonly AutoPhoto[],
  hand: Hand,
  words: Words,
): Composed {
  const { pageWidth: PW, pageHeight: H, bleed: b, margin: m, gutter: g } = c.grid;
  const band = frameOf(-b, -b, PW * 2 + b * 2, H * 0.5 + b);
  const els: BookElement[] = [photoEl(c, pano, band, { bleed: { side: 'left' }, focalX: 0.35 })];
  const top = H * 0.5 + g;
  const textSide = other(hand);
  const box = frameOf(pageX(c, textSide) + m, top, PW - m * 2, H - m - top);
  const head = titleBlock(c, entry, box);
  els.push(...head.els);
  const column = frameOf(box.x, head.bottom + 2, box.w, box.y + box.h - head.bottom - 2);
  const set = flowWords(c, words.flow, column, words.later);
  els.push(...set.elements);
  const row = others.slice(0, 2);
  const cell = frameOf(pageX(c, hand) + m, top, PW - m * 2, H - m - top);
  const w = row.length > 1 ? (cell.w - g) / 2 : cell.w;
  row.forEach((p, i) => {
    const frame = frameOf(cell.x + i * (w + g), cell.y, w, cell.h);
    els.push(photoEl(c, p, frame, { turn: turnOf(c, i) }));
  });
  return { elements: els, rest: set.rest };
}

/** Whether a panorama can run across the top of the spread at print resolution. */
export function panoFits(c: ComposeCtx, pano: AutoPhoto): boolean {
  const { pageWidth: PW, pageHeight: H, bleed: b } = c.grid;
  return printsAt(c, pano, frameOf(-b, -b, PW * 2 + b * 2, H * 0.5 + b));
}

/** An inner spread holding the composed elements, on the book's paper. */
export function innerSpread(c: ComposeCtx, elements: BookElement[], entryId: number | null): BookSpread {
  return { id: c.newId('sp'), role: 'inner', background: paperBackground(c.look), elements, parked: [], entryId };
}
