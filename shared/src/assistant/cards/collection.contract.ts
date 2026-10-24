import { collectionListsCardSchema } from './collection-lists.card';
import { collectionPlacesCardSchema } from './collection-places.card';

export * from './collection-lists.card';
export * from './collection-places.card';

/**
 * What the collections bring to the assistant chat: the kinds of card they draw,
 * the verbs of their change cards and what an applied change of theirs
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const COLLECTION_CARD_SCHEMAS = [collectionPlacesCardSchema, collectionListsCardSchema] as const;
/** Their changes read as the plain add, change and remove, named by each tool's own label. */
export const COLLECTION_VERB_KEYS = [] as const;
/** A list (`collection`) and a saved place of one (`collection_place`), both opened in Collections. */
export const COLLECTION_APPLIED_ENTITIES = ['collection', 'collection_place'] as const;
