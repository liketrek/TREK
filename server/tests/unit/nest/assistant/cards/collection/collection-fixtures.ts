/**
 * What the collections' tools answer, as the cards read them: a shared list
 * with its labels and places, the lists of a user with an invite, and the
 * chat's trip with the Louvre (place 5) and Septime saved from it.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { AnswerInput, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';

export const TRIP_ID = 7;

export const card = buildTripCard(
  TRIP_ID,
  1,
  { trip: { title: 'Paris' }, days: [] },
  {
    places: [
      { id: 5, name: 'Louvre', lat: 48.861, lng: 2.336, google_place_id: 'ChIJlouvre', category_id: 3 },
      { id: 6, name: 'Septime (trip)', lat: 48.853, lng: 2.381, image_url: '/uploads/places/septime.jpg' },
    ],
  },
  null,
);

export const ctx: PreviewContext = {
  card,
  categories: new Map([[3, 'Sights']]),
  locale: 'en',
  today: '2026-06-01',
  airport: () => null,
};

export const LABELS = [
  { id: 51, collection_id: 12, name: 'Dinner', color: '#2563eb' },
  { id: 52, collection_id: 12, name: 'Late', color: 'not a colour' },
  { id: 53, collection_id: 12, name: 'Unused', color: '#16a34a' },
];

export function savedPlace(over: Record<string, unknown> = {}) {
  return {
    id: 34,
    collection_id: 12,
    name: 'Septime',
    address: '80 Rue de Charonne',
    lat: 48.853,
    lng: 2.381,
    status: 'want',
    label_ids: [51, 52],
    rating_avg: 4.4666,
    rating_count: 3,
    ratings: [],
    notes: 'Ask for the counter',
    phone: '+33 1 43 67 38 29',
    website: 'https://septime.example',
    image_url: '/uploads/places/septime.jpg',
    google_place_id: null,
    osm_id: null,
    source_trip_id: TRIP_ID,
    source_place_id: 6,
    category: { id: 9, name: 'Restaurant', icon: 'Utensils', color: '#f97316' },
    updated_at: '2026-05-01 10:00:00',
    ...over,
  };
}

export const COLLECTION = {
  id: 12,
  owner_id: 1,
  name: 'Paris food',
  color: '#e11d48',
  place_count: 10,
  is_owner: true,
  members: [
    { user_id: 1, username: 'me', email: 'me@example.com', status: 'accepted', is_owner: true },
    { user_id: 2, username: 'maya', email: 'maya@example.com', status: 'accepted', is_owner: false },
    { user_id: 3, username: 'tom', email: 'tom@example.com', status: 'pending', is_owner: false },
  ],
  labels: LABELS,
};

/** `get_collection` of list 12 with ten places, the first one Septime. */
export function collectionValue(count = 10) {
  const places = Array.from({ length: count }, (_, i) =>
    i === 0
      ? savedPlace()
      : savedPlace({
          id: 100 + i,
          name: `Spot ${i}`,
          status: i % 2 ? 'visited' : 'idea',
          label_ids: i === 1 ? [51] : [],
          source_place_id: null,
          image_url: null,
        }),
  );
  return { collection: COLLECTION, places };
}

/** `get_collection_items` for the given saved places, all in list 12, which the user owns. */
export function itemsValue(places: Array<Record<string, unknown>>) {
  const { members, labels, ...list } = COLLECTION;
  const people = members.map(({ user_id, username, status, is_owner }) => ({ user_id, username, status, is_owner }));
  return {
    lists: [{ ...list, can_delete: true, labels, members: people }],
    places,
    labels: [],
  };
}

export function answerInput(args: Record<string, unknown>, value: unknown): AnswerInput {
  return { toolCallId: 'call_1', args, value, card, today: '2026-06-01' };
}
