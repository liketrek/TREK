import {
  guestIdentityTransferCandidatesResponseSchema,
  newMemberIdentityCheckCompletionResponseSchema,
  newMemberIdentityCheckResponseSchema,
  guestIdentityTransferResponseSchema,
} from './guest-identity-transfer.schema';

import { describe, expect, it } from 'vitest';

const candidate = {
  guest_user_id: 7,
  name: 'Anna',
  impact: { expenses: 2, payments: 1, itinerary: 3, todos: 4, packing: 5 },
  conflicts: [{ type: 'expense_share_overlap', record_id: 11 }],
};

describe('guest identity transfer contracts', () => {
  it('accepts candidate previews with stable impact and conflict fields', () => {
    expect(guestIdentityTransferCandidatesResponseSchema.parse({ candidates: [candidate] })).toEqual({
      candidates: [candidate],
    });
  });

  it('reports whether the new-member identity check is required', () => {
    expect(newMemberIdentityCheckResponseSchema.parse({ required: true, candidates: [candidate] }).required).toBe(true);
    expect(newMemberIdentityCheckResponseSchema.parse({ required: false, candidates: [] }).candidates).toEqual([]);
  });

  it('accepts only a successful new-member identity-check completion', () => {
    expect(newMemberIdentityCheckCompletionResponseSchema.parse({ success: true })).toEqual({ success: true });
    expect(newMemberIdentityCheckCompletionResponseSchema.safeParse({ success: false }).success).toBe(false);
  });

  it('accepts the successful irreversible identity-transfer result', () => {
    expect(
      guestIdentityTransferResponseSchema.parse({
        success: true,
        transferred_guest_user_id: 7,
        impact: candidate.impact,
      }),
    ).toEqual({ success: true, transferred_guest_user_id: 7, impact: candidate.impact });
  });
});
