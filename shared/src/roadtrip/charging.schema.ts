import { z } from 'zod';

export const chargingInfoSchema = z.object({
  checkedAt: z.string(),
  status: z.enum(['ok', 'unknown', 'ambiguous', 'unavailable']),
  station: z.string().nullable(),
  source: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  license: z.string().nullable(),
  updatedAt: z.string().nullable(),
  stale: z.boolean(),
  available: z.number().int().nonnegative().nullable(),
  total: z.number().int().nonnegative(),
  unknown: z.number().int().nonnegative(),
  tariffs: z.array(
    z.object({
      currency: z.string(),
      updatedAt: z.string(),
      components: z.array(
        z.object({
          kind: z.string(),
          price: z.number().nonnegative(),
          taxIncluded: z.boolean(),
          conditional: z.boolean(),
          afterSeconds: z.number().nullable(),
        }),
      ),
    }),
  ),
  pricesUnavailable: z.boolean(),
});
export type ChargingInfo = z.infer<typeof chargingInfoSchema>;
