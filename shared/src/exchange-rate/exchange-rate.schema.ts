import { z } from 'zod';

export const exchangeRateSourceSchema = z.enum(['identity', 'global', 'trip', 'explicit', 'legacy']);
export type ExchangeRateSource = z.infer<typeof exchangeRateSourceSchema>;

export const exchangeRateSnapshotSchema = z.object({
  base_currency: z.string().length(3),
  rates: z.record(z.string(), z.number().positive()),
  source_version: z.string(),
  effective_date: z.string().nullable(),
  fetched_at: z.string(),
  stale: z.boolean(),
});
export type ExchangeRateSnapshot = z.infer<typeof exchangeRateSnapshotSchema>;

export const exchangeRateResolutionSchema = z.object({
  trip_id: z.number(),
  trip_currency: z.string().length(3),
  item_currency: z.string().length(3),
  exchange_rate: z.number().positive(),
  source: exchangeRateSourceSchema,
  source_version: z.string(),
  effective_date: z.string().nullable(),
  fetched_at: z.string().nullable(),
  stale: z.boolean(),
});
export type ExchangeRateResolution = z.infer<typeof exchangeRateResolutionSchema>;

export const tripExchangeRateSchema = z.object({
  trip_id: z.number(),
  currency: z.string().length(3),
  exchange_rate: z.number().positive(),
  effective_date: z.string().nullable().optional(),
  source_version: z.string(),
  set_at: z.string(),
  set_by_user_id: z.number().nullable(),
  note: z.string().nullable(),
});
export type TripExchangeRate = z.infer<typeof tripExchangeRateSchema>;

export const setTripExchangeRateRequestSchema = z.object({
  exchange_rate: z.number().positive().finite(),
  note: z.string().max(500).nullable().optional(),
});
export type SetTripExchangeRateRequest = z.infer<typeof setTripExchangeRateRequestSchema>;

export const exchangeRateWriteSchema = z.object({
  exchange_rate: z.number().positive().finite().optional(),
  exchange_rate_note: z.string().max(500).nullable().optional(),
});

export const exchangeRateBatchSelectionSchema = z.object({
  type: z.enum(['expense', 'settlement']),
  id: z.number().int().positive(),
});

export const previewTripExchangeRateRequestSchema = setTripExchangeRateRequestSchema.extend({
  selected: z.array(exchangeRateBatchSelectionSchema).optional(),
});
export type PreviewTripExchangeRateRequest = z.infer<typeof previewTripExchangeRateRequestSchema>;

export const applyTripExchangeRateRequestSchema = z.object({
  preview_id: z.string(),
  selected: z.array(exchangeRateBatchSelectionSchema),
});
export type ApplyTripExchangeRateRequest = z.infer<typeof applyTripExchangeRateRequestSchema>;
