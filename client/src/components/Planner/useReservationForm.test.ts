// FE-PLANNER-RESFORMHOOK-001 to -005: the booking form state behind the desktop
// ReservationModal and the phone's booking sheet.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDay, buildPlace } from '../../../tests/helpers/factories';
import type { ReservationFields } from './reservationFormModel';
import { useReservationForm } from './useReservationForm';

const EMPTY: ReservationFields = {
  title: '',
  type: 'other',
  status: 'pending',
  reservation_time: '',
  reservation_end_time: '',
  end_date: '',
  location: '',
  confirmation_number: '',
  notes: '',
  url: '',
  place_id: '',
  accommodation_id: '',
  meta_check_in_time: '',
  meta_check_out_time: '',
  hotel_place_id: '',
  hotel_start_day: '',
  hotel_end_day: '',
  hotel_address: '',
};
const days = [buildDay({ id: 1, date: '2026-07-01' }), buildDay({ id: 2, date: '2026-07-02' })];
const places = [buildPlace({ id: 5, name: 'Castle', address: 'Hill 1' })];

describe('useReservationForm', () => {
  it('FE-PLANNER-RESFORMHOOK-001: opens on the empty form, bounded by the trip, and fields follow the edits', () => {
    const { result } = renderHook(() => useReservationForm(EMPTY, days, places));
    expect(result.current.form).toBe(EMPTY);
    expect(result.current.dateBounds).toEqual({ min: '2026-07-01', max: '2026-07-02' });
    act(() => result.current.set('title', 'Tour'));
    act(() => result.current.toggleTraveler(3));
    expect(result.current.form.title).toBe('Tour');
    expect([...result.current.travelerIds]).toEqual([3]);
    act(() => result.current.toggleTraveler(3));
    expect(result.current.travelerIds.size).toBe(0);
  });

  it('FE-PLANNER-RESFORMHOOK-002: the start date and time are set apart and the end check follows', () => {
    const { result } = renderHook(() => useReservationForm(EMPTY, days, places));
    act(() => result.current.setStartTime('09:00', '2026-07-01'));
    expect(result.current.form.reservation_time).toBe('2026-07-01T09:00');
    expect([result.current.startDate, result.current.startTime]).toEqual(['2026-07-01', '09:00']);
    act(() => result.current.setStartDate('2026-07-02'));
    expect(result.current.form.reservation_time).toBe('2026-07-02T09:00');
    expect(result.current.isEndBeforeStart).toBe(false);
    act(() => result.current.set('end_date', '2026-07-01'));
    expect(result.current.isEndBeforeStart).toBe(true);
    act(() => result.current.setStartDate(''));
    expect(result.current.form.reservation_time).toBe('');
    act(() => result.current.takeStopDay('2026-07-01'));
    expect(result.current.form.reservation_time).toBe('2026-07-01');
    act(() => result.current.takeStopDay('2026-07-02'));
    expect(result.current.form.reservation_time).toBe('2026-07-01');
  });

  it('FE-PLANNER-RESFORMHOOK-003: picking a place or a hotel fills the title and the address', () => {
    const { result } = renderHook(() => useReservationForm(EMPTY, days, places));
    act(() => result.current.pickPlace(5));
    expect(result.current.form).toMatchObject({ place_id: 5, title: 'Castle', location: 'Hill 1' });
    act(() => result.current.pickHotelPlace(5));
    expect(result.current.form).toMatchObject({ hotel_place_id: 5, hotel_address: 'Hill 1' });
  });

  it('FE-PLANNER-RESFORMHOOK-004: the stay range keeps its order in the trip', () => {
    const { result } = renderHook(() => useReservationForm(EMPTY, days, places));
    act(() => result.current.pickHotelStart(1));
    act(() => result.current.pickHotelEnd(2));
    expect(result.current.form).toMatchObject({ hotel_start_day: 1, hotel_end_day: 2 });
    act(() => result.current.pickHotelStart(2));
    expect(result.current.form).toMatchObject({ hotel_start_day: 2, hotel_end_day: 2 });
    act(() => result.current.pickHotelEnd(1));
    expect(result.current.form).toMatchObject({ hotel_start_day: 1, hotel_end_day: 1 });
  });

  it('FE-PLANNER-RESFORMHOOK-005: the save data is built from what the form holds now', () => {
    const { result } = renderHook(() => useReservationForm(EMPTY, days, places));
    act(() => result.current.set('title', 'Show'));
    act(() => result.current.setStartTime('20:00', '2026-07-02'));
    expect(result.current.saveData({ assignmentId: 4, isEdit: false, withCheckInEnd: false })).toMatchObject({
      title: 'Show',
      reservation_time: '2026-07-02T20:00',
      assignment_id: 4,
      endpoints: [],
    });
  });
});
