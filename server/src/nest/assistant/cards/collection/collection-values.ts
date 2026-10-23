import type { TripCard } from '../../assistant-context';
import { clipped, fileKeyOf, finite, hexOrNull, isLat, isLng, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import {
  cardPhotoKeySchema,
  COLLECTION_STATUSES,
  type CollectionCardLabel,
  type CollectionCardList,
  type CollectionCardPlace,
  type CollectionListRow,
  type CollectionStatus,
} from '@trek/shared';

/**
 * How the collections' answers read as card pieces: a list, a label, a saved
 * place. Every text is masked and cut (`clipped`), every colour checked, a
 * photo only TREK's own upload, and notes, descriptions, phone numbers, links
 * and the members' addresses are never read. A saved place is matched to the
 * chat's trip by its provider id, or by the trip place it was saved from.
 */

/** The rows a card shows at most, and the labels it names. */
export const MAX_PLACES = 8;
export const MAX_LISTS = 12;
const MAX_LABELS = 24;

/**
 * A list's or label's colour as a card carries it: the short `#abc` the
 * forms accept spelled out to `#aabbcc`, anything else checked as usual.
 */
export function colorOf(value: unknown): string | null {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{3}$/.test(value)) {
    return value.replace(/[0-9a-fA-F]/g, (digit) => digit + digit);
  }
  return hexOrNull(value);
}

export function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** The positive ids in a list argument, in order and each once; at most `max`. */
export function idsIn(value: unknown, max: number): number[] {
  if (!Array.isArray(value)) return [];
  const ids = value.map(positiveId).filter((id): id is number => id !== null);
  return [...new Set(ids)].slice(0, max);
}

function countOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1_000_000 ? value : null;
}

export function statusOf(value: unknown): CollectionStatus {
  return COLLECTION_STATUSES.find((status) => status === value) ?? 'idea';
}

/** A status a change asks for; null when the argument names none. */
export function statusArg(value: unknown): CollectionStatus | null {
  return COLLECTION_STATUSES.find((status) => status === value) ?? null;
}

/** The places of a whole list by status. */
export function tally(places: readonly Row[]): NonNullable<CollectionCardList['counts']> {
  const counts = { idea: 0, want: 0, visited: 0 };
  for (const place of places) counts[statusOf(place.status)] += 1;
  return counts;
}

/** The members who share a list besides its owner: accepted ones only. */
function sharedWith(members: unknown): number {
  return rowsOf(members).filter((member) => member.status === 'accepted' && member.is_owner !== true).length;
}

/** A list from a collection row of `get_collection`, `list_collections` or `get_collection_items`. */
export function listOf(raw: unknown, counts: CollectionCardList['counts'] = null): CollectionCardList | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const name = clipped(row.name, 120);
  if (id === null || !name) return null;
  return {
    id,
    name,
    color: colorOf(row.color),
    placeCount: countOf(row.place_count),
    memberCount: sharedWith(row.members),
    counts,
  };
}

/** A list row of the lists card: a list as it is, unless the caller says what changes. */
export function listRowOf(list: CollectionCardList, extra: Partial<CollectionListRow> = {}): CollectionListRow {
  return { ...list, status: null, person: null, invite: false, change: 'none', before: null, ...extra };
}

/** A label of a list; `places` counts the places of the whole list that carry it, where the list was read. */
export function labelOf(
  raw: unknown,
  places: readonly Row[] | null,
  extra: Partial<CollectionCardLabel> = {},
): CollectionCardLabel | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const name = clipped(row.name, 60);
  if (!name) return null;
  const carriers = places && id !== null ? places.filter((place) => idsIn(place.label_ids, 50).includes(id)) : null;
  return {
    id,
    name,
    color: colorOf(row.color),
    places: carriers ? carriers.length : null,
    change: 'none',
    before: null,
    ...extra,
  };
}

