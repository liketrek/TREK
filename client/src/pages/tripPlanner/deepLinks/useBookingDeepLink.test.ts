import { renderHook } from '@testing-library/react';
import type { Reservation } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';

import type { DeepLinkProps } from './deepLinkTypes';
import { useBookingDeepLink } from './useBookingDeepLink';

/**
 * FE-PLANNER-BOOKLINK-001 to FE-PLANNER-BOOKLINK-003
 *
 * The desktop planner's way into a booking the chat points at: its detail, or
 * its route drawn on the plan, a route already drawn left as it is and its
 * departure day picked.
 */

const FLIGHT = { id: 7, trip_id: 5, type: 'flight', day_id: 31 } as Reservation;

function setup(query: string, onMap = false) {
  const searchParams = new URLSearchParams(query);
  const setSearchParams = vi.fn((update: (params: URLSearchParams) => URLSearchParams) => update(searchParams));
  const planner = {
    tripId: 5,
    reservations: [FLIGHT],
    isLoading: false,
    trip: { id: 5 },
    openBookingDetail: vi.fn(),
    showBookingOnMap: vi.fn(),
    isBookingOnMap: vi.fn(() => onMap),
    handleSelectDay: vi.fn(),
  };
  renderHook(() =>
    useBookingDeepLink({
      planner: planner as unknown as DeepLinkProps['planner'],
      workspace: {} as DeepLinkProps['workspace'],
      searchParams,
      setSearchParams: setSearchParams as never,
    })
  );
  return { planner, searchParams };
}

describe('useBookingDeepLink', () => {
  it('FE-PLANNER-BOOKLINK-001: ?booking= opens the booking detail and leaves the URL', () => {
    const { planner, searchParams } = setup('booking=7');
    expect(planner.openBookingDetail).toHaveBeenCalledWith(FLIGHT);
    expect(planner.showBookingOnMap).not.toHaveBeenCalled();
    expect(searchParams.has('booking')).toBe(false);
  });

  it('FE-PLANNER-BOOKLINK-002: with map=1 the route is drawn on the plan', () => {
    const { planner } = setup('booking=7&map=1');
    expect(planner.showBookingOnMap).toHaveBeenCalledWith(FLIGHT);
    expect(planner.openBookingDetail).not.toHaveBeenCalled();
  });

  it('FE-PLANNER-BOOKLINK-003: a route already drawn is not switched off again; the plan goes to its day', () => {
    const { planner, searchParams } = setup('booking=7&map=1', true);
    expect(planner.showBookingOnMap).not.toHaveBeenCalled();
    expect(planner.handleSelectDay).toHaveBeenCalledWith(31);
    expect(searchParams.has('map')).toBe(false);
  });
});
