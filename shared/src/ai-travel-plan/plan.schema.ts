import { travelPlanApplyResultSchema } from './apply-result.schema';
import { travelPlanDraftSchema } from './draft.schema';
import { travelPlanRequestSchema } from './request.schema';
import { travelPlanFactSchema, travelPlanWarningSchema } from './warnings';

import { z } from 'zod';

/**
 * The lifecycle of a plan. `expired` covers both the elapsed TTL and an
 * explicit discard: an expired plan can never be applied.
 */
export const travelPlanStatusSchema = z.enum(['draft', 'generating', 'ready', 'applied', 'expired', 'failed']);

export type TravelPlanStatus = z.infer<typeof travelPlanStatusSchema>;

/** The statuses a plan may be applied from. */
export const APPLICABLE_TRAVEL_PLAN_STATUSES: readonly TravelPlanStatus[] = ['ready'];

/** The statuses a plan may be revised or discarded from. */
export const EDITABLE_TRAVEL_PLAN_STATUSES: readonly TravelPlanStatus[] = ['draft', 'ready', 'failed'];

/** What produced a revision: the engine tag, model, token counts and cost when known. */
export const travelPlanModelMetaSchema = z.object({
  engine: z.string().trim().min(1).max(80),
  provider: z.string().trim().max(80).nullable(),
  model: z.string().trim().max(120).nullable(),
  promptTokens: z.number().int().nonnegative().nullable(),
  completionTokens: z.number().int().nonnegative().nullable(),
  costCny: z.number().nonnegative().nullable(),
});

export type TravelPlanModelMeta = z.infer<typeof travelPlanModelMetaSchema>;

/** One immutable revision of a plan's draft. */
export const travelPlanRevisionSchema = z.object({
  version: z.number().int().positive(),
  /** Why this revision exists; null for the first one. */
  reason: z.string().trim().max(2000).nullable(),
  draft: travelPlanDraftSchema,
  facts: z.array(travelPlanFactSchema),
  warnings: z.array(travelPlanWarningSchema),
  modelMeta: travelPlanModelMetaSchema,
  durationMs: z.number().int().nonnegative().nullable(),
  createdAt: z.string().nullable(),
});

export type TravelPlanRevision = z.infer<typeof travelPlanRevisionSchema>;

/** What the history list carries without shipping every revision's full draft. */
export const travelPlanRevisionSummarySchema = z.object({
  version: z.number().int().positive(),
  reason: z.string().trim().max(2000).nullable(),
  warnings: z.array(travelPlanWarningSchema),
  createdAt: z.string().nullable(),
});

export type TravelPlanRevisionSummary = z.infer<typeof travelPlanRevisionSummarySchema>;

/**
 * A plan as the API answers it: its current draft and the revision history.
 * `draft` is the current revision, not a copy stored on the plan.
 */
export const travelPlanSchema = z.object({
  id: z.number().int().positive(),
  status: travelPlanStatusSchema,
  request: travelPlanRequestSchema,
  currentRevision: z.number().int().nonnegative(),
  targetTripId: z.number().int().positive().nullable(),
  appliedTripId: z.number().int().positive().nullable(),
  /** What the apply wrote, kept for the undo; null before an apply. */
  applyResult: travelPlanApplyResultSchema.nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  draft: travelPlanDraftSchema.nullable(),
  warnings: z.array(travelPlanWarningSchema),
  revisions: z.array(travelPlanRevisionSummarySchema),
});

export type TravelPlan = z.infer<typeof travelPlanSchema>;

/**
 * OPS-01: today's generations against the per-user cap. `limit` is always
 * positive; the whole object is null when the admin turned the cap off.
 */
export const travelPlanQuotaSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type TravelPlanQuota = z.infer<typeof travelPlanQuotaSchema>;

/* -------------------------------------------------------------------------
 * REST envelopes
 *
 * These are the wire contract the client builds against. The planned Java /
 * Spring AI service, when it replaces the Nest implementation, keeps this
 * exact contract: the client must not need to know which process answered.
 * ---------------------------------------------------------------------- */

export const travelPlanResponseSchema = z.object({
  plan: travelPlanSchema,
  quota: travelPlanQuotaSchema.nullable().optional(),
});

export type TravelPlanResponse = z.infer<typeof travelPlanResponseSchema>;

export const travelPlanRevisionResponseSchema = z.object({
  plan: travelPlanSchema,
  revision: travelPlanRevisionSchema,
  quota: travelPlanQuotaSchema.nullable().optional(),
});

export type TravelPlanRevisionResponse = z.infer<typeof travelPlanRevisionResponseSchema>;

export const travelPlanApplyResponseSchema = z.object({
  plan: travelPlanSchema,
  /** The trip the draft was written into. */
  tripId: z.number().int().positive(),
});

export type TravelPlanApplyResponse = z.infer<typeof travelPlanApplyResponseSchema>;

export const travelPlanDiscardResponseSchema = z.object({ plan: travelPlanSchema });

export type TravelPlanDiscardResponse = z.infer<typeof travelPlanDiscardResponseSchema>;

/**
 * Undoing a `new_trip` apply deletes the trip that apply created and puts the
 * plan back to `ready` (or `expired` when its TTL has run out). An apply into
 * an existing trip is refused with `undo_manual_required` instead: the recorded
 * ids name exactly what a person must remove, and this endpoint never guesses.
 */
export const travelPlanUndoResponseSchema = z.object({
  plan: travelPlanSchema,
  /** The trip the apply wrote into; it is gone when `tripDeleted` is true. */
  tripId: z.number().int().positive(),
  tripDeleted: z.boolean(),
});

export type TravelPlanUndoResponse = z.infer<typeof travelPlanUndoResponseSchema>;

/* -------------------------------------------------------------------------
 * Streaming generation (PLAN-11)
 *
 * `POST /api/ai-travel-plans/stream` answers with server-sent events, each a
 * JSON document of this contract. The stream is a progress report, not the
 * source of truth: a dropped connection never cancels generation, and
 * `GET /api/ai-travel-plans/:id` returns the same plan once it is persisted.
 * ---------------------------------------------------------------------- */

export const travelPlanStreamStageSchema = z.enum(['parsing', 'places', 'weather', 'routing', 'scheduling', 'validating']);

export type TravelPlanStreamStage = z.infer<typeof travelPlanStreamStageSchema>;

export const travelPlanStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('progress'), stage: travelPlanStreamStageSchema, message: z.string().trim().max(200) }),
  /** Sent once, right after the plan row exists with status `generating`. */
  z.object({ type: z.literal('plan'), plan: travelPlanSchema }),
  z.object({ type: z.literal('done'), plan: travelPlanSchema, quota: travelPlanQuotaSchema.nullable().optional() }),
  z.object({ type: z.literal('error'), code: z.string().trim().min(1).max(80), message: z.string().trim().max(500) }),
]);

export type TravelPlanStreamEvent = z.infer<typeof travelPlanStreamEventSchema>;
