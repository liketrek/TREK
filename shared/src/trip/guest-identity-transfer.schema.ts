import { z } from 'zod';

export const guestIdentityTransferImpactSchema = z.object({
  expenses: z.number().int().nonnegative(),
  payments: z.number().int().nonnegative(),
  itinerary: z.number().int().nonnegative(),
  bookings: z.number().int().nonnegative(),
  todos: z.number().int().nonnegative(),
  packing: z.number().int().nonnegative(),
  ratings: z.number().int().nonnegative(),
  rating_overlaps: z.number().int().nonnegative(),
});
export type GuestIdentityTransferImpact = z.infer<typeof guestIdentityTransferImpactSchema>;

export const guestIdentityTransferConflictTypeSchema = z.enum([
  'expense_share_overlap',
  'expense_payer_overlap',
  'ticket_participant_overlap',
  'settlement_self_payment',
  'invalid_ticket_json',
]);
export type GuestIdentityTransferConflictType = z.infer<typeof guestIdentityTransferConflictTypeSchema>;

export const guestIdentityTransferConflictSchema = z.object({
  type: guestIdentityTransferConflictTypeSchema,
  record_id: z.number().int().positive(),
});
export type GuestIdentityTransferConflict = z.infer<typeof guestIdentityTransferConflictSchema>;

export const guestIdentityTransferCandidateSchema = z.object({
  guest_user_id: z.number().int().positive(),
  name: z.string().min(1),
  impact: guestIdentityTransferImpactSchema,
  conflicts: z.array(guestIdentityTransferConflictSchema),
});
export type GuestIdentityTransferCandidate = z.infer<typeof guestIdentityTransferCandidateSchema>;

export const guestIdentityTransferCandidatesResponseSchema = z.object({
  candidates: z.array(guestIdentityTransferCandidateSchema),
});
export type GuestIdentityTransferCandidatesResponse = z.infer<typeof guestIdentityTransferCandidatesResponseSchema>;

export const newMemberIdentityCheckResponseSchema = guestIdentityTransferCandidatesResponseSchema.extend({
  required: z.boolean(),
});
export type NewMemberIdentityCheckResponse = z.infer<typeof newMemberIdentityCheckResponseSchema>;

export const newMemberIdentityCheckCompletionResponseSchema = z.object({ success: z.literal(true) });
export type NewMemberIdentityCheckCompletionResponse = z.infer<typeof newMemberIdentityCheckCompletionResponseSchema>;

export const guestIdentityTransferResponseSchema = z.object({
  success: z.literal(true),
  transferred_guest_user_id: z.number().int().positive(),
  impact: guestIdentityTransferImpactSchema,
});
export type GuestIdentityTransferResponse = z.infer<typeof guestIdentityTransferResponseSchema>;
