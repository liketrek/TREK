import { flightLiveLegSchema, tripFlightLiveResponseSchema } from './flight-live.schema';

import { describe, it, expect } from 'vitest';

const leg = {
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
  distance_total_km: 6200,
  distance_remaining_km: null,
  position: null,
  aircraft: null,
  last_seen_at: null,
  fetched_at: null,
  stale: false,
  source: null,
};

describe('flightLiveLegSchema', () => {
  it('accepts a leg that has not shown up yet', () => {
    expect(flightLiveLegSchema.parse(leg).phase).toBe('scheduled');
  });

  it('rejects a progress outside 0 to 1', () => {
    expect(flightLiveLegSchema.safeParse({ ...leg, progress: 1.2 }).success).toBe(false);
  });

  it('rejects an unknown phase', () => {
    expect(flightLiveLegSchema.safeParse({ ...leg, phase: 'boarding' }).success).toBe(false);
  });
});

describe('tripFlightLiveResponseSchema', () => {
  it('carries the switch, the credit line and the legs', () => {
    const parsed = tripFlightLiveResponseSchema.parse({ enabled: true, attribution: 'adsb.lol', flights: [leg] });
    expect(parsed.flights).toHaveLength(1);
  });
});
