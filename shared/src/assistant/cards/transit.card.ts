import { idSchema } from '../../common/primitives.schema';
import { cardClockSchema, cardDateSchema, cardHexColorSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Public transport connections between two places: the ones a search found,
 * or the one a held create_transit_journey adds. Clocks are the local time
 * at each stop as the provider wrote it; a connection that lands on a later
 * day says by how many (`endDayOffset`).
 */

/** The connections a card lists; the rest are counted in `more`. */
export const TRANSIT_CARD_ITINERARIES_MAX = 4;
/** The legs of one connection a card lists. */
export const TRANSIT_CARD_LEGS_MAX = 12;

const seconds = z.number().min(0).max(1e7);

const transitCardStopSchema = z.object({
  name: cardText(80),
  time: cardClockSchema.nullable(),
  track: cardText(12).nullable(),
});

export const transitCardItinerarySchema = z.object({
  date: cardDateSchema,
  start: cardClockSchema,
  end: cardClockSchema,
  endDayOffset: z.number().int().min(0).max(3),
  durationS: seconds,
  transfers: z.number().int().min(0).max(20),
  walkS: seconds,
  legs: z
    .array(
      z.object({
        mode: z.string().regex(/^[A-Z_]{1,40}$/),
        line: cardText(20).nullable(),
        lineColor: cardHexColorSchema.nullable(),
        lineTextColor: cardHexColorSchema.nullable(),
        from: transitCardStopSchema,
        to: transitCardStopSchema,
        durationS: seconds,
        stops: z.number().int().min(0).max(500),
        headsign: cardText(80).nullable(),
        agency: cardText(60).nullable(),
      }),
    )
    .min(1)
    .max(TRANSIT_CARD_LEGS_MAX),
});

export const transitCardSchema = z.object({
  kind: z.literal('transit'),
  from: cardText(80),
  to: cardText(80),
  // The day a held journey is added to; null for a search.
  dayId: idSchema.nullable(),
  itineraries: z.array(transitCardItinerarySchema).min(1).max(TRANSIT_CARD_ITINERARIES_MAX),
  more: z.number().int().min(0).max(100),
  // Connections the provider offered that could not be checked, so none of them is shown.
  dropped: z.number().int().min(0).max(100),
});
export type TransitCard = z.infer<typeof transitCardSchema>;
export type TransitCardItinerary = z.infer<typeof transitCardItinerarySchema>;
