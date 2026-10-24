import type { CardReader, ToolArgs } from '../card-types';
import { argId, recordOf } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import { idsIn, positiveId } from './collection-values';

/**
 * What describing a held change of the collections reads first, through the
 * turn's memo (at most four reads, each a null on failure): the list a change
 * works in (`get_collection`), the saved places or labels it names
 * (`get_collection_items`), the lists a place to save is in already
 * (`find_place_in_collections`) and the user's lists with their invites
 * (`list_collections`). Its arguments are the tool's own; nothing here writes.
 */
export interface CollectionLookup {
  /** The list the change works in, read whole. */
  collection: unknown;
  /** The list a saved place moves to. */
  target: unknown;
  items: unknown;
  membership: unknown;
  lists: unknown;
}

export const NO_LOOKUP: CollectionLookup = {
  collection: null,
  target: null,
  items: null,
  membership: null,
  lists: null,
};

type Loader = (args: ToolArgs, read: CardReader) => Promise<CollectionLookup>;

function collectionOf(read: CardReader, collectionId: number | null): Promise<unknown> {
  return collectionId === null ? Promise.resolve(null) : read('get_collection', { collectionId });
}

function placesOf(read: CardReader, placeIds: number[]): Promise<unknown> {
  return placeIds.length === 0 ? Promise.resolve(null) : read('get_collection_items', { placeIds });
}

/** How to ask where a place is saved: by its provider ids or its position; nothing to ask without either. */
function membershipQuery(args: ToolArgs): ToolArgs | null {
  const query: ToolArgs = {};
  for (const key of ['google_place_id', 'google_ftid']) {
    if (typeof args[key] === 'string' && args[key] !== '') query[key] = args[key];
  }
  if (typeof args.lat === 'number' && typeof args.lng === 'number') {
    query.lat = args.lat;
    query.lng = args.lng;
  }
  return Object.keys(query).length > 0 ? query : null;
}

/** The one saved place the change names. */
const onePlace: Loader = async (args, read) => ({
  ...NO_LOOKUP,
  items: await placesOf(read, idsIn([args.placeId], 1)),
});

/** The saved places of a change over several. */
const manyPlaces: Loader = async (args, read) => ({
  ...NO_LOOKUP,
  items: await placesOf(read, idsIn(args.place_ids, 50)),
});

/** The list a change works in, by the argument that names it. */
const listBy =
  (key: string): Loader =>
  async (args, read) => ({ ...NO_LOOKUP, collection: await collectionOf(read, argId(args, key)) });

/** The user's lists and the invites waiting. */
const allLists: Loader = async (_args, read) => ({ ...NO_LOOKUP, lists: await read('list_collections') });

/** A label by its id, then its list read whole, so the card can say how many places carry it. */
const oneLabel: Loader = async (args, read) => {
  const labelId = argId(args, 'labelId');
  const items = labelId === null ? null : await read('get_collection_items', { labelIds: [labelId] });
  const label = rowsOf(recordOf(items).labels)[0];
  return { ...NO_LOOKUP, items, collection: await collectionOf(read, positiveId(recordOf(label).collection_id)) };
};

export const COLLECTION_LOADS: Readonly<Partial<Record<string, Loader>>> = {
  save_place_to_collection: async (args, read) => {
    const query = membershipQuery(args);
    const [collection, membership] = await Promise.all([
      collectionOf(read, argId(args, 'collection_id')),
      query ? read('find_place_in_collections', query) : Promise.resolve(null),
    ]);
    return { ...NO_LOOKUP, collection, membership };
  },
  save_trip_places_to_collection: listBy('collectionId'),
  update_collection_place: async (args, read) => {
    const [items, target] = await Promise.all([
      placesOf(read, idsIn([args.placeId], 1)),
      collectionOf(read, argId(args, 'collection_id')),
    ]);
    return { ...NO_LOOKUP, items, target };
  },
  set_collection_place_status: onePlace,
  rate_collection_place: onePlace,
  delete_collection_place: onePlace,
  assign_collection_labels: manyPlaces,
  copy_collection_places_to_trip: manyPlaces,
  update_collection: listBy('collectionId'),
  delete_collection: listBy('collectionId'),
  cancel_collection_invite: listBy('collectionId'),
  create_collection_label: listBy('collection_id'),
  update_collection_label: oneLabel,
  delete_collection_label: oneLabel,
  reorder_collections: allLists,
  accept_collection_invite: allLists,
  decline_collection_invite: allLists,
};
