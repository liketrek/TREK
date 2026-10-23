import { bookElementId } from '../book-ids';
import { blankBook, blankSpread } from '../book-pages';
import { MAX_BOOK_TITLE, MAX_SPREADS, type BookDocument, type BookPageSetup, type BookSpread } from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import {
  STATIONS_PER_PAGE,
  backSpread,
  countriesSpread,
  coverSpread,
  stationsSpread,
  summarySpread,
} from './auto-book-spreads';
import { countryNames, isPano, type NewId } from './auto-elements';
import {
  bandSpread,
  gallerySpread,
  immersiveSpread,
  panelSpread,
  panoSpread,
  placeSpread,
  storySpread,
  type EntryContext,
} from './auto-spreads';
import { applyAutoTemplate, autoTemplateFit } from './auto-template-apply';
import { AUTO_TEMPLATES } from './auto-templates.data';
import type { AutoEntry, AutoInput, AutoPhoto } from './auto-types';

/**
 * The auto mode: turn a journey into a book.
 *
 * The one rule that shapes everything else is that this produces an ordinary
 * document. There is no "auto layout" state that locks, no template engine
 * that re-runs behind the user's back: it lays the pages out once, and from
 * that moment every element is as editable as one dragged in by hand.
 *
 * Templates are chosen by what the material actually is: how many photos the
 * entry has, whether they are portrait or landscape, how much story there is
 * to set. Moved here from the Studio (client/src/components/Studio/autoLayout.ts)
 * so the Studio and the server's design tool lay a book out the same way;
 * `auto-layout.parity.spec.ts` holds the move to the old code's output.
 */

const idsOf = (input: AutoInput): NewId => input.newId ?? bookElementId;

/**
 * Whether an entry has anything to fill a spread with. A journey built from a
 * trip starts as one skeleton entry per stop: a date, a place name, nothing
 * else. Those share a list rather than taking a spread each.
 */
export function autoEntryHasSubstance(entry: AutoEntry): boolean {
  return entry.photos.length > 0 || !!(entry.story || '').trim();
}

/**
 * A hand-drawn template for this entry, if one of them fits. Tried before the
 * layouts written as code: a page somebody designed beats a page a function
 * reasoned its way to. Rotated by position so a run of similar entries does
 * not come out as a run of identical pages.
 */
function templateSpread(entry: AutoEntry, input: AutoInput, index: number, newId: NewId): BookSpread | null {
  const templates = input.templates ?? AUTO_TEMPLATES;
  const scored = templates
    .map((t) => ({ t, fit: autoTemplateFit(t, entry) }))
    .filter((x) => x.fit >= 0)
    .sort((a, b) => b.fit - a.fit);
  const best = scored[0];
  if (!best) return null;
  // Everything within a few points of the best is equally suitable, so the position picks between them.
  const equals = scored.filter((x) => x.fit >= best.fit - 5);
  const pick = equals[index % equals.length] ?? best;
  const ctx = { page: input.page, locale: input.locale, stats: input.stats, dayLabel: input.dayLabel, newId };
  return applyAutoTemplate(pick.t, entry, ctx);
}

/**
 * One entry, one spread: a drawn template when one fits, else one of the
 * layouts written as code, by contents first (a panorama wants the fold, a
 * stop with nothing said about it wants the place page) and then by position.
 * The full-bleed page is kept to every sixth and never the first.
 */
function entrySpread(entry: AutoEntry, input: AutoInput, index: number, newId: NewId): BookSpread {
  const hand = index % 2 === 0 ? 'left' : 'right';
  const photos = entry.photos.slice(0, 5);
  const withPhotos = { ...entry, photos };
  const c: EntryContext = { entry: withPhotos, input, index, hand, newId };
  const story = (entry.story || '').trim();

  const fromTemplate = templateSpread(withPhotos, input, index, newId);
  if (fromTemplate) return fromTemplate;
  if (photos.length === 0 && !story) return placeSpread(c);
  const first = photos[0];
  if (first && isPano(first)) return panoSpread(c);
  switch (index % 6) {
    case 0:
      return photos.length > 1 ? gallerySpread(c) : storySpread(c);
    case 1:
      return panelSpread(c);
    case 2:
      return photos.length > 2 ? bandSpread(c) : storySpread(c);
    case 3:
      return photos.length ? immersiveSpread(c) : panelSpread(c);
    case 4:
      return photos.length > 1 ? bandSpread(c) : panelSpread(c);
    default:
      return photos.length > 1 ? gallerySpread(c) : storySpread(c);
  }
}

/**
 * The page setup for a book that opens on a single page: the first page
 * inside the covers is page 1 (#2317). Nothing else of the setup is touched.
 */
function withFirstPage(page: BookPageSetup): BookPageSetup {
  return { ...page, pageNumbers: { ...page.pageNumbers, startAt: 1 } };
}

