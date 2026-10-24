import type { BookCoordFormat, BookElement, BookFrame, BookPageSetup } from '@trek/shared';
import { bookElementId as uid } from '@trek/shared';

/**
 * What the Content panel drops on a page: a photo, a piece of an entry still
 * attached to it, a mood or weather mark, an entry's pros and cons.
 *
 * Each arrives centred on the page that is open, across both pages of a
 * spread or on the one page of a cover, at a size that suits it. Pure, so the
 * panel's buttons and the tests build the same elements.
 */

/** Where a drop lands: the book's page, and whether the open page is a single one (a cover). */
export interface DropPlace {
  page: BookPageSetup;
  single: boolean;
}

/** The parts of an entry a text drop is bound to. */
type EntryTextSource = 'entry.title' | 'entry.story' | 'entry.location' | 'entry.date';

/** A frame of this size, centred on the open page or spread. */
export function centred({ page, single }: DropPlace, w: number, h: number): BookFrame {
  const width = single ? page.pageWidth : page.pageWidth * 2;
  return { x: (width - w) / 2, y: (page.pageHeight - h) / 2, w, h };
}

/** A photo, a little over half the short side of the page, in a 4:3 frame. */
export function photoDrop(place: DropPlace, photoId: number): BookElement {
  const side = Math.min(place.page.pageWidth, place.page.pageHeight) * 0.55;
  return {
    id: uid('p'),
    kind: 'photo',
    frame: centred(place, side, side * 0.75),
    rotation: 0,
    opacity: 1,
    locked: false,
    photoId,
    fit: 'cover',
    focalX: 0.5,
    focalY: 0.5,
    radius: 0,
    filter: 'none',
  } as BookElement;
}

/**
 * One piece of the entry, dropped on the page and still attached to it.
 *
 * `format` is what separates a place name from a set of coordinates: both read
 * the entry's location, and which of the two gets printed is a property of the
 * binding rather than a second source. `width` exists because a line of
 * coordinates arriving inside a full-column selection rectangle looks like a
 * bug; only the short marks pass it. `value` is the fact behind formatted
 * words (the ISO date, the point), so a book can re-read its own text.
 */
export function textDrop(
  place: DropPlace,
  text: string,
  style: { size: number; weight: 400 | 700 },
  binding: { entryId: number; source: EntryTextSource; format?: BookCoordFormat; value?: string },
  width?: number
): BookElement {
  const { size, weight } = style;
  const w = width ?? place.page.pageWidth - 32;
  return {
    id: uid('t'),
    kind: 'text',
    frame: centred(place, w, size * 0.4 + 10),
    rotation: 0,
    opacity: 1,
    locked: false,
    text,
    font: 'sans',
    size,
    weight,
    italic: false,
    align: 'left',
    leading: weight === 700 ? 1.1 : 1.55,
    tracking: weight === 700 ? -0.02 : 0,
    color: '#1a1a1a',
    binding: {
      source: binding.source,
      entryId: binding.entryId,
      ...(binding.format ? { format: binding.format } : {}),
      ...(binding.value ? { value: binding.value } : {}),
    },
    overridden: false,
  } as BookElement;
}

/** What every mark and list starts from: upright, opaque, in the book's ink with one warm accent. */
const MARK_BASE = {
  rotation: 0,
  opacity: 1,
  locked: false,
  font: 'sans' as const,
  color: '#1a1a1a',
  accent: '#c2410c',
  textScale: 1,
  stale: false,
};

/**
 * A mood or a weather mark, drawn with the icon the journey page uses.
 *
 * `code` holds the key rather than the label, so the element carries what the
 * entry recorded and the renderer decides how to draw it.
 */
export function markDrop(place: DropPlace, variant: 'mood' | 'weather', code: string, label: string): BookElement {
  return {
    ...MARK_BASE,
    id: uid('bd'),
    kind: 'badge',
    autoColor: true,
    // Set here as well as in the contract: this object is cast, not parsed.
    showIcon: true,
    showLabel: true,
    autoIconColor: true,
    iconColor: '#111111',
    frame: centred(place, place.page.pageWidth * 0.22, place.page.pageHeight * 0.062),
    variant,
    text: label,
    sub: '',
    code,
    style: 'plain',
  } as BookElement;
}

/** Both columns of an entry's pros and cons, as one element, tall enough for its longer column. */
export function prosConsDrop(
  place: DropPlace,
  items: { pros: string[]; cons: string[] },
  labels: { pro: string; con: string }
): BookElement {
  const rows = Math.max(items.pros.length, items.cons.length, 1);
  return {
    ...MARK_BASE,
    id: uid('li'),
    kind: 'list',
    // What ListView needs for `rows` lines at its largest line size, so the element arrives filled.
    frame: centred(place, place.page.pageWidth * 0.72, Math.min(place.page.pageHeight * 0.6, 6 * (0.86 + 1.7 * rows))),
    items: [
      ...items.pros.map((text) => ({ text, tone: 'pro' as const })),
      ...items.cons.map((text) => ({ text, tone: 'con' as const })),
    ],
    layout: 'columns',
    showMarks: true,
    proLabel: labels.pro,
    conLabel: labels.con,
  } as BookElement;
}
