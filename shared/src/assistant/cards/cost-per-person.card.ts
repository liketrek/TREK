import { cardCurrencySchema, cardPersonSchema } from './card-parts';

import { z } from 'zod';

/**
 * What the trip's expenses come to for each traveller, in the trip
 * currency: the sum of their shares, how much of that is marked paid, and in
 * how many expenses they take part. Largest share first.
 */

/** Travellers one card names; the rest are counted in `more`. */
export const COST_PER_PERSON_ROWS_MAX = 20;

export const costPerPersonCardSchema = z.object({
  kind: z.literal('costPerPerson'),
  currency: cardCurrencySchema,
  rows: z
    .array(
      z.object({
        person: cardPersonSchema,
        share: z.number().min(-1e9).max(1e9),
        paid: z.number().min(-1e9).max(1e9),
        count: z.number().int().min(0).max(100_000),
      }),
    )
    .min(1)
    .max(COST_PER_PERSON_ROWS_MAX),
  more: z.number().int().min(0).max(1000),
});
export type CostPerPersonCard = z.infer<typeof costPerPersonCardSchema>;