/** The spreads the entries make: one each for entries with substance, a shared list for runs of bare ones. */
function entrySpreads(input: AutoInput, newId: NewId): BookSpread[] {
  const out: BookSpread[] = [];
  let laid = 0;
  let run: AutoEntry[] = [];
  const flushRun = () => {
    for (let i = 0; i < run.length; i += STATIONS_PER_PAGE * 2) {
      out.push(stationsSpread(run.slice(i, i + STATIONS_PER_PAGE * 2), input, newId));
    }
    run = [];
  };
  for (const entry of input.entries) {
    if (autoEntryHasSubstance(entry)) {
      flushRun();
      out.push(entrySpread(entry, input, laid++, newId));
    } else {
      run.push(entry);
    }
  }
  flushRun();
  return out;
}

/**
 * The whole book: the cover, the first page, the journey at a glance and its
 * countries (both left out when the journey has nothing to say with them),
 * the entries in the order they happened, the last page and the back cover.
 */
export function buildBook(input: AutoInput): BookDocument {
  const newId = idsOf(input);
  const spreads: BookSpread[] = [coverSpread(input, newId), blankSpread('first', newId)];
  const summary = summarySpread(input, newId);
  if (summary) spreads.push(summary);
  const countries = countriesSpread(input, countryNames(input), newId);
  if (countries) spreads.push(countries);
  spreads.push(...entrySpreads(input, newId));
  spreads.push(blankSpread('last', newId), backSpread(input, newId));
  return {
    version: 1,
    title: input.title.slice(0, MAX_BOOK_TITLE),
    page: withFirstPage(input.page),
    spreads: spreads.slice(0, MAX_SPREADS),
  };
}

/**
 * A book nobody has laid out yet: what a journey with no book opens on. The
 * layout is offered, not applied; the same blank book `create_book` writes.
 */
export function emptyBook(input: AutoInput): BookDocument {
  return blankBook({ title: input.title, page: input.page, newId: idsOf(input) });
}

/**
 * Lay one spread out again, from the entry it came from, keeping its id so the
 * pages rail does not jump. Null for a spread that has no entry behind it (the
 * covers, the summary, anything added by hand): there is nothing to rebuild it
 * from, and replacing it with a blank page would be worse than refusing.
 */
export function relayoutSpread(spread: BookSpread, input: AutoInput): BookSpread | null {
  if (spread.role !== 'inner' || spread.entryId == null) return null;
  const entry = input.entries.find((e) => e.id === spread.entryId);
  if (!entry) return null;
  const index = input.entries.indexOf(entry);
  return { ...entrySpread(entry, input, index < 0 ? 0 : index, idsOf(input)), id: spread.id };
}

/**
 * Hand the journey's loose gallery photos to the entries. Photos that already
 * sit on an entry stay there; the rest are shared out in order, so a book
 * built from a journey whose pictures all live in the gallery still gets
 * pictures on its pages.
 */
export function distributeGallery(entries: AutoEntry[], gallery: readonly AutoPhoto[]): AutoEntry[] {
  const taken = new Set(entries.flatMap((e) => e.photos.map((p) => p.photoId)));
  const loose = gallery.filter((p) => !taken.has(p.photoId));
  if (!loose.length || !entries.length) return entries;
  const per = Math.max(1, Math.floor(loose.length / entries.length));
  let i = 0;
  return entries.map((e, idx) => {
    if (e.photos.length >= 4) return e;
    const want = Math.min(4 - e.photos.length, idx === entries.length - 1 ? loose.length - i : per);
    const slice = loose.slice(i, i + Math.max(0, want));
    i += slice.length;
    return { ...e, photos: [...e.photos, ...slice] };
  });
}

/**
 * Give every entry what the journey's figures know about its stop: the
 * coordinates and country its place resolved to, and which day of the
 * journey it is. Matched by date first and by name second, because a day
 * usually has one stop and two stops on one day are told apart by name.
 */
export function autoEntriesWithStops(entries: readonly AutoEntry[], stats: JourneyStats | null): AutoEntry[] {
  const points = stats?.points ?? [];
  const dayCount = stats?.days ?? null;
  // Calendar days counted in UTC: a local midnight would lose a day across a change to summer time.
  const first = stats?.start ? Date.parse(`${stats.start}T00:00:00Z`) : Number.NaN;
  return entries.map((entry) => {
    const byDate = points.find((p) => p.date && entry.date && p.date === entry.date);
    const point = byDate ?? points.find((p) => p.label && entry.location && p.label === entry.location);
    const at = entry.date ? Date.parse(`${entry.date}T00:00:00Z`) : Number.NaN;
    const known = Number.isFinite(at) && Number.isFinite(first);
    const dayNumber = known ? Math.floor((at - first) / 86_400_000) + 1 : null;
    return {
      ...entry,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      country: point?.country ?? null,
      dayNumber: dayNumber && dayNumber > 0 ? dayNumber : null,
      dayCount,
    };
  });
}
