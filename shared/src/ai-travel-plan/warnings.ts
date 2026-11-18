import { z } from 'zod';

/**
 * How strongly a warning blocks the plan:
 * - `info` — worth knowing, nothing to fix;
 * - `warning` — the plan is usable but a fact could not be checked;
 * - `blocking` — the plan must not be applied until the problem is resolved.
 */
export const travelPlanWarningSeveritySchema = z.enum(['info', 'warning', 'blocking']);

export type TravelPlanWarningSeverity = z.infer<typeof travelPlanWarningSeveritySchema>;

/**
 * One warning raised while building or revising a plan. `code` is stable for
 * the client, `message` is what the traveller reads.
 */
export const travelPlanWarningSchema = z.object({
  code: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(500),
  severity: travelPlanWarningSeveritySchema,
});

export type TravelPlanWarning = z.infer<typeof travelPlanWarningSchema>;

/**
 * Where a checked fact came from. The MVP has one provider (Amap), but the
 * shape stays provider-neutral so a second one does not change the contract.
 */
export const travelPlanSourceSchema = z.object({
  provider: z.string().trim().min(1).max(40),
  /** The provider's own id for the checked object, when it has one. */
  sourceId: z.string().trim().min(1).max(200).nullable(),
  /** When the provider was asked (`YYYY-MM-DD HH:MM:SS` UTC, db spelling). */
  checkedAt: z.string().trim().min(1).max(40),
  freshness: z.enum(['live', 'cached', 'unknown']),
});

export type TravelPlanSource = z.infer<typeof travelPlanSourceSchema>;

/** One fact the planner checked against a source (a place, a route, opening hours...). */
export const travelPlanFactSchema = z.object({
  kind: z.enum(['place', 'route', 'weather', 'hours', 'price']),
  provider: z.string().trim().min(1).max(40),
  checkedAt: z.string().trim().min(1).max(40),
  detail: z.string().trim().min(1).max(500),
});

export type TravelPlanFact = z.infer<typeof travelPlanFactSchema>;
