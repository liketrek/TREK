import { type AssistantScope, HOME_ASSISTANT_SCOPE } from '@trek/shared';

import type { AssistantTarget } from '../api/assistant';

/**
 * The key the assistant store keeps a conversation under, and the one every
 * part of the chat passes back to it: a trip's id for the planner's chat, the
 * journey's id negated for the chat in TREK Studio, and 0 for the home chat
 * outside any one trip (the dashboard, Vacay, Atlas, collections, settings).
 * Trip ids are positive (a trip is never made offline with a temporary id), so
 * the three never meet, and the parts that only make sense on a trip (the map,
 * the day list, found places) find no trip under a journey's key or the home
 * key and stay empty.
 *
 * A number rather than `assistantScopeKey`'s `journey:12`, so the trip chat
 * keeps the key it always had and every part that reads it stays as it is.
 */
export type AssistantChatKey = number;

/** The key of the home chat. */
export const HOME_CHAT_KEY: AssistantChatKey = 0;

/** The key a scope's chat is kept under. */
export function assistantChatKey(scope: AssistantScope): AssistantChatKey {
  if (scope.kind === 'home') return HOME_CHAT_KEY;
  return scope.kind === 'trip' ? scope.tripId : -scope.journeyId;
}

/** What the chat under a key is about. */
export function assistantScopeOf(key: AssistantChatKey): AssistantScope {
  if (key === HOME_CHAT_KEY) return HOME_ASSISTANT_SCOPE;
  return key < 0 ? { kind: 'journey', journeyId: -key } : { kind: 'trip', tripId: key };
}

/** What the repo is called with for the chat under a key: a trip's id as it always was, any other scope as it is. */
export function assistantTargetOf(key: AssistantChatKey): AssistantTarget {
  return key > 0 ? key : assistantScopeOf(key);
}
