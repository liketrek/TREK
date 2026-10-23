import type { TripCard } from '../../assistant-context';
import type { PreviewContext, ToolArgs } from '../card-types';
import { finite, isLat, isLng, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import type { CollectionLookup } from './collection-load';
import {
  argText,
  googleIdOf,
  idsIn,
  inTripOf,
  listOf,
  MAX_PLACES,
  positiveId,
  savedPlaceOf,
  statusOf,
  tally,
  usedLabels,
} from './collection-values';
import type {
  CollectionCardDelta,
  CollectionCardList,
  CollectionCardPlace,
  CollectionPlacesCard,
  CollectionStatus,
} from '@trek/shared';

/**
 * The pieces the change cards of the collections are put together from: the
 * list a lookup read, the saved places it found, a place to save as its
 * arguments describe it, a trip place as a saved place would be, and the card
 * that holds them.
 */

/** A list read whole by `get_collection`: its head, its places and its label definitions. */
export interface WholeList {
  list: CollectionCardList | null;
  places: Row[];
  labels: unknown;
  members: Row[];
}

export function wholeList(value: unknown): WholeList {
  const root = recordOf(value);
  const collection = recordOf(root.collection);
  const places = rowsOf(root.places);
  const members = rowsOf(collection.members);
  return { list: listOf(collection, tally(places)), places, labels: collection.labels, members };
}

/** What `get_collection_items` found: the saved places and the lists they sit in. */
export function itemsOf(lookup: CollectionLookup): { places: Row[]; lists: Row[]; labels: Row[] } {
  const root = recordOf(lookup.items);
  return { places: rowsOf(root.places), lists: rowsOf(root.lists), labels: rowsOf(root.labels) };
}

/** The list one of the found places sits in, as a card names it (not read whole: no counts). */
export function itemListOf(lists: readonly Row[], listId: number | null): CollectionCardList | null {
  const row = listId === null ? undefined : lists.find((list) => positiveId(list.id) === listId);
  return row ? listOf(row) : null;
}

/** The ids of a list's label definitions. */
export function labelIdSet(labels: unknown): Set<number> {
  return new Set(rowsOf(labels).map((label) => positiveId(label.id) ?? 0));
}

/** The label ids a list defines, from the lists `get_collection_items` gave. */
export function listLabelIds(lists: readonly Row[], listId: number | null): Set<number> {
  return labelIdSet(lists.find((list) => positiveId(list.id) === listId)?.labels);
}

/**
 * Every label a found place carries (a list holds up to 50), not only the
 * ones its card names: what a change adds or takes away is worked out on these.
 */
export function carriedLabelIds(lookup: CollectionLookup, placeId: number | null): number[] {
  const row = itemsOf(lookup).places.find((place) => positiveId(place.id) === placeId);
  return idsIn(row?.label_ids, 50);
}

/** The one list every place sits in; null when they sit in several. */
export function commonListId(places: readonly CollectionCardPlace[]): number | null {
  const ids = new Set(places.map((place) => place.listId));
  const [only] = [...ids];
  return ids.size === 1 && only !== undefined ? only : null;
}

export function emptyDelta(over: Partial<CollectionCardDelta> = {}): CollectionCardDelta {
  return {
    status: null,
    rating: null,
    labelsAdded: [],
    labelsRemoved: [],
    fields: [],
    movedTo: null,
    removed: false,
    ...over,
  };
}

/** A places card; `total` counts the places the change names beyond the ones shown. */
export function placesCard(
  list: CollectionCardList | null,
  places: readonly CollectionCardPlace[],
  labelPool: unknown,
  extra: Partial<CollectionPlacesCard> & { total?: number } = {},
): CollectionPlacesCard {
  const { total, ...rest } = extra;
  const shown = places.slice(0, MAX_PLACES);
  // The labels a change adds or takes away are named too.
  const named = shown.map((place) => ({
    ...place,
    labelIds: [...place.labelIds, ...(place.delta?.labelsAdded ?? []), ...(place.delta?.labelsRemoved ?? [])],
  }));
  return {
    kind: 'collectionPlaces',
    list,
    places: shown,
    more: Math.max(0, (total ?? places.length) - shown.length),
    labels: usedLabels(labelPool, named, null),
    outcome: null,
    everyList: false,
    otherTrip: false,
    ...rest,
  };
}

/** A category by its id, as the turn's category list names it. */
function categoryArg(ctx: PreviewContext, value: unknown): CollectionCardPlace['category'] {
  const id = positiveId(value);
  const name = id === null ? null : argText(ctx.categories.get(id), 60);
  return name ? { name, icon: null, color: null } : null;
}

/** A place to save as the call describes it: not saved yet, so without an id. */
export function placeFromArgs(ctx: PreviewContext, args: ToolArgs, listId: number | null): CollectionCardPlace | null {
  const name = argText(args.name, 120);
  if (!name) return null;
  const lat = finite(args.lat);
  const lng = finite(args.lng);
  const coords = isLat(lat) && isLng(lng);
  const googlePlaceId = googleIdOf(args.google_place_id);
  const osmId = argText(args.osm_id, 40);
  return {
    id: null,
    listId,
    name,
    address: argText(args.address, 200),
    lat: coords ? lat : null,
    lng: coords ? lng : null,
    category: categoryArg(ctx, args.category_id),
    status: statusOf(args.status),
    labelIds: [],
    rating: null,
    ratingCount: 0,
    googlePlaceId,
    osmId,
    imageKey: null,
    inTripPlaceId: inTripOf(ctx.card, {
      googlePlaceId,
      osmId,
      sourceTripId: args.source_trip_id,
      sourcePlaceId: args.source_place_id,
    }),
    savedIn: [],
    delta: null,
  };
}

const tripImages = new WeakMap<TripCard, Map<number, unknown>>();

/** The photos of the trip's places, read once per trip card from the places the turn read. */
function tripImageOf(card: TripCard, placeId: number): unknown {
  let images = tripImages.get(card);
  if (!images) {
    const rows = rowsOf(recordOf(card.sources.places).places);
    images = new Map(rows.map((row) => [positiveId(row.id) ?? 0, row.image_url]));
    tripImages.set(card, images);
  }
  return images.get(placeId) ?? null;
}

/** A trip place as it would be saved in a list: the trip's own place, so it is "already in the trip". */
export function placeFromTrip(
  ctx: PreviewContext,
  placeId: number,
  listId: number | null,
  status: CollectionStatus,
): CollectionCardPlace | null {
  const place = ctx.card.places.get(placeId);
  if (!place) return null;
  const saved = savedPlaceOf(
    {
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      google_place_id: place.googlePlaceId,
      osm_id: place.osmId,
      image_url: tripImageOf(ctx.card, placeId),
      status,
      collection_id: listId,
    },
    null,
  );
  return saved ? { ...saved, category: categoryArg(ctx, place.categoryId), inTripPlaceId: placeId } : null;
}

/** The trip places a call names, in its order: those the trip card holds. */
export function tripPlaceIds(ctx: PreviewContext, value: unknown): number[] {
  return idsIn(value, 1000).filter((id) => ctx.card.places.has(id));
}

/** The saved places a lookup found, in the order the call names them. */
export function foundPlaces(
  ctx: PreviewContext,
  lookup: CollectionLookup,
  ids: readonly number[],
): CollectionCardPlace[] {
  const rows = itemsOf(lookup).places;
  return ids
    .map((id) => rows.find((row) => positiveId(row.id) === id))
    .map((row) => (row ? savedPlaceOf(row, ctx.card) : null))
    .filter((place): place is CollectionCardPlace => place !== null);
}

/** "Septime, Le Comptoir": the names a change works on, for its subject. */
export function namesOf(places: readonly { name: string }[]): string {
  return places.map((place) => place.name).join(', ');
}
