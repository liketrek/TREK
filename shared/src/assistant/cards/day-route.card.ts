import { idSchema } from '../../common/primitives.schema';
import { MAX_TRIP_DAYS } from '../../trip/trip.schema';
import { cardLatSchema, cardLngSchema, cardPointSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * One day's route drawn straight from stop to stop, with the via points a
 * change sends the drive through: the card of every change that bends a
 * day's drive, and of a Google Maps route read or imported. Straight lines on
 * purpose: TREK routes the road once the change is applied.
 */

/** The stops of a day a card draws. */
export const DAY_ROUTE_CARD_STOPS_MAX = 40;
/** The via points a card draws. */
export const DAY_ROUTE_CARD_VIAS_MAX = 100;

export const dayRouteCardSchema = z.object({
  kind: z.literal('dayRoute'),
  dayId: idSchema.nullable(),
  dayNumber: z.number().int().min(1).max(MAX_TRIP_DAYS).nullable(),
  stops: z
    .array(
      z.object({
        placeId: idSchema.nullable(),
        name: cardText(80),
        lat: cardLatSchema,
        lng: cardLngSchema,
        // A stop the change adds to the day.
        added: z.boolean(),
      }),
    )
    .max(DAY_ROUTE_CARD_STOPS_MAX),
  vias: z
    .array(
      z.object({
        lat: cardLatSchema,
        lng: cardLngSchema,
        // The stop of the day the via follows, counting from 0.
        after: z.number().int().min(0).max(500),
        state: z.enum(['added', 'moved', 'removed', 'repinned']),
        // Where a moved via was before.
        from: cardPointSchema.nullable(),
      }),
    )
    .max(DAY_ROUTE_CARD_VIAS_MAX),
  // The stop every new via follows, and the imported track the chain was fitted to.
  afterName: cardText(80).nullable(),
  track: cardText(80).nullable(),
  // Stops of a read Google Maps route that have no position.
  unresolved: z.array(cardText(80)).max(10),
});
export type DayRouteCard = z.infer<typeof dayRouteCardSchema>;
export type DayRouteCardVia = DayRouteCard['vias'][number];
