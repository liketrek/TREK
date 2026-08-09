import { z } from 'zod';

export const guestClaimImpactSchema = z.object({
  expenses: z.number().int().nonnegative(),
  payments: z.number().int().nonnegative(),
  itinerary: z.number().int().nonnegative(),
  todos: z.number().int().nonnegative(),
  packing: z.number().int().nonnegative(),
});
export type GuestClaimImpact = z.infer<typeof guestClaimImpactSchema>;

export const guestClaimConflictTypeSchema = z.enum([
  'expense_share_overlap',
  'expense_payer_overlap',
  'ticket_participant_overlap',
  'settlement_self_payment',
  'invalid_ticket_json',
]);
export type GuestClaimConflictType = z.infer<typeof guestClaimConflictTypeSchema>;

export const guestClaimConflictSchema = z.object({
  type: guestClaimConflictTypeSchema,
  record_id: z.number().int().positive(),
});
export type GuestClaimConflict = z.infer<typeof guestClaimConflictSchema>;

export const guestClaimCandidateSchema = z.object({
  guest_user_id: z.number().int().positive(),
  name: z.string().min(1),
  impact: guestClaimImpactSchema,
  conflicts: z.array(guestClaimConflictSchema),
});
export type GuestClaimCandidate = z.infer<typeof guestClaimCandidateSchema>;

export const guestClaimCandidatesResponseSchema = z.object({ candidates: z.array(guestClaimCandidateSchema) });
export type GuestClaimCandidatesResponse = z.infer<typeof guestClaimCandidatesResponseSchema>;

export const guestClaimPromptResponseSchema = guestClaimCandidatesResponseSchema.extend({ prompted: z.boolean() });
export type GuestClaimPromptResponse = z.infer<typeof guestClaimPromptResponseSchema>;

export const guestClaimResponseSchema = z.object({
  success: z.literal(true),
  claimed_guest_user_id: z.number().int().positive(),
  impact: guestClaimImpactSchema,
});
export type GuestClaimResponse = z.infer<typeof guestClaimResponseSchema>;
