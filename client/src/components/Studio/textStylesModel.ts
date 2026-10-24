import type { BookElement, BookLockup, BookLockupWords, BookPageSetup, BookSpread } from '@trek/shared';
import { BOOK_LOCKUPS, bookLockupBox, buildBookLockup, formatBookCoords } from '@trek/shared';

import { firstFillPhoto } from './textEffects';

/**
 * What the Text styles shelf places and draws: the words a lockup is filled
 * with, the order the shelf shows the lockups in, and the elements one lockup
 * becomes on a page.
 */

/** What the shelf knows of the journey: its stops, for a year and a point. */
export interface ShelfSource {
  entries: readonly { date: string | null; lat: number | null; lng: number | null }[];
  photos: readonly { photoId: number }[];
}

/** Lisbon, where the samples are set, for a journey that has recorded no point. */
const SAMPLE_POINT = { lat: 38.7139, lng: -9.1334 };

/**
 * The words every lockup is filled with: the book's own title and the year of
 * its first dated stop, its first recorded point, and translated samples for
 * the rest, which are there to be overwritten.
 */
export function shelfWords(
  title: string,
  source: ShelfSource,
  t: (k: string) => string,
  now: Date = new Date()
): BookLockupWords {
  const dated = source.entries.find((e) => e.date)?.date;
  const year = dated ? dated.slice(0, 4) : String(now.getFullYear());
  const point = source.entries.find((e) => e.lat != null && e.lng != null);
  return {
    title: title.trim() || t('journey.studio.lockupWord.title'),
    subtitle: t('journey.studio.lockupWord.subtitle'),
    kicker: t('journey.studio.lockupWord.kicker'),
    overlay: t('journey.studio.lockupWord.overlay'),
    year,
    place: t('journey.studio.lockupWord.place'),
    dates: t('journey.studio.lockupWord.dates'),
    quote: t('journey.studio.lockupWord.quote'),
    caption: t('journey.studio.lockupWord.caption'),
    number: '01',
    label: t('journey.studio.lockupWord.label'),
    coords: formatBookCoords(point?.lat ?? SAMPLE_POINT.lat, point?.lng ?? SAMPLE_POINT.lng),
  };
}

/** The shelf's groups, in the order a page is usually built: a title first, the small marks last. */
export const SHELF_GROUPS = [
  {
    id: 'titles',
    lockups: [
      'poster-stack',
      'spaced-date',
      'serif-sun',
      'title-script-year',
      'script-overlay',
      'photo-word',
      'fabric-band',
      'arched-title',
      'retro-shadow',
      'outline-echo',
      'minimal-caps',
    ],
  },
  { id: 'badges', lockups: ['circle-badge', 'postmark', 'stamp', 'ticket'] },
  { id: 'chapters', lockups: ['chapter-outline', 'chapter-rules', 'day-opener'] },
  {
    id: 'quotes',
    lockups: ['quote-classic', 'quote-band', 'caption-rule', 'caption-number', 'coords-pin', 'coords-stack'],
  },
] as const;

/** A group's lockups, as the catalogue has them. */
export function shelfLockups(ids: readonly string[]): BookLockup[] {
  return ids.flatMap((id) => BOOK_LOCKUPS.filter((l) => l.id === id));
}

/** Where a lockup is placed and with what. */
export interface LockupPlacement {
  page: BookPageSetup;
  spread: BookSpread | undefined;
  words: BookLockupWords;
  gallery: readonly { photoId: number }[];
  newId: (prefix: string) => string;
}

/** The elements one lockup becomes, centred on the page it is placed on, a photo word filled from that page. */
export function placeLockup(lockup: BookLockup, at: LockupPlacement): BookElement[] {
  const single = !!at.spread && at.spread.role !== 'inner';
  const photoId = firstFillPhoto(at.spread, at.gallery);
  return buildBookLockup(lockup, bookLockupBox(lockup, at.page, single), { words: at.words, photoId, newId: at.newId });
}

/** A lockup drawn in a box of its own proportions, 100 mm wide, for the shelf's preview. */
export function previewLockup(lockup: BookLockup, words: BookLockupWords, photoId: number | null): BookElement[] {
  let n = 0;
  const box = { x: 0, y: 0, w: 100, h: lockup.height };
  return buildBookLockup(lockup, box, { words, photoId, newId: (p) => `${p}-preview-${(n += 1)}` });
}
