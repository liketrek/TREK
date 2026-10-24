import type { BookPageSetup } from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import type { AutoTemplate } from './auto-templates.data';

/**
 * What the auto layout turns into a book: a journey as plain data.
 *
 * Moved here from the Studio (client/src/components/Studio/autoLayout.ts) so
 * the Studio's Auto layout button and the server's design tool lay a book out
 * with one implementation. Labels and the locale come in already chosen: this
 * code builds a document and has no business reaching for a translation table.
 */

export interface AutoPhoto {
  photoId: number;
  width: number | null;
  height: number | null;
  caption?: string | null;
}

export interface AutoEntry {
  id: number;
  title: string | null;
  story: string | null;
  location: string | null;
  date: string | null;
  photos: AutoPhoto[];
  /**
   * Where this stop is, when the journey's figures know.
   *
   * Filled from the stats points rather than carried on the entry: the entry
   * knows a place name, the stats know what that place resolved to. A page can
   * then print the flag, the country outline and the coordinates.
   */
  lat?: number | null;
  lng?: number | null;
  country?: string | null;
  /** Which day of the journey this is, 1-based. Null when the dates do not say. */
  dayNumber?: number | null;
  /** How many days the journey runs, for the progress rule along the foot. */
  dayCount?: number | null;
  /** The journal's mood and weather keys (`amazing`, `partly`), for the marks the book engine places. */
  mood?: string | null;
  weather?: string | null;
  /** The entry's pros and cons, for a list element. */
  pros?: readonly string[];
  cons?: readonly string[];
}

export interface AutoInput {
  /**
   * The app's language, not the browser's. A book whose captions are dated in
   * the reader's OS locale while the rest of it is written in the app's is a
   * mismatch nobody asked for.
   */
  locale: string;
  title: string;
  subtitle: string | null;
  coverPhotoId: number | null;
  entries: AutoEntry[];
  page: BookPageSetup;
  /**
   * What the journey adds up to. Null when the figures could not be fetched:
   * the book then simply has no summary pages rather than pages with nothing
   * on them.
   */
  stats: JourneyStats | null;
  /** The heading over a list of bare stops, already translated. */
  stationsLabel: string;
  /**
   * The words of a day chip, already translated: `{day}` stands where the
   * number goes ("DAY {day}", "{day}日目"), and a word without it is followed
   * by the number ("DAY 5"). See `bookDayText`.
   */
  dayLabel: string;
  /**
   * The real geometry of the route, when the journey has any (GPX and KML
   * imports), already thinned with `bookPath`.
   */
  path?: [number, number][][];
  /** "TRIP SUMMARY" over the figures. */
  summaryLabel: string;
  /** "COUNTRIES" over the outlines. */
  countriesLabel: string;
  /** Mints element and spread ids; the default is `bookElementId`, tests pass a counter. */
  newId?: (prefix: string) => string;
  /**
   * The drawn templates an entry is tried against first. The default is the
   * shipped set (`AUTO_TEMPLATES`); an empty list lays every entry out with the
   * layouts written as code, which is what their tests pin.
   */
  templates?: readonly AutoTemplate[];
}
