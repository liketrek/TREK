// FE-NATIVE-WIDGETFLIGHT-001 to FE-NATIVE-WIDGETFLIGHT-008
import type { FlightLiveLeg } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { pickWidgetLeg, widgetFlight } from './widgetFlight';
import { liveFlightOf } from './widgets';

const DEP = Date.parse('2026-06-11T11:50:00Z');
const ARR = Date.parse('2026-06-11T20:35:00Z');
const H = 3_600_000;
const CLOCK = { locale: 'en-GB', timeFormat: '24h' };

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
    scheduled_departure: new Date(DEP).toISOString(),
    scheduled_arrival: new Date(ARR).toISOString(),
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

describe('pickWidgetLeg', () => {
  it('FE-NATIVE-WIDGETFLIGHT-001: prefers the flight in the air', () => {
    const ahead = leg({ reservation_id: 7 });
    const flying = leg({ reservation_id: 8, phase: 'airborne' });
    expect(pickWidgetLeg([ahead, flying], DEP)?.reservation_id).toBe(8);
  });

  it('FE-NATIVE-WIDGETFLIGHT-002: takes the earliest within a week and drops one more than two hours landed', () => {
    const later = leg({
      reservation_id: 9,
      scheduled_departure: new Date(DEP + 48 * H).toISOString(),
      scheduled_arrival: new Date(ARR + 48 * H).toISOString(),
    });
    expect(pickWidgetLeg([later, leg()], DEP - H)?.reservation_id).toBe(6);
    expect(pickWidgetLeg([leg()], ARR + 3 * H)).toBeNull();
    expect(pickWidgetLeg([leg()], DEP - 8 * 24 * H)).toBeNull();
  });
});

describe('widgetFlight', () => {
  it('FE-NATIVE-WIDGETFLIGHT-003: sends the schedule in seconds and the clock at each airport', () => {
    const flight = widgetFlight([leg()], DEP - H, '/trips/1', CLOCK);
    expect(flight).toMatchObject({
      number: 'LH 400',
      from: 'FRA',
      to: 'JFK',
      dep: DEP / 1000,
      arr: ARR / 1000,
      depTime: '13:50',
      arrTime: '16:35',
      path: '/trips/1?booking=6',
    });
    expect(flight?.arrExpected).toBeUndefined();
    expect(flight?.landed).toBeUndefined();
  });

  it('FE-NATIVE-WIDGETFLIGHT-004: adds what the feed observed while the flight is in the air', () => {
    const flight = widgetFlight(
      [
        leg({
          phase: 'airborne',
          departed_at: new Date(DEP + 20 * 60_000).toISOString(),
          estimated_arrival: new Date(ARR + 15 * 60_000).toISOString(),
          arrival_delay_min: 15,
          aircraft: { registration: 'D-AIXA', type: 'A359' },
          last_seen_at: new Date(DEP + 2 * H).toISOString(),
        }),
      ],
      DEP + 2 * H,
      '/trips/1',
      CLOCK
    );
    expect(flight).toMatchObject({
      depActual: (DEP + 20 * 60_000) / 1000,
      arrExpected: (ARR + 15 * 60_000) / 1000,
      arrTimeExpected: '16:50',
      delay: 15,
      aircraft: 'A359 D-AIXA',
    });
  });

  it('FE-NATIVE-WIDGETFLIGHT-005: says landed once touched down, and nothing without a flight', () => {
    expect(
      widgetFlight([leg({ phase: 'landed', landed_at: new Date(ARR).toISOString() })], ARR + H, '/trips/1', CLOCK)
        ?.landed
    ).toBe(true);
    expect(widgetFlight([], DEP, '/trips/1', CLOCK)).toBeUndefined();
  });
});

describe('liveFlightOf', () => {
  it('FE-NATIVE-WIDGETFLIGHT-006: holds the Live Activity from three hours before take-off to an hour after touchdown', () => {
    const flight = widgetFlight([leg()], DEP - H, '/trips/1', CLOCK);
    const at = (ms: number) => liveFlightOf(flight, ms / 1000);
    expect(at(DEP - 4 * H)).toBeUndefined();
    expect(at(DEP - 2 * H)).toMatchObject({
      number: 'LH 400',
      from: 'FRA',
      to: 'JFK',
      depTime: '13:50',
      arrTime: '16:35',
    });
    expect(at(ARR + 2 * H)).toBeUndefined();
    expect(liveFlightOf({ ...(flight as NonNullable<typeof flight>), landed: true }, (DEP + H) / 1000)).toBeUndefined();
    expect(liveFlightOf(undefined, DEP / 1000)).toBeUndefined();
  });
});

describe('widget phase', () => {
  it('FE-NATIVE-WIDGETFLIGHT-007: a late departure goes along as the expected one, and the flight in the air says so', () => {
    const late = widgetFlight([leg({ departure_delay_min: 40 })], DEP, '/trips/1', CLOCK);
    expect(late?.depExpected).toBe(DEP / 1000 + 40 * 60);
    expect(late?.airborne).toBeUndefined();
    expect(widgetFlight([leg({ phase: 'airborne' })], DEP + H, '/trips/1', CLOCK)?.airborne).toBe(true);
    expect(liveFlightOf(late, DEP / 1000)?.dep).toBe(DEP / 1000 + 40 * 60);
  });

  it('FE-NATIVE-WIDGETFLIGHT-008: a flight the feed lost in the air stops being picked two hours after arrival', () => {
    expect(pickWidgetLeg([leg({ phase: 'airborne' })], ARR + 3 * H)).toBeNull();
  });
});
