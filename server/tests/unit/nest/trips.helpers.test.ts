/**
 * The pure helpers of the trips domain: the date range a trip may span and the
 * feed token a trip row loses on its way out. TRIP-HELPERS-001 to 003.
 */
import { assertTripSpan, withoutFeedToken } from '../../../src/nest/trips/trips.helpers';
import { MAX_TRIP_DAYS, addIsoDays } from '@trek/shared';

import { describe, expect, it } from 'vitest';

describe('assertTripSpan', () => {
  it('TRIP-HELPERS-001: takes a range from a single day up to the limit', () => {
    const lastAllowed = addIsoDays('2025-07-01', MAX_TRIP_DAYS - 1);
    expect(() => assertTripSpan('2025-07-01', '2025-07-01')).not.toThrow();
    expect(() => assertTripSpan('2025-07-01', lastAllowed)).not.toThrow();
  });

  it('TRIP-HELPERS-002: refuses an inverted range and one past the limit', () => {
    const tooLate = addIsoDays('2025-07-01', MAX_TRIP_DAYS);
    expect(() => assertTripSpan('2025-07-02', '2025-07-01')).toThrow('End date must be after start date');
    expect(() => assertTripSpan('2025-07-01', tooLate)).toThrow(`A trip can span at most ${MAX_TRIP_DAYS} days`);
  });
});

describe('withoutFeedToken', () => {
  it('TRIP-HELPERS-003: drops feed_token from the row it was given and passes anything else through', () => {
    const row = { id: 1, title: 'Japan', feed_token: 'feed-1' };
    expect(withoutFeedToken(row)).toBe(row);
    expect(row).toEqual({ id: 1, title: 'Japan' });
    expect(row).not.toHaveProperty('feed_token');
    expect(withoutFeedToken(undefined)).toBeUndefined();
    expect(withoutFeedToken(null)).toBeNull();
    expect(withoutFeedToken(42)).toBe(42);
  });
});
