import { z } from 'zod';

/** How packed the days may be. */
export const travelPlanPaceSchema = z.enum(['relaxed', 'balanced', 'intensive']);

export type TravelPlanPace = z.infer<typeof travelPlanPaceSchema>;

/** The main way the traveller expects to move between places. */
export const travelPlanTransportSchema = z.enum(['public_transit', 'driving', 'walking', 'mixed']);

export type TravelPlanTransport = z.infer<typeof travelPlanTransportSchema>;

export const travelPlanTravelersSchema = z.object({
  adults: z.number().int().min(1).max(50).default(1),
  children: z.number().int().min(0).max(50).default(0),
  seniors: z.number().int().min(0).max(50).default(0),
});

export type TravelPlanTravelers = z.infer<typeof travelPlanTravelersSchema>;

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

/**
 * The structured wish list behind a plan. Every field is optional: the
 * traveller may give nothing but a sentence (`TravelPlanCreateRequest.prompt`).
 *
 * `destination` is the city or region the plan is about, in the traveller's
 * words — the planner resolves it through the configured place provider and
 * never invents a place id from it.
 */
export const travelPlanRequestSchema = z.object({
  destination: z.string().trim().min(1).max(120).optional(),
  origin: z.string().trim().min(1).max(120).optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  dayCount: z.number().int().min(1).max(14).optional(),
  travelers: travelPlanTravelersSchema.default({ adults: 1, children: 0, seniors: 0 }),
  budgetCny: z.number().nonnegative().max(1_000_000).optional(),
  pace: travelPlanPaceSchema.default('balanced'),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  transport: travelPlanTransportSchema.default('public_transit'),
  constraints: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  /** The traveller's own sentence, kept verbatim for the planner. */
  prompt: z.string().trim().min(1).max(2000).optional(),
});

export type TravelPlanRequest = z.infer<typeof travelPlanRequestSchema>;

/**
 * What the client posts to create a plan. At least one of `prompt` and
 * `destination` is required, and a start/end pair must not run backwards.
 */
export const travelPlanCreateRequestSchema = travelPlanRequestSchema.superRefine((value, ctx) => {
  if (!value.prompt && !value.destination) {
    ctx.addIssue({
      code: 'custom',
      path: ['prompt'],
      message: 'A destination or a prompt is required',
    });
  }
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'endDate must not be before startDate',
    });
  }
  if (value.startDate && value.endDate) {
    const days =
      Math.round((Date.parse(`${value.endDate}T00:00:00Z`) - Date.parse(`${value.startDate}T00:00:00Z`)) / 86_400_000) +
      1;
    if (days > 14) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'The plan may cover at most 14 days',
      });
    }
  }
});

export type TravelPlanCreateRequest = z.infer<typeof travelPlanCreateRequestSchema>;

/** A revision asks the planner to change the current draft, not to start over. */
export const travelPlanRevisionRequestSchema = z.object({
  feedback: z.string().trim().min(1).max(2000),
  /** The version the client is looking at; a mismatch refuses the revision. */
  expectedRevision: z.number().int().positive().optional(),
});

export type TravelPlanRevisionRequest = z.infer<typeof travelPlanRevisionRequestSchema>;

/**
 * Applying a draft either creates a new trip or writes into an existing one.
 * `tripId` is required for `existing_trip` and ignored for `new_trip`.
 */
export const travelPlanApplyRequestSchema = z
  .object({
    mode: z.enum(['new_trip', 'existing_trip']),
    tripId: z.number().int().positive().optional(),
    /** Optional title for the trip a `new_trip` apply creates. */
    title: z.string().trim().min(1).max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'existing_trip' && value.tripId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['tripId'],
        message: 'tripId is required when mode is existing_trip',
      });
    }
  });

export type TravelPlanApplyRequest = z.infer<typeof travelPlanApplyRequestSchema>;

/** Discarding keeps the row for the audit trail; the reason is optional. */
export const travelPlanDiscardRequestSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type TravelPlanDiscardRequest = z.infer<typeof travelPlanDiscardRequestSchema>;

/** Undoing an apply keeps the plan row; the reason is optional, as on discard. */
export const travelPlanUndoRequestSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type TravelPlanUndoRequest = z.infer<typeof travelPlanUndoRequestSchema>;
