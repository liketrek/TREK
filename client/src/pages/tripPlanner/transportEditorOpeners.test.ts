// FE-TP-TROPEN-001 to FE-TP-TROPEN-006
//
// The two ways from a saved transit journey into the transport editor. The planner's
// dialogs run them on their own state, the phone trip sheets on the planner's setters.
import { buildReservation } from '../../../tests/helpers/factories';
import type { Reservation } from '../../types';
import {
  changeTransitRouteWith,
  latestReservation,
  openTransportEditorWith,
  type TransportEditorSetters,
} from './transportEditorOpeners';

function buildSetters() {
  const calls: string[] = [];
  const spy = (name: string) =>
    vi.fn(() => {
      calls.push(name);
    });
  const setters = {
    setEditingTransport: spy('editing'),
    setTransportModalDayId: spy('day'),
    setTransportModalAutomated: spy('automated'),
    setTransitPrefill: spy('prefill'),
    setTransitJourney: spy('journey'),
    setShowTransportModal: spy('show'),
  } satisfies TransportEditorSetters;
  return { setters, calls };
}

const journey = {
  ...buildReservation({ id: 55, day_id: 4, type: 'transit' }),
  endpoints: [
    { role: 'from', name: 'Tokyo Sta.', lat: 35.68, lng: 139.76 },
    { role: 'to', name: 'Kyoto Sta.', lat: 34.98, lng: 135.75 },
  ],
} as unknown as Reservation;

describe('openTransportEditorWith', () => {
  it('FE-TP-TROPEN-001: opens the manual editor on the entry and drops the journey view', () => {
    const { setters, calls } = buildSetters();
    openTransportEditorWith(setters, journey);
    expect(setters.setEditingTransport).toHaveBeenCalledWith(journey);
    expect(setters.setTransportModalDayId).toHaveBeenCalledWith(4);
    expect(setters.setTransportModalAutomated).toHaveBeenCalledWith(false);
    expect(setters.setTransitPrefill).toHaveBeenCalledWith(null);
    expect(setters.setTransitJourney).toHaveBeenCalledWith(null);
    expect(setters.setShowTransportModal).toHaveBeenCalledWith(true);
    expect(calls).toEqual(['editing', 'day', 'automated', 'prefill', 'journey', 'show']);
  });

  it('FE-TP-TROPEN-002: an entry without a day opens the editor without one', () => {
    const { setters } = buildSetters();
    openTransportEditorWith(setters, { id: 9, trip_id: 1, type: 'train', title: 'Leg' } as unknown as Reservation);
    expect(setters.setTransportModalDayId).toHaveBeenCalledWith(null);
  });
});

describe('changeTransitRouteWith', () => {
  it('FE-TP-TROPEN-003: reopens the transit search seeded with both endpoints', () => {
    const { setters, calls } = buildSetters();
    changeTransitRouteWith(setters, journey);
    expect(setters.setTransitPrefill).toHaveBeenCalledWith({
      from: { name: 'Tokyo Sta.', lat: 35.68, lng: 139.76 },
      to: { name: 'Kyoto Sta.', lat: 34.98, lng: 135.75 },
    });
    expect(setters.setEditingTransport).toHaveBeenCalledWith(journey);
    expect(setters.setTransportModalDayId).toHaveBeenCalledWith(4);
    expect(setters.setTransportModalAutomated).toHaveBeenCalledWith(true);
    expect(setters.setTransitJourney).toHaveBeenCalledWith(null);
    expect(setters.setShowTransportModal).toHaveBeenCalledWith(true);
    expect(calls).toEqual(['prefill', 'editing', 'day', 'automated', 'journey', 'show']);
  });

  it('FE-TP-TROPEN-004: a journey without endpoints seeds empty prefills and no day', () => {
    const { setters } = buildSetters();
    const bare = { id: 56, trip_id: 1, type: 'transit', title: 'Unknown leg' } as unknown as Reservation;
    changeTransitRouteWith(setters, bare);
    expect(setters.setTransitPrefill).toHaveBeenCalledWith({ from: null, to: null });
    expect(setters.setTransportModalDayId).toHaveBeenCalledWith(null);
  });
});

describe('latestReservation', () => {
  it('FE-TP-TROPEN-005: prefers the store copy of the journey when it is newer', () => {
    const fresh = { ...journey, title: 'Tokyo to Kyoto (saved)' } as Reservation;
    const other = buildReservation({ id: 57, type: 'train' });
    expect(latestReservation([other, fresh], journey)).toBe(fresh);
  });

  it('FE-TP-TROPEN-006: falls back to the held journey when the store has no copy', () => {
    const other = buildReservation({ id: 57, type: 'train' });
    expect(latestReservation([other], journey)).toBe(journey);
    expect(latestReservation([], journey)).toBe(journey);
  });
});
