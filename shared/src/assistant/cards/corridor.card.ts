import { idSchema } from '../../common/primitives.schema';
import { roadtripCorridorRequestSchema } from '../../roadtrip/planning.schema';
import { MAX_TRIP_DAYS } from '../../trip/trip.schema';
import { cardLatSchema, cardLngSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * What search_roadtrip_corridor found along one day's drive, in the order
 * the drive passes it: how far into the drive and how far off the road each
 * hit lies, between which stops, and for a charger its sockets. A search
 * that is not done yet says how much of the road it has searched.
 */

/** The hits a card lists; the rest are counted in `more`. */
export const CORRIDOR_CARD_HITS_MAX = 12;

export const corridorCardSchema = z.object({
  kind: z.literal('corridor'),
  dayId: idSchema.nullable(),
  dayNumber: z.number().int().min(1).max(MAX_TRIP_DAYS),
  category: roadtripCorridorRequestSchema.shape.category,
  widthKm: z.number().positive().max(10),
  hits: z
    .array(
      z.object({
        // `<toolCallId>:<index>`, the way a found place is named.
        ref: z.string().min(1).max(80),
        name: cardText(80).nullable(),
        brand: cardText(40).nullable(),
        lat: cardLatSchema,
        lng: cardLngSchema,
        alongKm: z.number().min(0).max(40_000),
        offKm: z.number().min(0).max(10),
        // The names of the stops the hit lies between, in driving order.
        between: z.tuple([cardText(80), cardText(80)]).nullable(),
        sockets: z
          .array(
            z.object({
              type: cardText(20),
              kw: z.number().min(0).max(2000).nullable(),
              count: z.number().int().min(0).max(99).nullable(),
            }),
          )
          .max(4),
      }),
    )
    .max(CORRIDOR_CARD_HITS_MAX),
  more: z.number().int().min(0).max(10_000),
  searched: z.object({ done: z.number().int().min(0).max(1000), total: z.number().int().min(0).max(1000) }),
  // Areas that failed, came back cut short, or are still to be searched.
  partial: z.boolean(),
});
export type CorridorCard = z.infer<typeof corridorCardSchema>;
export type CorridorCardHit = CorridorCard['hits'][number];
