// FE-STORE-FLIGHTLIVE-001 to FE-STORE-FLIGHTLIVE-007
import type { FlightLiveLeg } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listeners = new Set<(event: Record<string, unknown>) => void>();

vi.mock('../api/flightLive', () => ({ flightLiveApi: { trip: vi.fn() } }));
vi.mock('../api/websocket', () => ({
  addListener: (fn: (event: Record<string, unknown>) => void) => listeners.add(fn),
  removeListener: (fn: (event: Record<string, unknown>) => void) => listeners.delete(fn),
}));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));

import { flightLiveApi } from '../api/flightLive';
import { isEffectivelyOffline } from '../sync/networkMode';
import { legKey, useFlightLiveStore, watchFlightLive } from './flightLiveStore';

function leg(over: Partial<FlightLiveLeg> = {}): FlightLiveLeg {
  return {
    reservation_id: 6,
    leg_index: 0,
    callsign: 'DLH400',
    flight_number: 'LH 400',
    service_date: '2026-06-11',
    origin: { code: 'FRA', name: 'Frankfurt', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin' },
    destination: { code: 'JFK', name: 'New York JFK', lat: 40.64, lng: -73.78, timezone: 'America/New_York' },
    phase: 'scheduled',
    scheduled_departure: '2026-06-11T11:50:00.000Z',
    scheduled_arrival: '2026-06-11T20:35:00.000Z',
    departed_at: null,
    landed_at: null,
    estimated_arrival: null,
    departure_delay_min: null,
    arrival_delay_min: null,
    progress: null,
    distance_total_km: null,
    distance_remaining_km: null,
    position: null,
    aircraft: null,
    last_seen_at: null,
    fetched_at: null,
    stale: false,
    source: null,
    ...over,
  };
}

beforeEach(() => {
  useFlightLiveStore.setState({ trips: {} });
  listeners.clear();
  vi.mocked(flightLiveApi.trip).mockReset();
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
});

describe('flightLiveStore', () => {
  it('FE-STORE-FLIGHTLIVE-001: keeps a valid answer by leg', async () => {
    vi.mocked(flightLiveApi.trip).mockResolvedValue({ enabled: true, attribution: 'adsb.lol', flights: [leg()] });
    await useFlightLiveStore.getState().load(1);
    const trip = useFlightLiveStore.getState().trips[1];
    expect(trip.attribution).toBe('adsb.lol');
    expect(trip.legs[legKey(6, 0)].callsign).toBe('DLH400');
  });

  it('FE-STORE-FLIGHTLIVE-002: ignores a malformed answer and a failed request', async () => {
    vi.mocked(flightLiveApi.trip).mockResolvedValueOnce({ nope: true });
    await useFlightLiveStore.getState().load(1);
    vi.mocked(flightLiveApi.trip).mockRejectedValueOnce(new Error('down'));
    await useFlightLiveStore.getState().load(1);
    expect(useFlightLiveStore.getState().trips[1]).toBeUndefined();
  });

  it('FE-STORE-FLIGHTLIVE-003: asks nothing offline', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    await useFlightLiveStore.getState().load(1);
    expect(flightLiveApi.trip).not.toHaveBeenCalled();
  });

  it('FE-STORE-FLIGHTLIVE-004: merges a push for its trip only', async () => {
    vi.mocked(flightLiveApi.trip).mockResolvedValue({ enabled: true, attribution: null, flights: [leg()] });
    await useFlightLiveStore.getState().load(1);
    const stop = watchFlightLive(1);
    for (const fn of listeners) fn({ type: 'flight:live', tripId: 2, flights: [leg({ phase: 'airborne' })] });
    expect(useFlightLiveStore.getState().trips[1].legs[legKey(6, 0)].phase).toBe('scheduled');
    for (const fn of listeners)
      fn({ type: 'flight:live', tripId: 1, flights: [leg({ phase: 'airborne' }), { broken: true }] });
    expect(useFlightLiveStore.getState().trips[1].legs[legKey(6, 0)].phase).toBe('airborne');
    stop();
    expect(listeners.size).toBe(0);
  });

  it('FE-STORE-FLIGHTLIVE-005: a push for a trip never loaded is dropped', () => {
    useFlightLiveStore.getState().merge(3, [leg()]);
    expect(useFlightLiveStore.getState().trips[3]).toBeUndefined();
  });

  it('FE-STORE-FLIGHTLIVE-006: an answer with the switch off keeps no legs', async () => {
    vi.mocked(flightLiveApi.trip).mockResolvedValue({ enabled: false, attribution: null, flights: [] });
    await useFlightLiveStore.getState().load(1);
    expect(useFlightLiveStore.getState().trips[1]).toEqual({ enabled: false, attribution: null, legs: {} });
  });

  it('FE-STORE-FLIGHTLIVE-007: a read keeps a push that arrived while it was under way', async () => {
    vi.mocked(flightLiveApi.trip).mockResolvedValue({
      enabled: true,
      attribution: null,
      flights: [leg({ fetched_at: '2026-06-11T12:00:00.000Z' })],
    });
    await useFlightLiveStore.getState().load(1);
    useFlightLiveStore.getState().merge(1, [leg({ phase: 'airborne', fetched_at: '2026-06-11T12:05:00.000Z' })]);
    vi.mocked(flightLiveApi.trip).mockResolvedValue({
      enabled: true,
      attribution: null,
      flights: [leg({ fetched_at: '2026-06-11T12:01:00.000Z' })],
    });
    await useFlightLiveStore.getState().load(1);
    expect(useFlightLiveStore.getState().trips[1].legs[legKey(6, 0)].phase).toBe('airborne');
  });
});
