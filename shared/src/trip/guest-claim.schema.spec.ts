import {
  guestClaimCandidatesResponseSchema,
  guestClaimPromptResponseSchema,
  guestClaimResponseSchema,
} from './guest-claim.schema';

import { describe, expect, it } from 'vitest';

const candidate = {
  guest_user_id: 7,
  name: 'Anna',
  impact: { expenses: 2, payments: 1, itinerary: 3, todos: 4, packing: 5 },
  conflicts: [{ type: 'expense_share_overlap', record_id: 11 }],
};

describe('guest claim contracts', () => {
  it('accepts candidate previews with stable impact and conflict fields', () => {
    expect(guestClaimCandidatesResponseSchema.parse({ candidates: [candidate] })).toEqual({ candidates: [candidate] });
  });

  it('distinguishes a consumed first-entry prompt from the manual candidate response', () => {
    expect(guestClaimPromptResponseSchema.parse({ prompted: true, candidates: [candidate] }).prompted).toBe(true);
    expect(guestClaimPromptResponseSchema.parse({ prompted: false, candidates: [] }).candidates).toEqual([]);
  });

  it('accepts the successful irreversible claim result', () => {
    expect(
      guestClaimResponseSchema.parse({ success: true, claimed_guest_user_id: 7, impact: candidate.impact }),
    ).toEqual({ success: true, claimed_guest_user_id: 7, impact: candidate.impact });
  });
});
