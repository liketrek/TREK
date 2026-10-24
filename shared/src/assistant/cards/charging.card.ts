import { idSchema } from '../../common/primitives.schema';
import { cardInstantSchema, cardLatSchema, cardLngSchema, cardMoneySchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * A charger as one look at it found it: how many points were free when it
 * was checked, the cheapest published price per kWh, and where the figures
 * come from. A snapshot with its time, never refreshed in the chat, and
 * never the source's address: the attribution is its name and licence.
 */
export const chargingCardSchema = z.object({
  kind: z.literal('charging'),
  // The stop of the trip it is, or null for a charger found by its position.
  placeId: idSchema.nullable(),
  name: cardText(80).nullable(),
  station: cardText(120).nullable(),
  lat: cardLatSchema.nullable(),
  lng: cardLngSchema.nullable(),
  status: z.enum(['ok', 'unknown', 'ambiguous', 'unavailable']),
  stale: z.boolean(),
  available: z.number().int().min(0).max(999).nullable(),
  total: z.number().int().min(0).max(999),
  checkedAt: cardInstantSchema.nullable(),
  updatedAt: cardInstantSchema.nullable(),
  // The cheapest unconditional energy price with tax, per kWh; null when the prices are in several currencies.
  energy: cardMoneySchema.nullable(),
  // The other price components the tariffs name besides that one.
  otherPrices: z.number().int().min(0).max(99),
  source: cardText(80).nullable(),
  license: cardText(120).nullable(),
});
export type ChargingCard = z.infer<typeof chargingCardSchema>;
