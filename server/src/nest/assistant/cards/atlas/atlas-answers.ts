import type { AnswerInput } from '../card-types';
import { clipped, finite, recordOf, type Row } from '../card-values';
import { countOf, countryCodeOf, entryOf, isoDayOf, statusOf } from './atlas-values';
import {
  ATLAS_CARD_CONTINENTS,
  type AtlasBucketCard,
  type AtlasBucketEntry,
  type AtlasCardContinent,
  type AtlasCountryCard,
  type AtlasPassportCard,
  type VisitStatus,
} from '@trek/shared';

/**
 * The answer cards of the atlas reads: the passport of `get_atlas_stats`, one
 * country of `get_country_atlas_places`, the wishes of `list_bucket_list`.
 * Built from the raw answer: every code checked, every list cut to its bound
 * with the rest counted, every text masked. Never a coordinate.
 */

const MAX_FLAGS = 40;
const MAX_TRIPS = 4;
const MAX_PLACES = 8;
const MAX_WISHES = 12;

function rowsOf(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

/** Later dates first; rows without one last. */
function byDateDesc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? 1 : -1;
}

/** Earlier dates first; rows without one last. */
function byDateAsc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

/** The flags in the Atlas page's order: visited ones latest first, then planned ones soonest first. */
function flagsOf(countries: Row[]) {
  const listed = countries.flatMap((row) => {
    const code = countryCodeOf(row.code);
    // A user without trips has only countries marked by hand, which are visited.
    const status: VisitStatus = statusOf(row.status) ?? 'visited';
    return code && status !== 'idea'
      ? [{ code, status, first: isoDayOf(row.firstVisit), last: isoDayOf(row.lastVisit) }]
      : [];
  });
  const visited = listed.filter((f) => f.status === 'visited').sort((a, b) => byDateDesc(a.last, b.last));
  const planned = listed.filter((f) => f.status === 'planned').sort((a, b) => byDateAsc(a.first, b.first));
  return [...visited, ...planned].map(({ code, status }) => ({ code, status }));
}

function isContinent(name: string): name is AtlasCardContinent {
  return (ATLAS_CARD_CONTINENTS as readonly string[]).includes(name);
}

function continentsOf(visited: Row, planned: Row): AtlasPassportCard['continents'] {
  const names = [...new Set([...Object.keys(visited), ...Object.keys(planned)])].filter(isContinent);
  return names
    .map((name) => ({ name, visited: countOf(visited[name]), planned: countOf(planned[name]) }))
    .sort((a, b) => b.visited - a.visited || b.planned - a.planned)
    .slice(0, ATLAS_CARD_CONTINENTS.length);
}

function nextTripOf(value: unknown): AtlasPassportCard['nextTrip'] {
  const trip = recordOf(value);
  const title = clipped(trip.title, 80);
  if (!title) return null;
  const days = finite(trip.daysUntil);
  const daysUntil = days !== null && Number.isInteger(days) && days >= 0 && days <= 36_500 ? days : null;
  return { title, startDate: isoDayOf(trip.start_date), daysUntil };
}

/** `{ stats, travel }` of get_atlas_stats as the passport; null when it holds no atlas. */
export function passportOf(raw: unknown): AtlasPassportCard | null {
  const stats = recordOf(recordOf(raw).stats);
  if (!Array.isArray(stats.countries)) return null;
  const travel = recordOf(recordOf(raw).travel);
  const totals = recordOf(stats.stats);
  const flags = flagsOf(rowsOf(stats.countries));
  const flown = finite(travel.totalDistanceKm);
  const streak = finite(stats.streak);
  return {
    kind: 'atlasPassport',
    countries: {
      visited: countOf(totals.totalCountries),
      planned: countOf(totals.totalCountriesPlanned),
      idea: countOf(totals.totalCountriesIdea),
    },
    totals: {
      trips: countOf(totals.totalTrips),
      days: countOf(totals.totalDays),
      places: countOf(totals.totalPlaces),
      // The Atlas page's own figure, the page "Open Atlas" leads to; the passport's list without it.
      cities: totals.totalCities === undefined ? rowsOf(travel.cities).length : countOf(totals.totalCities),
      flownKm: flown !== null && flown >= 1 ? countOf(flown) : null,
    },
    flags: flags.slice(0, MAX_FLAGS),
    moreFlags: Math.max(0, flags.length - MAX_FLAGS),
    continents: continentsOf(recordOf(stats.continents), recordOf(stats.continentsPlanned)),
    nextTrip: nextTripOf(stats.nextTrip),
    streakYears: streak !== null && Number.isInteger(streak) && streak >= 0 && streak <= 200 ? streak : null,
  };
}