/** The labels of `pool` the shown places carry, counted over `whole` where the whole list was read. */
export function usedLabels(
  pool: unknown,
  shown: readonly CollectionCardPlace[],
  whole: readonly Row[] | null,
): CollectionCardLabel[] {
  const used = new Set(shown.flatMap((place) => place.labelIds));
  return rowsOf(pool)
    .filter((label) => used.has(positiveId(label.id) ?? 0))
    .map((label) => labelOf(label, whole))
    .filter((label): label is CollectionCardLabel => label !== null)
    .slice(0, MAX_LABELS);
}

/** The file name of a place photo TREK keeps itself; a photo on another host gives none. */
function placeImageKey(value: unknown): string | null {
  return typeof value === 'string' && value.startsWith('/uploads/places/') ? fileKeyOf(value) : null;
}

/**
 * A text from a call's arguments as a card shows it: on one line and cut to
 * `max`, not masked, since it is what the change will store.
 */
export function argText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = value.replace(/\s+/g, ' ').trim();
  if (line === '') return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

export function googleIdOf(value: unknown): string | null {
  return typeof value === 'string' && cardPhotoKeySchema.safeParse(value).success ? value : null;
}

/** An average of the members' votes, to a tenth; null without votes. */
function ratingOf(value: unknown): number | null {
  const rating = finite(value);
  return rating !== null && rating >= 1 && rating <= 5 ? Math.round(rating * 10) / 10 : null;
}

function categoryOf(raw: unknown): CollectionCardPlace['category'] {
  const row = recordOf(raw);
  const name = clipped(row.name, 60);
  if (!name) return null;
  const icon = typeof row.icon === 'string' && /^[A-Za-z0-9]{1,40}$/.test(row.icon) ? row.icon : null;
  return { name, icon, color: colorOf(row.color) };
}

/** The trip place that is this saved place: the same Google or OpenStreetMap id, else the one it was saved from. */
export function inTripOf(
  card: TripCard | null,
  ids: { googlePlaceId: string | null; osmId: string | null; sourceTripId?: unknown; sourcePlaceId?: unknown },
): number | null {
  if (!card) return null;
  for (const place of card.places.values()) {
    if (ids.googlePlaceId !== null && place.googlePlaceId === ids.googlePlaceId) return place.id;
    if (ids.osmId !== null && place.osmId === ids.osmId) return place.id;
  }
  const source = positiveId(ids.sourcePlaceId);
  return ids.sourceTripId === card.tripId && source !== null && card.places.has(source) ? source : null;
}

/** A saved place from a row of the collections' answers; `card` is the chat's trip, null where none is at hand. */
export function savedPlaceOf(raw: unknown, card: TripCard | null): CollectionCardPlace | null {
  const row = recordOf(raw);
  const name = clipped(row.name, 120);
  if (!name) return null;
  const lat = finite(row.lat);
  const lng = finite(row.lng);
  const googlePlaceId = googleIdOf(row.google_place_id);
  const osmId = clipped(row.osm_id, 40);
  const coords = isLat(lat) && isLng(lng);
  return {
    id: positiveId(row.id),
    listId: positiveId(row.collection_id),
    name,
    address: clipped(row.address, 200),
    lat: coords ? lat : null,
    lng: coords ? lng : null,
    category: categoryOf(row.category),
    status: statusOf(row.status),
    labelIds: idsIn(row.label_ids, 10),
    rating: ratingOf(row.rating_avg),
    ratingCount: countOf(row.rating_count) ?? 0,
    googlePlaceId,
    osmId,
    imageKey: placeImageKey(row.image_url),
    inTripPlaceId: inTripOf(card, {
      googlePlaceId,
      osmId,
      sourceTripId: row.source_trip_id,
      sourcePlaceId: row.source_place_id,
    }),
    savedIn: [],
    delta: null,
  };
}

/** The saved places of rows that read as one, each once. */
export function savedPlacesOf(rows: readonly Row[], card: TripCard | null): CollectionCardPlace[] {
  return rows.map((row) => savedPlaceOf(row, card)).filter((place): place is CollectionCardPlace => place !== null);
}
