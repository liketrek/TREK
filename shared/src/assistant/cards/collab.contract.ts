import { collabChatCardSchema } from './collab-chat.card';
import { collabNotesCardSchema } from './collab-notes.card';
import { collabPollsCardSchema } from './collab-polls.card';

export * from './collab-chat.card';
export * from './collab-notes.card';
export * from './collab-polls.card';

/**
 * What the trip chat brings to the assistant chat: the kinds of card it draws,
 * the verbs of its change cards and the entities its applied changes touch,
 * beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else. Its changes keep the generic
 * verbs (add, change, remove) and name their tool instead.
 */
export const COLLAB_CARD_SCHEMAS = [collabChatCardSchema, collabPollsCardSchema, collabNotesCardSchema] as const;
export const COLLAB_VERB_KEYS = [] as const;
export const COLLAB_APPLIED_ENTITIES = ['collab_message', 'collab_poll', 'collab_note'] as const;
