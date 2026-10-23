import type { AssistantScope } from '@trek/shared';

import type { AssistantTarget } from '../api/assistant';

/**
 * The key the assistant store keeps a conversation under, and the one every
 * part of the chat passes back to it: a trip's id for the planner's chat, and
 * the journey's id negated for the chat in TREK Studio. Trip ids are positive
 * (a trip is never made offline with a temporary id), so the two never meet,
 * and the parts that only make sense on a trip (the map, the day list, found
 * places) find no trip under a journey's key and stay empty.
 *
 * A number rather than `assistantScopeKey`'s `journey:12`, so the trip chat
 * keeps the key it always had and every part that reads it stays as it is.
 */
export type AssistantChatKey = number;

/** The key a scope's chat is kept under. */
export function assistantChatKey(scope: AssistantScope): AssistantChatKey {
  return scope.kind === 'trip' ? scope.tripId : -scope.journeyId;
}

/** What the chat under a key is about. */
export function assistantScopeOf(key: AssistantChatKey): AssistantScope {
  return key < 0 ? { kind: 'journey', journeyId: -key } : { kind: 'trip', tripId: key };
}

/** What the repo is called with for the chat under a key: a trip's id as it always was, a journey's scope. */
export function assistantTargetOf(key: AssistantChatKey): AssistantTarget {
  return key < 0 ? assistantScopeOf(key) : key;
}
