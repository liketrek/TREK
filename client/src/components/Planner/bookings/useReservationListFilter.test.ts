// FE-PLANNER-RESLISTFILTER-001 to -004: the traveller filter and folded sections
// of the phone's bookings and transports tabs.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDay, buildReservation } from '../../../../tests/helpers/factories';
import type { Reservation } from '../../../types';
import { useReservationListFilter } from './useReservationListFilter';

const days = [buildDay({ id: 1, date: '2026-03-01' }), buildDay({ id: 2, date: '2026-03-02' })];
const traveler = (user_id: number) => ({ user_id, username: `u${user_id}` });
const ann = buildReservation({
  id: 10,
  status: 'confirmed',
  reservation_time: '2026-03-02T09:00',
  travelers: [traveler(1)],
} as Partial<Reservation>);
const bob = buildReservation({
  id: 11,
  status: 'pending',
  reservation_time: '2026-03-01T09:00',
  travelers: [traveler(2)],
} as Partial<Reservation>);
const ride = buildReservation({ id: 12, type: 'transit', status: 'confirmed', reservation_time: '2026-03-01T07:00' });
const ALL = [ann, bob, ride];

describe('useReservationListFilter', () => {
  it('FE-PLANNER-RESLISTFILTER-001: without a filter every booking lands in its status section', () => {
    const { result } = renderHook(() => useReservationListFilter(ALL, days, 2));
    expect(result.current.travelerFilter.size).toBe(0);
    expect(result.current.groups.confirmed.map((r) => r.id)).toEqual([10]);
    expect(result.current.groups.pending.map((r) => r.id)).toEqual([11]);
    expect(result.current.groups.transit.map((r) => r.id)).toEqual([12]);
  });

  it('FE-PLANNER-RESLISTFILTER-002: choosing a traveller keeps the bookings they are on, and clearing brings all back', () => {
    const { result } = renderHook(() => useReservationListFilter(ALL, days, 2));
    act(() => result.current.toggleTravelerFilter(2));
    expect([...result.current.travelerFilter]).toEqual([2]);
    expect(result.current.groups).toEqual({ confirmed: [], pending: [bob], transit: [] });

    act(() => result.current.toggleTravelerFilter(1));
    expect(result.current.groups.confirmed.map((r) => r.id)).toEqual([10]);
    act(() => result.current.toggleTravelerFilter(2));
    expect(result.current.groups.pending).toEqual([]);

    act(() => result.current.clearTravelerFilter());
    expect(result.current.travelerFilter.size).toBe(0);
    expect(result.current.groups.transit.map((r) => r.id)).toEqual([12]);
  });

  it('FE-PLANNER-RESLISTFILTER-003: the filter is offered only with company and a booking that names a traveller', () => {
    expect(renderHook(() => useReservationListFilter(ALL, days, 2)).result.current.showTravelerFilter).toBe(true);
    expect(renderHook(() => useReservationListFilter(ALL, days, 1)).result.current.showTravelerFilter).toBe(false);
    expect(renderHook(() => useReservationListFilter([ride], days, 3)).result.current.showTravelerFilter).toBe(false);
  });

  it('FE-PLANNER-RESLISTFILTER-004: a section folds and unfolds on its own', () => {
    const { result } = renderHook(() => useReservationListFilter(ALL, days, 2));
    act(() => result.current.toggleSection('pending'));
    expect(result.current.collapsed).toEqual({ pending: true });
    act(() => result.current.toggleSection('confirmed'));
    act(() => result.current.toggleSection('pending'));
    expect(result.current.collapsed).toEqual({ pending: false, confirmed: true });
  });
});
