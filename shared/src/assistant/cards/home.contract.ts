import { tripChatCardSchema } from './trip-chat.card';

export * from './trip-chat.card';

/**
 * What the chat outside any one trip (the `home` scope) brings to the
 * assistant chat: the card that offers to go on in a trip's own chat. It has
 * no change cards of its own; the writes it proposes are the atlas', the
 * vacation planner's and the collections'. cards/index.ts spreads the kinds
 * into the card union.
 */
export const HOME_CARD_SCHEMAS = [tripChatCardSchema] as const;
