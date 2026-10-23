import type { CollectionCardPlace, CollectionListRow, CollectionListsCard, CollectionPlacesCard } from '@trek/shared';

/** Cards of the collections as the server sends them, for the card tests. */

export const LIST = { id: 12, name: 'Paris food', color: '#e11d48', placeCount: 12, memberCount: 1, counts: null };

export function savedPlace(over: Partial<CollectionCardPlace> = {}): CollectionCardPlace {
  return {
    id: 34,
    listId: 12,
    name: 'Septime',
    address: '80 Rue de Charonne',
    lat: 48.853,
    lng: 2.381,
    category: { name: 'Restaurant', icon: 'Utensils', color: '#f97316' },
    status: 'want',
    labelIds: [51, 52, 53],
    rating: 4.5,
    ratingCount: 3,
    googlePlaceId: null,
    osmId: null,
    imageKey: null,
    inTripPlaceId: null,
    savedIn: [],
    delta: null,
    ...over,
  };
}

export function placesCard(over: Partial<CollectionPlacesCard> = {}): CollectionPlacesCard {
  return {
    kind: 'collectionPlaces',
    list: { ...LIST, counts: { idea: 3, want: 5, visited: 4 } },
    places: [savedPlace()],
    more: 0,
    labels: [
      { id: 51, name: 'Dinner', color: '#2563eb', places: 3, change: 'none', before: null },
      { id: 52, name: 'Late', color: null, places: 1, change: 'none', before: null },
      { id: 53, name: 'Terrace', color: '#16a34a', places: 2, change: 'none', before: null },
    ],
    outcome: null,
    everyList: false,
    otherTrip: false,
    ...over,
  };
}

export function listRow(over: Partial<CollectionListRow> = {}): CollectionListRow {
  return { ...LIST, status: null, person: null, invite: false, change: 'none', before: null, ...over };
}

export function listsCard(over: Partial<CollectionListsCard> = {}): CollectionListsCard {
  return { kind: 'collectionLists', lists: [listRow()], more: 0, place: null, ...over };
}

export function emptyDelta(over: Partial<NonNullable<CollectionCardPlace['delta']>> = {}) {
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
