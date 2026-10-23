import { clipped, clockOf, finite, isLat, isLng, recordOf, type Row } from '../card-values';
import {
  compareCodeUnits,
  JOURNEY_CARD_LIMITS,
  journeyEntryTypeSchema,
  journeyEntryVisibilitySchema,
  stripMarkdown,
  type JourneyEntriesCard,
  type JourneyEntryLook,
} from '@trek/shared';

/**
 * A journal entry as a chat card shows it, read from an entry row the way
 * the journey tools answer it (`listEntries`: the row with its photos) or
 * from a held call's arguments, which use the same names. Nothing of the row
 * is trusted: a field that does not read is left out, an entry without a day
 * is no entry. Text from a result is masked like a provider answer; text from
 * arguments, what will be stored, is only cut.
 */

type Change = JourneyEntriesCard['change'];

/** Where each field of a look comes from: the stored row (masked) or the call's arguments (cut only). */
interface LookSource {
  /** The fields the arguments set; every other field is read from a stored row. */
  fromArgs?: ReadonlySet<string>;
  /** The sorted days of the whole read, for each entry's day colour. */
  days?: readonly string[];
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The day an entry row is written on, when it names one. */
function dayOf(row: Row): string | null {
  return typeof row.entry_date === 'string' && DATE.test(row.entry_date) ? row.entry_date : null;
}

function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** One line of text the user wrote into a call, cut to `max`; not masked, since that is what will be stored. */
function argLine(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = value.replace(/\s+/g, ' ').trim();
  if (line === '') return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** A field as a card line: masked when it comes from a stored row, cut only when from the arguments. */
function lineOf(row: Row, key: string, max: number, source: LookSource): string | null {
  return source.fromArgs?.has(key) ? argLine(row[key], max) : clipped(row[key], max);
}

/** The start of a story, its markdown taken off. */
function storyOf(row: Row, source: LookSource): string | null {
  const story = row.story;
  if (typeof story !== 'string') return null;
  return lineOf({ story: stripMarkdown(story) }, 'story', JOURNEY_CARD_LIMITS.story, source);
}

/**
 * The first photo with a picture to show: a clip on this server without a
 * poster has none (its thumbnail answers 404), so the next one is taken.
 */
function coverOf(photos: Row[]): { photoId: number | null; video: boolean } {
  const ordered = [...photos].sort((a, b) => (finite(a.sort_order) ?? 0) - (finite(b.sort_order) ?? 0));
  const cover = ordered.find(
    (photo) =>
      positiveId(photo.photo_id) !== null &&
      !(photo.media_type === 'video' && photo.provider === 'local' && !photo.thumbnail_path),
  );
  if (!cover) return { photoId: null, video: false };
  return { photoId: positiveId(cover.photo_id), video: cover.media_type === 'video' };
}

/** Both coordinates, or neither. */
function pointOf(row: Row): JourneyEntryLook['point'] {
  const lat = finite(row.location_lat);
  const lng = finite(row.location_lng);
  return isLat(lat) && isLng(lng) ? { lat, lng } : null;
}

/** An entry as a card shows it; null for one without a day. */
export function lookOf(value: unknown, source: LookSource = {}): JourneyEntryLook | null {
  const row = recordOf(value);
  const date = dayOf(row);
  if (!date) return null;
  const photos = Array.isArray(row.photos) ? row.photos.map(recordOf) : [];
  const type = journeyEntryTypeSchema.safeParse(row.type);
  const visibility = journeyEntryVisibilitySchema.safeParse(row.visibility);
  const country = typeof row.country_code === 'string' ? row.country_code : '';
  const mood = typeof row.mood === 'string' ? row.mood.trim().toLowerCase() : '';
  const day = source.days?.indexOf(date) ?? -1;
  return {
    entryId: positiveId(row.id),
    type: type.success ? type.data : 'entry',
    title: lineOf(row, 'title', JOURNEY_CARD_LIMITS.title, source),
    date,
    time: clockOf(row.entry_time),
    place: lineOf(row, 'location_name', JOURNEY_CARD_LIMITS.place, source),
    point: pointOf(row),
    countryCode: /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null,
    story: storyOf(row, source),
    mood: /^[a-z]{1,20}$/.test(mood) ? mood : null,
    weather: lineOf(row, 'weather', JOURNEY_CARD_LIMITS.weather, source),
    ...coverOf(photos),
    photoCount: Math.min(photos.length, 1_000_000),
    visibility: visibility.success ? visibility.data : 'private',
    draft: row.is_draft === true || row.is_draft === 1,
    fromTripPlace: positiveId(row.source_place_id) !== null && row.type !== 'skeleton',
    dayIndex: day >= 0 && day <= 9_999 ? day : null,
  };
}

/** What a card about a journal says beside its entries. */
interface JournalOf {
  journeyId: number | null;
  title: unknown;
  tripJournal: boolean;
  change: Change;
}

/** The card itself, or null when it holds no entry or names no journal. */
export function entriesCard(journal: JournalOf, entries: JourneyEntryLook[], more: number): JourneyEntriesCard | null {
  if (journal.journeyId === null || entries.length === 0) return null;
  return {
    kind: 'journeyEntries',
    journeyId: journal.journeyId,
    journalTitle: clipped(journal.title, JOURNEY_CARD_LIMITS.journal),
    tripJournal: journal.tripJournal,
    change: journal.change,
    entries,
    more,
  };
}

/** The journal's reading order: by day, then as the traveller ordered the day. */
function readingOrder(a: { row: Row; look: JourneyEntryLook }, b: { row: Row; look: JourneyEntryLook }): number {
  const day = compareCodeUnits(a.look.date, b.look.date);
  if (day !== 0) return day;
  const order = (finite(a.row.sort_order) ?? 0) - (finite(b.row.sort_order) ?? 0);
  return order !== 0 ? order : (finite(a.row.id) ?? 0) - (finite(b.row.id) ?? 0);
}

/**
 * The entries of a read as one card: the written ones in reading order (only
 * the suggestions when nothing is written yet), the latest eight of them, the
 * rest counted. Dismissed suggestions never show; each entry knows its day's
 * place in the whole read for its colour, unless `withDays` is off (one entry
 * read alone says nothing about the journal's days).
 */
export function readCard(
  journeyId: number | null,
  title: unknown,
  rows: unknown,
  withDays = true,
): JourneyEntriesCard | null {
  const all = (Array.isArray(rows) ? rows.map(recordOf) : []).filter(
    (row) => row.dismissed !== true && row.dismissed !== 1,
  );
  const written = all.filter((row) => row.type !== 'skeleton');
  const shown = written.length > 0 ? written : all;
  const days = withDays
    ? [...new Set(shown.map(dayOf).filter((day): day is string => day !== null))].sort(compareCodeUnits)
    : [];
  const looks = shown
    .map((row) => ({ row, look: lookOf(row, { days }) }))
    .filter((pair): pair is { row: Row; look: JourneyEntryLook } => pair.look !== null)
    .sort(readingOrder)
    .map((pair) => pair.look);
  const kept = looks.slice(-JOURNEY_CARD_LIMITS.entries);
  return entriesCard({ journeyId, title, tripJournal: false, change: 'none' }, kept, looks.length - kept.length);
}
