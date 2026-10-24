import type {
  AssistantApplied,
  CollectionCardLabel,
  CollectionCardPlace,
  CollectionListRow,
  CollectionListsCard,
  CollectionPlacesCard,
  TrekCard,
} from '@trek/shared';

import type { EntityTarget } from '../cardTypes';

/**
 * The pure side of the collections' cards: where a list and a saved place
 * open, the saved place a card is about, how cards of several reads lay out
 * as one, and how many rows a card shows. No components here, so the look
 * (and the main chunk with it) reads it without pulling in a card.
 */

/** Rows a places card shows in a narrow chat and in a roomy one; the server sends at most the second. */
const ROWS_COMPACT = 5;
const ROWS_ROOMY = 8;

/** Pills a change row shows before it counts the rest. */
export const MAX_FACTS = 4;

/** Where a list opens in Collections. */
export function listTarget(listId: number | null): EntityTarget {
  return { kind: 'page', path: listId === null ? '/collections' : `/collections/${listId}` };
}

/** Where a saved place opens: its list, with the place selected. */
function placeTarget(listId: number, placeId: number | null): EntityTarget {
  const path = `/collections/${listId}`;
  return { kind: 'page', path: placeId === null ? path : `${path}?place=${placeId}` };
}

function placesCardOf(card: TrekCard | null): CollectionPlacesCard | null {
  return card?.kind === 'collectionPlaces' ? card : null;
}

/** The saved place a change card is about: its only one. */
function firstPlace(card: TrekCard | null): CollectionCardPlace | null {
  const places = placesCardOf(card)?.places ?? [];
  return places.length === 1 ? (places[0] ?? null) : null;
}

/** The list an applied change of a list opens; none for a list it deleted or an invite it declined. */
export function appliedListTarget(applied: AssistantApplied, card: TrekCard | null): EntityTarget | null {
  const row = card?.kind === 'collectionLists' ? card.lists[0] : undefined;
  if (row && (row.change === 'remove' || row.change === 'decline')) return null;
  const id = applied.ids[0] ?? row?.id ?? placesCardOf(card)?.list?.id ?? null;
  return id === null ? null : listTarget(id);
}

/** The saved place an applied change opens; its list once the change removed it. */
export function appliedPlaceTarget(applied: AssistantApplied, card: TrekCard | null): EntityTarget | null {
  const place = firstPlace(card);
  const listId = place?.listId ?? placesCardOf(card)?.list?.id ?? null;
  if (listId === null) return null;
  if (place?.delta?.removed) return listTarget(listId);
  return placeTarget(listId, applied.ids[0] ?? place?.id ?? null);
}

/** The trip place an applied change of a saved place is, for "Show on map". */
export function appliedPlaceOnMap(card: TrekCard | null): { placeId: number; dayId: null } | null {
  const placeId = firstPlace(card)?.inTripPlaceId ?? null;
  return placeId === null ? null : { placeId, dayId: null };
}

/** How many rows a places card shows at this density. */
export function rowsShown(density: 'compact' | 'roomy' | undefined): number {
  return density === 'roomy' ? ROWS_ROOMY : ROWS_COMPACT;
}

/**
 * The places cards of one answer as one: a list read twice shows once (the
 * later read wins, in the place of the first), places of several lists each
 * under their own head.
 */
export function mergePlacesCards(cards: readonly CollectionPlacesCard[]): CollectionPlacesCard[] {
  const merged: CollectionPlacesCard[] = [];
  for (const card of cards) {
    const id = card.list?.id ?? null;
    const at = id === null ? -1 : merged.findIndex((seen) => seen.list?.id === id);
    if (at >= 0) merged[at] = card;
    else merged.push(card);
  }
  return merged;
}

/** The rows of several lists cards as one: a list twice shows once, as the later card has it. */
export function mergeListRows(cards: readonly CollectionListsCard[]): { rows: CollectionListRow[]; more: number } {
  const rows: CollectionListRow[] = [];
  let more = 0;
  for (const card of cards) {
    more += card.more;
    for (const row of card.lists) {
      const at = row.id === null ? -1 : rows.findIndex((seen) => seen.id === row.id);
      if (at >= 0) rows[at] = row;
      else rows.push(row);
    }
  }
  return { rows, more };
}

/** The labels a card names, by id. */
export function labelsById(labels: readonly CollectionCardLabel[]): Map<number, CollectionCardLabel> {
  return new Map(labels.flatMap((label) => (label.id === null ? [] : [[label.id, label] as const])));
}

/** A saved place as the shared place avatar takes it: its own photo by TREK's address, else its provider ids. */
export function avatarPlace(place: CollectionCardPlace, fallbackId: number) {
  return {
    id: place.id ?? fallbackId,
    name: place.name,
    image_url: place.imageKey ? `/uploads/places/${place.imageKey}` : null,
    google_place_id: place.googlePlaceId,
    osm_id: place.osmId,
    lat: place.lat,
    lng: place.lng,
  };
}

/** The category colour and icon the avatar falls back to without a photo. */
export function avatarCategory(place: CollectionCardPlace): { color?: string; icon?: string } | null {
  const category = place.category;
  if (!category) return null;
  return { color: category.color ?? undefined, icon: category.icon ?? undefined };
}
