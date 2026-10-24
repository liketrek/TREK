import { Bookmark, BookmarkCheck } from 'lucide-react';

import type { PackLook } from '../cardTypes';
import { appliedListTarget, appliedPlaceOnMap, appliedPlaceTarget } from './collectionCardModel';

/**
 * What the collections bring to the chat's pure look: the name of each of
 * their writes, the words their reads run under, where an applied change of
 * theirs opens (a list, or a saved place selected in it; a copy into the trip
 * is a trip place and shows on the map), and what a list of saved places
 * offers to ask next. A look stays pure, icons and literals only: the chat's
 * main chunk reads every look, so whatever a look imports ships with it.
 */
export const COLLECTION_LOOK = {
  verbs: {},
  tools: {
    create_collection: { labelKey: 'assistant.tool.create_collection' },
    update_collection: { labelKey: 'assistant.tool.update_collection' },
    delete_collection: { labelKey: 'assistant.tool.delete_collection' },
    reorder_collections: { labelKey: 'assistant.tool.reorder_collections' },
    save_place_to_collection: { labelKey: 'assistant.tool.save_place_to_collection' },
    save_trip_places_to_collection: { labelKey: 'assistant.tool.save_trip_places_to_collection' },
    update_collection_place: { labelKey: 'assistant.tool.update_collection_place' },
    set_collection_place_status: { labelKey: 'assistant.tool.set_collection_place_status' },
    set_collection_place_status_from_trip: { labelKey: 'assistant.tool.set_collection_place_status_from_trip' },
    rate_collection_place: { labelKey: 'assistant.tool.rate_collection_place' },
    delete_collection_place: { labelKey: 'assistant.tool.delete_collection_place' },
    copy_collection_places_to_trip: { labelKey: 'assistant.tool.copy_collection_places_to_trip' },
    create_collection_label: { labelKey: 'assistant.tool.create_collection_label' },
    update_collection_label: { labelKey: 'assistant.tool.update_collection_label' },
    delete_collection_label: { labelKey: 'assistant.tool.delete_collection_label' },
    assign_collection_labels: { labelKey: 'assistant.tool.assign_collection_labels' },
    accept_collection_invite: { labelKey: 'assistant.tool.accept_collection_invite' },
    decline_collection_invite: { labelKey: 'assistant.tool.decline_collection_invite' },
    cancel_collection_invite: { labelKey: 'assistant.tool.cancel_collection_invite' },
  },
  steps: {
    get_collection: { stepKey: 'assistant.step.readingList' },
    get_collection_items: { stepKey: 'assistant.step.readingList' },
    list_collections: { stepKey: 'assistant.step.lookingAtLists' },
    available_collection_users: { stepKey: 'assistant.step.lookingAtLists' },
    find_place_in_collections: { stepKey: 'assistant.step.checkingLists' },
  },
  entities: {
    collection: {
      Icon: Bookmark,
      openLabelKey: 'assistant.card.collection.openList',
      open: appliedListTarget,
    },
    collection_place: {
      Icon: BookmarkCheck,
      openLabelKey: 'assistant.card.collection.openPlace',
      onMap: (_applied, card) => appliedPlaceOnMap(card),
      open: appliedPlaceTarget,
    },
  },
  cards: {
    collectionPlaces: {
      followUps: [
        { id: 'collectionToTrip', labelKey: 'assistant.followUp.collectionToTrip', edits: true },
        { id: 'collectionDay', labelKey: 'assistant.followUp.collectionDay', edits: true },
      ],
    },
    collectionLists: {},
  },
} satisfies PackLook<'collectionPlaces' | 'collectionLists'>;
