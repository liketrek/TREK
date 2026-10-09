// FE-PLANNER-TRANSPORTFORM-001 to -007: the transport form state behind the
// desktop TransportModal and the phone's transport sheet.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDay, buildReservation } from '../../../tests/helpers/factories';
import type { ReservationEndpoint } from '../../types';
import { EMPTY_TRANSPORT_FIELDS, emptyStationWaypoint, emptyWaypoint } from './transportEndpoints';
import { useTransportForm } from './useTransportForm';

const days = [buildDay({ id: 1, date: '2026-05-01' }), buildDay({ id: 2, date: '2026-05-02' })];
const DESKTOP_FORM = { ...EMPTY_TRANSPORT_FIELDS, url: '', meta_seat: '' };

function ep(role: 'from' | 'to' | 'stop', sequence: number, code: string | null = null): ReservationEndpoint {
  return {
    role,
    sequence,
    name: `${role}-${sequence}`,
    code,
    lat: sequence,
    lng: sequence,
    timezone: null,
    local_time: null,
    local_date: null,
  };
}

const seedOptions = {
  isEdit: true,
  fallbackType: 'transport_other' as const,
  dayId: '' as string | number,
  stopDaysFromEndpoints: false,
  resetHiddenRoutes: false,
};

describe('useTransportForm', () => {
  it('FE-PLANNER-TRANSPORTFORM-001: opens empty, and a field, a traveller and the type flag follow the edits', () => {
    const { result } = renderHook(() => useTransportForm(DESKTOP_FORM));
    expect(result.current.form).toEqual(DESKTOP_FORM);
    expect(result.current.form).not.toBe(DESKTOP_FORM);
    expect(result.current.waypoints).toEqual([emptyWaypoint(), emptyWaypoint()]);
    expect(result.current.trainWaypoints).toEqual([emptyStationWaypoint(), emptyStationWaypoint()]);
    expect(result.current.stationRoute).toBe(false);

    act(() => result.current.set('type', 'cruise'));
    act(() => result.current.set('title', 'Boat'));
    expect(result.current.form).toMatchObject({ type: 'cruise', title: 'Boat' });
    expect(result.current.stationRoute).toBe(true);

    act(() => result.current.toggleTraveler(4));
    act(() => result.current.toggleTraveler(5));
    act(() => result.current.toggleTraveler(4));
    expect([...result.current.travelerIds]).toEqual([5]);
  });

  it('FE-PLANNER-TRANSPORTFORM-002: a car stop moves one place at a time and never past either end', () => {
    const { result } = renderHook(() => useTransportForm(EMPTY_TRANSPORT_FIELDS));
    const stops = ['a', 'b', 'c'].map((name) => ({ location: { name, lat: 0, lng: 0 }, time: '' }));
    act(() => result.current.setCarStops(stops));
    act(() => result.current.moveCarStop(0, 1));
    expect(result.current.carStops.map((s) => s.location?.name)).toEqual(['b', 'a', 'c']);
    const before = result.current.carStops;
    act(() => result.current.moveCarStop(0, -1));
    act(() => result.current.moveCarStop(2, 1));
    expect(result.current.carStops).toBe(before);
  });

  it('FE-PLANNER-TRANSPORTFORM-003: a new booking starts on the given day with an empty route', () => {
    const { result } = renderHook(() => useTransportForm(DESKTOP_FORM));
    act(() => result.current.setFromPick({ location: { name: 'old', lat: 0, lng: 0 } }));
    act(() => result.current.seed(null, days, { ...seedOptions, dayId: 2 }));
    expect(result.current.form).toEqual({ ...DESKTOP_FORM, start_day_id: 2, end_day_id: 2 });
    expect(result.current.fromPick).toEqual({});
    expect(result.current.waypoints).toEqual([emptyWaypoint(2), emptyWaypoint(2)]);
    expect(result.current.trainWaypoints).toEqual([emptyStationWaypoint(2), emptyStationWaypoint(2)]);
    expect(result.current.carStops).toEqual([]);
  });

  it('FE-PLANNER-TRANSPORTFORM-004: a saved booking fills the shared fields and the ones the shell adds', () => {
    const { result } = renderHook(() => useTransportForm(DESKTOP_FORM));
    const saved = buildReservation({
      type: 'shuttle',
      title: 'Ride',
      url: 'https://ride.test',
      metadata: JSON.stringify({ seat: '7' }),
      endpoints: [ep('from', 0), ep('to', 1)],
    });
    act(() =>
      result.current.seed(saved, days, {
        ...seedOptions,
        extraFields: (src, meta) => ({ url: src.url || '', meta_seat: meta.seat || '' }),
      })
    );
    expect(result.current.form).toMatchObject({
      title: 'Ride',
      type: 'transport_other',
      url: 'https://ride.test',
      meta_seat: '7',
    });
    expect(result.current.fromPick.location?.name).toBe('from-0');
    expect(result.current.toPick.location?.name).toBe('to-1');

    act(() => result.current.seed(saved, days, { ...seedOptions, fallbackType: 'flight' }));
    expect(result.current.form.type).toBe('flight');
    expect(result.current.form).not.toHaveProperty('url');
  });

  it('FE-PLANNER-TRANSPORTFORM-005: the desktop keeps the rows a flight does not show, the phone clears them', () => {
    const flight = buildReservation({ type: 'flight', endpoints: [ep('from', 0, 'MUC'), ep('to', 1, 'BER')] });
    const picked = { location: { name: 'kept', lat: 0, lng: 0 } };

    const desktop = renderHook(() => useTransportForm(EMPTY_TRANSPORT_FIELDS)).result;
    act(() => desktop.current.setFromPick(picked));
    act(() => desktop.current.seed(flight, days, seedOptions));
    expect(desktop.current.fromPick).toBe(picked);
    expect(desktop.current.waypoints.map((w) => w.airport?.iata)).toEqual(['MUC', 'BER']);

    const phone = renderHook(() => useTransportForm(EMPTY_TRANSPORT_FIELDS)).result;
    act(() => phone.current.setFromPick(picked));
    act(() => phone.current.seed(flight, days, { ...seedOptions, resetHiddenRoutes: true }));
    expect(phone.current.fromPick).toEqual({});
  });

  it('FE-PLANNER-TRANSPORTFORM-006: a per-leg booking code is offered only with more than two picked stops', () => {
    const { result } = renderHook(() => useTransportForm(EMPTY_TRANSPORT_FIELDS));
    const airport = { iata: 'X', icao: null, name: 'X', city: '', country: '', lat: 0, lng: 0, tz: '' };
    act(() =>
      result.current.setWaypoints([{ ...emptyWaypoint(), airport }, emptyWaypoint(), { ...emptyWaypoint(), airport }])
    );
    expect(result.current.writesFlightLegs).toBe(false);
    act(() => result.current.setWaypoints((prev) => prev.map((w) => ({ ...w, airport }))));
    expect(result.current.writesFlightLegs).toBe(true);

    const station = { name: 'S', lat: 0, lng: 0 };
    expect(result.current.writesTrainLegs).toBe(false);
    act(() =>
      result.current.setTrainWaypoints([1, 2, 3].map(() => ({ ...emptyStationWaypoint(), location: station })))
    );
    expect(result.current.writesTrainLegs).toBe(true);
  });

  it('FE-PLANNER-TRANSPORTFORM-007: the payload is built from what the form holds now', () => {
    const { result } = renderHook(() => useTransportForm(EMPTY_TRANSPORT_FIELDS));
    act(() => result.current.set('type', 'bus'));
    act(() => result.current.set('title', 'Coach'));
    act(() => result.current.set('start_day_id', 1));
    act(() => result.current.setToPick({ location: { name: 'B', lat: 1, lng: 1 } }));
    const payload = result.current.payload(days, {
      reservation: null,
      prefill: null,
      budgetEnabled: false,
      anchorOnStations: true,
    });
    expect(payload).toMatchObject({ title: 'Coach', type: 'bus', day_id: 1, metadata: {} });
    expect(payload.endpoints).toEqual([
      expect.objectContaining({ role: 'to', name: 'B', sequence: 1, local_date: '2026-05-01' }),
    ]);
  });
});
