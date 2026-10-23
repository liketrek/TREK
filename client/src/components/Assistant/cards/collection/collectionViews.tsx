import type { CardView } from '../cardTypes';
import { CollectionListsBlock, CollectionPlacesBlock } from './CollectionCardBlocks';
import { CollectionListFacts, CollectionPlaceFacts, CollectionPlaceLead } from './CollectionChangeSlots';

/**
 * How the kinds of the collections draw in the chat: saved places under their
 * list's head beside an answer, and in a change card their photo in front and
 * what the change does on the faint line; the lists the same way. This file
 * only maps each kind to its view: the components live in sibling files, since
 * a file that exports anything besides components breaks fast refresh, and
 * lint:warnings holds react-refresh/only-export-components at zero for a new
 * file.
 */
export const COLLECTION_VIEWS = {
  collectionPlaces: { Block: CollectionPlacesBlock, Lead: CollectionPlaceLead, Facts: CollectionPlaceFacts },
  collectionLists: { Block: CollectionListsBlock, Facts: CollectionListFacts },
} satisfies { [K in 'collectionPlaces' | 'collectionLists']: CardView<K> };
