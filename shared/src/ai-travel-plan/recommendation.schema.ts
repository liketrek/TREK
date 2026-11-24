import { z } from 'zod';

/**
 * Destination ideas are a pre-plan discovery step: the traveller gives a few
 * loose wishes, and gets back a short list of cities worth planning for. This
 * is not a plan and never becomes one without a separate create call.
 */
export const destinationIdeaRequestSchema = z.object({
  /** How many days the traveller expects; the budget estimate follows it. */
  days: z.number().int().min(1).max(14).optional(),
  budgetCny: z.number().nonnegative().max(1_000_000).optional(),
  /** Total travellers; children are not modelled at this stage. */
  travelers: z.number().int().min(1).max(50).optional(),
  /** 1–12; omitted means the current month. */
  month: z.number().int().min(1).max(12).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export type DestinationIdeaRequest = z.infer<typeof destinationIdeaRequestSchema>;

/** Two numbers are enough here: the full breakdown belongs to a real plan. */
export const destinationIdeaBudgetSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
});

export type DestinationIdeaBudget = z.infer<typeof destinationIdeaBudgetSchema>;

export const destinationIdeaSchema = z.object({
  /** The catalog id; stable across requests, unlike a provider place id. */
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  lat: z.number(),
  lng: z.number(),
  tier: z.number().int().min(1).max(3),
  suggestedDays: z.number().int().min(1).max(14),
  bestMonths: z.array(z.number().int().min(1).max(12)).max(12).default([]),
  /** Why this city fits the request; short, non-numeric sentences. */
  reasons: z.array(z.string().trim().min(1).max(200)).max(5).default([]),
  estimatedBudgetCny: destinationIdeaBudgetSchema,
});

export type DestinationIdea = z.infer<typeof destinationIdeaSchema>;

export const destinationIdeasResponseSchema = z.object({
  ideas: z.array(destinationIdeaSchema).max(3),
  generatedAt: z.string().trim().min(1).max(40),
  /** True when this answer was served from the short-lived cache. */
  cached: z.boolean().default(false),
});

export type DestinationIdeasResponse = z.infer<typeof destinationIdeasResponseSchema>;
