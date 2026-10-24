import { idSchema } from '../../common/primitives.schema';
import { cardCountSchema, cardDateSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A trip the chat outside any one trip offers to go on with in that trip's own
 * chat: the conversation there knows the trip's days and places and can change
 * them, which the chat on the dashboard does not. The question is what the
 * user asked about the trip, handed over so it waits there ready to send.
 */

/** Where the trip stands today: under way, the next one to start, later, behind, or without dates. */
export const TRIP_CHAT_PHASES = ['now', 'next', 'upcoming', 'past', 'undated'] as const;
export type TripChatPhase = (typeof TRIP_CHAT_PHASES)[number];

export const tripChatCardSchema = z.object({
  kind: z.literal('tripChat'),
  trip: z.object({
    id: idSchema,
    title: cardText(200),
    startDate: cardDateSchema.nullable(),
    endDate: cardDateSchema.nullable(),
    phase: z.enum(TRIP_CHAT_PHASES),
    placeCount: cardCountSchema.nullable(),
  }),
  /** The question to ask in the trip's chat, in the user's words; null when there is none to hand over. */
  question: cardText(500).nullable(),
});
export type TripChatCard = z.infer<typeof tripChatCardSchema>;
