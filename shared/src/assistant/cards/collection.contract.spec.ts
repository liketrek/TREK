import { assistantAppliedSchema } from '../assistant.schema';
import { MAX_CARD_CHARS } from './card-parts';
import { collectionListsCardSchema } from './collection-lists.card';
import { collectionPlacesCardSchema } from './collection-places.card';
import { COLLECTION_APPLIED_ENTITIES } from './collection.contract';
import { storedTrekCardSchema, trekCardSchema } from './index';

import { describe, expect, it } from 'vitest';

const list = { id: 12, name: 'Paris food', color: '#e11d48', placeCount: 12, memberCount: 2, counts: null };

const place = {
  id: 34,
  listId: 12,
  name: 'Septime',
  address: '80 Rue de Charonne',
  lat: 48.853,
  lng: 2.381,
  category: { name: 'Restaurant', icon: 'Utensils', color: '#f97316' },
  status: 'want',
  labelIds: [5],
  rating: 4.5,
  ratingCount: 2,
  googlePlaceId: 'ChIJseptime',
  osmId: null,
  imageKey: 'septime.jpg',
  inTripPlaceId: null,
  savedIn: [],
  delta: null,
};

const placesCard = {
  kind: 'collectionPlaces',
  list,
  places: [place],
  more: 0,
  labels: [{ id: 5, name: 'Dinner', color: '#2563eb', places: 3, change: 'none', before: null }],
  outcome: null,
  everyList: false,
  otherTrip: false,
};

const row = {
  ...list,
  status: null,
  person: null,
  invite: false,
  change: 'none',
  before: null,
};

describe('collection cards', () => {
  it('CARDS-COLL-001: a list with its saved places and labels reads as itself through the union', () => {
    expect(trekCardSchema.parse(placesCard)).toEqual(placesCard);
    expect(storedTrekCardSchema.parse(placesCard)).toEqual(placesCard);
    expect(JSON.stringify(placesCard).length).toBeLessThan(MAX_CARD_CHARS);
  });

  it('CARDS-COLL-002: a place a change has not saved yet and the list a change creates carry no id', () => {
    const pending = {
      ...placesCard,
      list: { ...list, id: null, placeCount: 0, memberCount: 0 },
      places: [{ ...place, id: null, listId: null, imageKey: null, delta: deltaOf({ removed: false }) }],
    };
    expect(collectionPlacesCardSchema.safeParse(pending).success).toBe(true);
  });

  it('CARDS-COLL-003: a photo is a stored file name, never an address or a path', () => {
    const refused = ['https://example.com/a.jpg', '/uploads/places/a.jpg', '../a.jpg', 'data:image/png;base64,x'];
    for (const imageKey of refused) {
      const card = { ...placesCard, places: [{ ...place, imageKey }] };
      expect(collectionPlacesCardSchema.safeParse(card).success, imageKey).toBe(false);
    }
  });

  it('CARDS-COLL-004: rows, labels and names stay inside their bounds; a card past them reads as null', () => {
    const nine = Array.from({ length: 9 }, (_, i) => ({ ...place, id: i + 1 }));
    expect(collectionPlacesCardSchema.safeParse({ ...placesCard, places: nine }).success).toBe(false);
    expect(collectionPlacesCardSchema.safeParse({ ...placesCard, list: { ...list, name: '' } }).success).toBe(false);
    const tooHigh = { ...placesCard, places: [{ ...place, rating: 6 }] };
    expect(collectionPlacesCardSchema.safeParse(tooHigh).success).toBe(false);
    expect(storedTrekCardSchema.parse({ ...placesCard, places: nine })).toBeNull();
  });

  it('CARDS-COLL-005: a change names the status it leaves, the vote it casts and the fields it touches', () => {
    const delta = deltaOf({ status: { from: 'idea', to: 'visited' }, rating: { to: null }, fields: ['photo'] });
    const card = { ...placesCard, places: [{ ...place, delta }] };
    expect(collectionPlacesCardSchema.parse(card).places[0]?.delta).toEqual(delta);
    const unknownField = { ...placesCard, places: [{ ...place, delta: deltaOf({ fields: ['phone'] }) }] };
    expect(collectionPlacesCardSchema.safeParse(unknownField).success).toBe(false);
  });

  it('CARDS-COLL-006: an applied copy, a duplicate and a status set across lists each say what happened', () => {
    for (const outcome of [
      { type: 'duplicate', name: 'Septime' },
      { type: 'copied', copied: 2, skipped: 1, skippedNames: ['Le Comptoir'] },
      { type: 'statusSet', updated: 3, found: 2 },
    ]) {
      expect(collectionPlacesCardSchema.safeParse({ ...placesCard, outcome }).success, outcome.type).toBe(true);
    }
  });

  it('CARDS-COLL-007: the lists card holds lists, invites and a lookup of where a place is saved', () => {
    const card = {
      kind: 'collectionLists',
      lists: [
        { ...row, status: 'visited' },
        { ...row, id: 13, invite: true, person: { id: 4, name: 'Maya', avatarKey: null }, placeCount: null },
      ],
      more: 0,
      place: 'Septime',
    };
    expect(trekCardSchema.parse(card)).toEqual(card);
    const thirteen = Array.from({ length: 13 }, (_, i) => ({ ...row, id: i + 1 }));
    expect(collectionListsCardSchema.safeParse({ ...card, lists: thirteen }).success).toBe(false);
    expect(collectionListsCardSchema.safeParse({ ...card, lists: [{ ...row, change: 'rename' }] }).success).toBe(false);
  });

  it('CARDS-COLL-008: an applied change names a list or a saved place as what it touched', () => {
    for (const entity of COLLECTION_APPLIED_ENTITIES) {
      const applied = { toolCallId: 'c1', entity, ids: [12], dayId: null, undoUntil: null };
      expect(assistantAppliedSchema.parse(applied).entity).toBe(entity);
    }
  });
});

function deltaOf(over: Record<string, unknown>) {
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
