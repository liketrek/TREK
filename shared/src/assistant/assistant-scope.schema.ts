import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * What an assistant conversation is about: a trip (the planner's chat) or a
 * journey (the chat in TREK Studio, which works on the journey's book). A
 * thread belongs to exactly one of them, and the tools a turn offers, the
 * context it reads and the routes it is reached under follow from it:
 * `/api/trips/:tripId/assistant` and `/api/journeys/:journeyId/assistant`.
 */
export const assistantScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('trip'), tripId: idSchema }).strict(),
  z.object({ kind: z.literal('journey'), journeyId: idSchema }).strict(),
]);
export type AssistantScope = z.infer<typeof assistantScopeSchema>;

/** The key a scope's conversations are kept under on a client: `trip:5`, `journey:12`. */
export function assistantScopeKey(scope: AssistantScope): string {
  return scope.kind === 'trip' ? `trip:${scope.tripId}` : `journey:${scope.journeyId}`;
}
