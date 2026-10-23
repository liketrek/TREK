import { listAccommodationsRequestSchema, listReservationsRequestSchema } from './reservation-read.schema';

import { describe, expect, it } from 'vitest';

describe('listReservationsRequestSchema', () => {
  it('RESREAD-001: takes a trip alone, a kind filter and a day', () => {
    expect(listReservationsRequestSchema.safeParse({ tripId: 3 }).success).toBe(true);
    expect(listReservationsRequestSchema.safeParse({ tripId: 3, kinds: ['transport'], dayId: 9 }).success).toBe(true);
    expect(listReservationsRequestSchema.safeParse({ tripId: 3, kinds: ['booking', 'transport'] }).success).toBe(true);
  });

  it('RESREAD-002: refuses an unknown kind, an empty kind list, a bad id and a missing trip', () => {
    expect(listReservationsRequestSchema.safeParse({ tripId: 3, kinds: ['hotel'] }).success).toBe(false);
    expect(listReservationsRequestSchema.safeParse({ tripId: 3, kinds: [] }).success).toBe(false);
    expect(listReservationsRequestSchema.safeParse({ tripId: 3, dayId: 0 }).success).toBe(false);
    expect(listReservationsRequestSchema.safeParse({ kinds: ['booking'] }).success).toBe(false);
  });
});

describe('listAccommodationsRequestSchema', () => {
  it('RESREAD-003: takes the trip and nothing else is required', () => {
    expect(listAccommodationsRequestSchema.safeParse({ tripId: 3 }).success).toBe(true);
    expect(listAccommodationsRequestSchema.safeParse({ tripId: -1 }).success).toBe(false);
  });
});
