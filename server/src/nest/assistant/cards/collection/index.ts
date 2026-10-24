import type { AssistantWriteTool } from '../../assistant-tools.constants';
import type { DomainCards, ToolCards } from '../card-types';
import { collectionAnswer, itemsAnswer, listsAnswer, membershipAnswer } from './collection-answers';
import {
  COLLECTION_APPLIED,
  COLLECTION_APPLIED_IDS,
  DELETE_CREATED_LIST,
  DELETE_SAVED_PLACE,
} from './collection-applied';
import { COLLECTION_CHANGES } from './collection-changes';
import { COLLECTION_LOADS, type CollectionLookup } from './collection-load';

/**
 * The collections in the assistant chat: a list read shows its head and
 * first places, saved places by id their rows, the lists with the invites
 * waiting, and where a place is saved; every write is held as a change card
 * built from what it will touch, and replaced by what it did once applied.
 * A saved place's id is its own, never a trip place's, so the collections'
 * place ids never name a trip place on the generic card either.
 */

/** Each write's verb and what its receipt names: a list, a saved place, or for a copy into the trip, trip places. */
const WRITES: Readonly<Record<string, AssistantWriteTool>> = {
  create_collection: { verbKey: 'genericCreate', entity: 'collection' },
  update_collection: { verbKey: 'genericUpdate', entity: 'collection' },
  delete_collection: { verbKey: 'genericRemove', entity: 'collection' },
  reorder_collections: { verbKey: 'genericUpdate', entity: 'collection' },
  accept_collection_invite: { verbKey: 'genericUpdate', entity: 'collection' },
  decline_collection_invite: { verbKey: 'genericRemove', entity: 'collection' },
  cancel_collection_invite: { verbKey: 'genericRemove', entity: 'collection' },
  save_place_to_collection: { verbKey: 'genericCreate', entity: 'collection_place' },
  save_trip_places_to_collection: { verbKey: 'genericCreate', entity: 'collection' },
  update_collection_place: { verbKey: 'genericUpdate', entity: 'collection_place' },
  set_collection_place_status: { verbKey: 'genericUpdate', entity: 'collection_place' },
  set_collection_place_status_from_trip: { verbKey: 'genericUpdate', entity: 'collection' },
  rate_collection_place: { verbKey: 'genericUpdate', entity: 'collection_place' },
  delete_collection_place: { verbKey: 'genericRemove', entity: 'collection_place' },
  copy_collection_places_to_trip: { verbKey: 'genericCreate', entity: 'place' },
  create_collection_label: { verbKey: 'genericCreate', entity: 'collection' },
  update_collection_label: { verbKey: 'genericUpdate', entity: 'collection' },
  delete_collection_label: { verbKey: 'genericRemove', entity: 'collection' },
  assign_collection_labels: { verbKey: 'genericUpdate', entity: 'collection' },
};

/** A place's own photo is uploaded in the app, never set from an address the model picked (as for trip places). */
const NO_IMAGE = { stripped: ['image_url'] } as const;

/** The change card of one write, its lookup and what it shows once applied. */
function writeCards(tool: string, write: AssistantWriteTool): ToolCards<CollectionLookup> {
  const change = COLLECTION_CHANGES[tool];
  const applied = COLLECTION_APPLIED[tool];
  const appliedIds = COLLECTION_APPLIED_IDS[tool];
  const load = COLLECTION_LOADS[tool];
  return {
    write,
    ...(change ? { describe: change.describe, change: change.change } : {}),
    ...(load ? { load } : {}),
    ...(applied ? { applied } : {}),
    ...(appliedIds ? { appliedIds } : {}),
  };
}

const WRITE_CARDS = Object.fromEntries(
  Object.entries(WRITES).map(([tool, write]): [string, ToolCards<CollectionLookup>] => [tool, writeCards(tool, write)]),
);

export const COLLECTION_CARDS: DomainCards = {
  id: 'collection',
  foreignIdGroups: ['collections'],
  tools: {
    get_collection: { answer: collectionAnswer },
    get_collection_items: { answer: itemsAnswer },
    list_collections: { answer: listsAnswer },
    find_place_in_collections: { answer: membershipAnswer },
    ...WRITE_CARDS,
    create_collection: { ...writeCards('create_collection', WRITES.create_collection), undo: DELETE_CREATED_LIST },
    save_place_to_collection: {
      ...writeCards('save_place_to_collection', WRITES.save_place_to_collection),
      undo: DELETE_SAVED_PLACE,
      argPolicy: NO_IMAGE,
    },
    update_collection_place: {
      ...writeCards('update_collection_place', WRITES.update_collection_place),
      argPolicy: NO_IMAGE,
    },
  },
};
