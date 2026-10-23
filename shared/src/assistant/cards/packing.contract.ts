import { packingListCardSchema } from './packing-list.card';
import { todoListCardSchema } from './todo-list.card';

export * from './packing-list.card';
export * from './todo-list.card';

/**
 * What the packing and to-do lists bring to the assistant chat: the kinds of card they draw,
 * the verbs of their change cards and what an applied change of theirs
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else. Their changes name the generic
 * verbs with the tool's own label; a bag is the one thing they touch that the
 * core has no name for.
 */
export const PACKING_CARD_SCHEMAS = [packingListCardSchema, todoListCardSchema] as const;
export const PACKING_VERB_KEYS = [] as const;
export const PACKING_APPLIED_ENTITIES = ['packing_bag'] as const;
