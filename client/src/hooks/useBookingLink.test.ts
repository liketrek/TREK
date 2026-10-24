import { renderHook } from '@testing-library/react';
import type { Reservation } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';

import { useBookingLink } from './useBookingLink';

/**
 * FE-HOOK-BOOKLINK-001 to FE-HOOK-BOOKLINK-004
 *
 * A booking the chat points at: taken once the trip's bookings are there,
 * then dropped from the URL, an unknown one dropped without a word.
 */

const booking = (id: number, tripId = 5) => ({ id, trip_id: tripId, type: 'flight' }) as Reservation;

function setup(query: string, reservations: Reservation[], loaded: boolean) {
  const searchParams = new URLSearchParams(query);
  const setSearchParams = vi.fn((update: (params: URLSearchParams) => URLSearchParams) => update(searchParams));
  const take = vi.fn();
  const hook = renderHook(
    ({ list, done }) =>
      useBookingLink({
        searchParams,
        setSearchParams: setSearchParams as never,
        tripId: 5,
        reservations: list,
        loaded: done,
        take,
      }),
    { initialProps: { list: reservations, done: loaded } }
  );
  return { searchParams, setSearchParams, take, hook };
}

describe('useBookingLink', () => {
  it('FE-HOOK-BOOKLINK-001: opens a booking of this trip once and drops the link', () => {
    const { searchParams, take, hook } = setup('tab=transports&booking=7', [booking(7)], false);
    expect(take).toHaveBeenCalledTimes(1);
    expect(take).toHaveBeenCalledWith(booking(7), false);
    expect(searchParams.has('booking')).toBe(false);
    expect(searchParams.get('tab')).toBe('transports');
    hook.rerender({ list: [booking(7)], done: true });
    expect(take).toHaveBeenCalledTimes(1);
  });

  it('FE-HOOK-BOOKLINK-002: hands on map=1 and drops it with the link', () => {
    const { searchParams, take } = setup('booking=7&map=1', [booking(7)], true);
    expect(take).toHaveBeenCalledWith(booking(7), true);
    expect(searchParams.has('map')).toBe(false);
  });

  it("FE-HOOK-BOOKLINK-003: waits for the trip's bookings, then drops an id it does not hold", () => {
    const { searchParams, take, hook } = setup('booking=9', [booking(9, 4)], false);
    expect(searchParams.get('booking')).toBe('9');
    hook.rerender({ list: [booking(7)], done: true });
    expect(take).not.toHaveBeenCalled();
    expect(searchParams.has('booking')).toBe(false);
  });

  it('FE-HOOK-BOOKLINK-004: does nothing without a link', () => {
    const { setSearchParams, take } = setup('tab=plan', [booking(7)], true);
    expect(setSearchParams).not.toHaveBeenCalled();
    expect(take).not.toHaveBeenCalled();
  });
});