/** One country of get_country_atlas_places: its trips latest first, its places in the order of those trips. */
export function countryOf(args: Row, raw: unknown): AtlasCountryCard | null {
  const code = countryCodeOf(args.countryCode);
  if (!code) return null;
  const r = recordOf(raw);
  const places = rowsOf(r.places);
  const tripRows = rowsOf(r.trips).sort((a, b) => byDateDesc(isoDayOf(a.start_date), isoDayOf(b.start_date)));
  const trips = tripRows.flatMap((trip) => {
    const id = finite(trip.id);
    const title = clipped(trip.title, 80);
    return id !== null && Number.isInteger(id) && id > 0 && title
      ? [{ id, title, startDate: isoDayOf(trip.start_date), endDate: isoDayOf(trip.end_date) }]
      : [];
  });
  const order = new Map(tripRows.map((trip, index): [unknown, number] => [trip.id, index]));
  const names = [
    ...new Set(
      places
        .map((place, index) => ({ place, index, trip: order.get(place.trip_id) ?? tripRows.length }))
        .sort((a, b) => a.trip - b.trip || a.index - b.index)
        .map(({ place }) => clipped(place.name, 80))
        .filter((name): name is string => name !== null),
    ),
  ];
  const marked = r.manually_marked === true;
  const source = r.marked_source;
  // A country with no trip, no place and no mark of its own is not on the map, whatever the read calls it.
  const onMap = marked || places.length > 0 || trips.length > 0;
  return {
    kind: 'atlasCountry',
    code,
    status: onMap ? statusOf(r.status) : null,
    markedBy: source === 'manual' || source === 'dawarich' || source === 'region' ? source : null,
    placeCount: places.length,
    tripCount: trips.length,
    trips: trips.slice(0, MAX_TRIPS),
    moreTrips: Math.max(0, trips.length - MAX_TRIPS),
    places: names.slice(0, MAX_PLACES),
    morePlaces: Math.max(0, names.length - MAX_PLACES),
    change: null,
  };
}

/** The open wishes first, soonest first and undated last, then the ones that came true, latest first. */
function wishOrder(a: AtlasBucketEntry, b: AtlasBucketEntry): number {
  if (!a.reachedOn !== !b.reachedOn) return a.reachedOn ? 1 : -1;
  return a.reachedOn ? byDateDesc(a.reachedOn, b.reachedOn) : byDateAsc(a.targetDate, b.targetDate);
}

/** The wishes of list_bucket_list; null for an empty list. */
export function bucketListOf(raw: unknown): AtlasBucketCard | null {
  const entries = rowsOf(recordOf(raw).items)
    .map((row) => entryOf(row, { fromResult: true }))
    .filter((entry): entry is AtlasBucketEntry => entry !== null)
    .sort(wishOrder);
  const [first, ...rest] = entries;
  if (!first) return null;
  return {
    kind: 'atlasBucket',
    items: [first, ...rest.slice(0, MAX_WISHES - 1)],
    more: Math.max(0, entries.length - MAX_WISHES),
    change: null,
  };
}

/** The answer builders by tool, for the registry. */
export const ATLAS_ANSWERS = {
  get_atlas_stats: (input: AnswerInput) => passportOf(input.value),
  get_country_atlas_places: (input: AnswerInput) => countryOf(input.args, input.value),
  list_bucket_list: (input: AnswerInput) => bucketListOf(input.value),
};
