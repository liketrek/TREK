/**
 * What positions say about a booked flight, without the airline: the phase,
 * wheels-up and touchdown, the delays and the arrival estimate, the watch
 * window and how often the feed is asked. Every clock is passed in.
 */
import {
  advance,
  closeIfOver,
  departureDelay,
  emptyState,
  failed,
  inWatchWindow,
  nextPollAt,
  observe,
  pickAircraft,
  toLiveLeg,
  watchWindow,
  type FeedAircraft,
  type LiveState,
} from '../../../../src/nest/flight-live/flight-live.derive';
import type { ScheduledLeg } from '../../../../src/nest/flight-live/flight-live.schedule';
import { flightLiveLegSchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const MIN = 60_000;
const DEP = Date.parse('2026-07-01T10:00:00Z');
const ARR = Date.parse('2026-07-01T11:10:00Z');

const LEG: ScheduledLeg = {
  reservation_id: 10,
  trip_id: 3,
  leg_index: 0,
  callsign: 'DLH100',
  flight_number: 'LH 100',
  service_date: '2026-07-01',
  origin: { code: 'FRA', name: 'Frankfurt', lat: 50.0333, lng: 8.5706, timezone: 'Europe/Berlin' },
  destination: { code: 'TXL', name: 'Berlin', lat: 52.3667, lng: 13.5033, timezone: 'Europe/Berlin' },
  scheduled_departure: DEP,
  scheduled_arrival: ARR,
};

function ac(overrides: Partial<FeedAircraft> = {}): FeedAircraft {
  return {
    hex: '3c6444',
    flight: 'DLH100',
    registration: 'D-AINA',
    type: 'A20N',
    alt_baro: 'ground',
    alt_geom: null,
    gs: 12,
    track: 90,
    baro_rate: null,
    geom_rate: null,
    lat: 50.035,
    lon: 8.56,
    seen: 1,
    seen_pos: 2,
    ...overrides,
  };
}

const start = emptyState('DLH100', '2026-07-01', 'FRA', 'TXL');

describe('the watch window', () => {
  it('FLDER-001: runs from three hours before departure to two after arrival, or 16 h of flight without one', () => {
    expect(watchWindow(LEG)).toEqual({ start: DEP - 180 * MIN, end: ARR + 120 * MIN });
    expect(watchWindow({ scheduled_departure: DEP, scheduled_arrival: null })).toEqual({
      start: DEP - 180 * MIN,
      end: DEP + 18 * 60 * MIN,
    });
    expect(watchWindow({ scheduled_departure: null, scheduled_arrival: ARR })).toBeNull();
    expect(inWatchWindow(LEG, DEP - 181 * MIN)).toBe(false);
    expect(inWatchWindow(LEG, DEP - 179 * MIN)).toBe(true);
    expect(inWatchWindow(LEG, ARR + 121 * MIN)).toBe(false);
    expect(inWatchWindow({ scheduled_departure: null, scheduled_arrival: null }, DEP)).toBe(false);
  });
});

describe('pickAircraft and observe', () => {
  it('FLDER-002: picks the aircraft nearest the route, one without a position last', () => {
    const near = ac({ hex: 'near', lat: 51.2, lon: 11 });
    const far = ac({ hex: 'far', lat: 40, lon: -3 });
    const blind = ac({ hex: 'blind', lat: null, lon: null });
    expect(pickAircraft([blind, far, near], LEG)?.hex).toBe('near');
    expect(pickAircraft([blind], LEG)?.hex).toBe('blind');
    expect(pickAircraft([], LEG)).toBeNull();
  });

  it('FLDER-003: reads a report at its own time, on the ground at zero feet, the geometric height as a fallback', () => {
    const now = DEP;
    expect(observe(ac(), now)).toEqual({
      position: {
        lat: 50.035,
        lng: 8.56,
        altitude_ft: 0,
        ground_speed_kt: 12,
        track_deg: 90,
        vertical_rate_fpm: null,
        on_ground: true,
      },
      positionAt: now - 2000,
      heardAt: now - 1000,
    });
    const air = observe(ac({ alt_baro: null, alt_geom: 3200, geom_rate: 1500, seen_pos: null, seen: null }), now);
    expect(air?.position.altitude_ft).toBe(3200);
    expect(air?.position.vertical_rate_fpm).toBe(1500);
    expect(air?.positionAt).toBe(now);
    expect(observe(ac({ lat: null }), now)).toBeNull();
  });
});

describe('advance', () => {
  it('FLDER-004: on the ground at the origin is taxiing, first and last heard set', () => {
    const next = advance(start, ac(), LEG, DEP - 10 * MIN, 'adsb.lol');
    expect(next).toMatchObject({
      phase: 'taxiing',
      departed_at: null,
      first_seen_at: DEP - 10 * MIN - 1000,
      last_seen_at: DEP - 10 * MIN - 1000,
      registration: 'D-AINA',
      aircraft_type: 'A20N',
      source: 'adsb.lol',
      fetched_at: DEP - 10 * MIN,
      fail_count: 0,
    });
  });

  it('FLDER-005: the first airborne report low near the origin is wheels-up; a later one keeps it', () => {
    const now = DEP + 12 * MIN;
    const climbing = advance(start, ac({ alt_baro: 4000, lat: 50.1, lon: 8.7, gs: 220 }), LEG, now, 'adsb.lol');
    expect(climbing.phase).toBe('airborne');
    expect(climbing.departed_at).toBe(now - 2000);
    const high = ac({ alt_baro: 36000, lat: 51.2, lon: 11, gs: 450 });
    const cruising = advance(climbing, high, LEG, now + 10 * MIN, 'adsb.fi');
    expect(cruising.departed_at).toBe(now - 2000);
    expect(cruising.source).toBe('adsb.fi');
  });

  it('FLDER-006: first seen high or far from the origin leaves wheels-up unknown', () => {
    const high = advance(start, ac({ alt_baro: 30000, lat: 50.1, lon: 8.7 }), LEG, DEP + 30 * MIN, 'adsb.lol');
    expect(high).toMatchObject({ phase: 'airborne', departed_at: null });
    const far = advance(start, ac({ alt_baro: 8000, lat: 51.5, lon: 12 }), LEG, DEP + 30 * MIN, 'adsb.lol');
    expect(far.departed_at).toBeNull();
  });

  it('FLDER-007: back on the ground near the destination after flying is landed, once', () => {
    const flying = advance(start, ac({ alt_baro: 5000, lat: 50.1, lon: 8.7 }), LEG, DEP + 10 * MIN, 'adsb.lol');
    const down = advance(flying, ac({ lat: 52.37, lon: 13.5 }), LEG, ARR, 'adsb.lol');
    expect(down.phase).toBe('landed');
    expect(down.landed_at).toBe(ARR - 2000);
    const later = advance(down, ac({ lat: 52.37, lon: 13.5 }), LEG, ARR + 10 * MIN, 'adsb.lol');
    expect(later.landed_at).toBe(ARR - 2000);
    expect(later.position).toEqual(down.position);
  });

  it('FLDER-008: on the ground somewhere else after flying is a landing too, a diversion', () => {
    const flying = { ...start, phase: 'airborne' as const };
    expect(advance(flying, ac({ lat: 48.35, lon: 11.79 }), LEG, ARR, 'adsb.lol').phase).toBe('landed');
    expect(advance(start, ac({ lat: 48.35, lon: 11.79 }), LEG, ARR, 'adsb.lol').phase).toBe('taxiing');
  });

  it('FLDER-008b: first seen down at the destination is landed after the departure time, not before', () => {
    const atBerlin = ac({ lat: 52.37, lon: 13.5 });
    expect(advance(start, atBerlin, LEG, ARR, 'adsb.lol')).toMatchObject({ phase: 'landed', landed_at: ARR - 2000 });
    expect(advance(start, atBerlin, LEG, DEP - 30 * MIN, 'adsb.lol').phase).toBe('taxiing');
  });

  it('FLDER-009: lost low near the destination and silent ten minutes is landed at its last report', () => {
    const lastSeen = ARR - 15 * MIN;
    const position = {
      lat: 52.3,
      lng: 13.4,
      altitude_ft: 2500,
      ground_speed_kt: 160,
      track_deg: 80,
      vertical_rate_fpm: -700,
      on_ground: false,
    };
    const flying: LiveState = { ...start, phase: 'airborne', first_seen_at: DEP, last_seen_at: lastSeen, position };
    expect(advance(flying, null, LEG, lastSeen + 5 * MIN, 'adsb.lol').phase).toBe('airborne');
    const down = advance(flying, null, LEG, lastSeen + 10 * MIN, 'adsb.lol');
    expect(down).toMatchObject({ phase: 'landed', landed_at: lastSeen });
    const high = { ...flying, position: { ...position, altitude_ft: 20000 } };
    expect(advance(high, null, LEG, lastSeen + 30 * MIN, 'adsb.lol').phase).toBe('airborne');
  });

  it('FLDER-010: never heard two hours after departure is unknown; earlier it stays scheduled', () => {
    expect(advance(start, null, LEG, DEP + 119 * MIN, 'adsb.lol').phase).toBe('scheduled');
    expect(advance(start, null, LEG, DEP + 120 * MIN, 'adsb.lol').phase).toBe('unknown');
    const seen = { ...start, first_seen_at: DEP - 30 * MIN, phase: 'taxiing' as const };
    expect(advance(seen, null, LEG, DEP + 180 * MIN, 'adsb.lol').phase).toBe('taxiing');
  });

  it('FLDER-011: a failure counts and keeps the state', () => {
    const once = failed({ ...start, phase: 'taxiing' });
    expect(once).toMatchObject({ phase: 'taxiing', fail_count: 1 });
    expect(failed(once).fail_count).toBe(2);
  });
});

describe('nextPollAt', () => {
  it('FLDER-012: every 10 minutes until 40 before departure, then every 2 until airborne', () => {
    expect(nextPollAt(start, LEG, DEP - 170 * MIN)).toBe(DEP - 160 * MIN);
    expect(nextPollAt(start, LEG, DEP - 45 * MIN)).toBe(DEP - 40 * MIN);
    expect(nextPollAt(start, LEG, DEP - 41 * MIN)).toBe(DEP - 39 * MIN);
    expect(nextPollAt({ ...start, phase: 'taxiing' }, LEG, DEP + 5 * MIN)).toBe(DEP + 7 * MIN);
  });

  it('FLDER-013: airborne every 3 minutes, every 6 when more than two hours from both airports', () => {
    const position = {
      lat: 51.2,
      lng: 11,
      altitude_ft: 36000,
      ground_speed_kt: 450,
      track_deg: 60,
      vertical_rate_fpm: 0,
      on_ground: false,
    };
    const flying: LiveState = { ...start, phase: 'airborne', position };
    expect(nextPollAt(flying, LEG, DEP + 30 * MIN)).toBe(DEP + 33 * MIN);
    const longHaul = { ...LEG, destination: { ...LEG.destination, lat: 35.55, lng: 139.78 }, scheduled_arrival: null };
    const midway = { ...flying, position: { ...position, lat: 60, lng: 70 } };
    expect(nextPollAt(midway, longHaul, DEP + 300 * MIN)).toBe(DEP + 306 * MIN);
    expect(nextPollAt({ ...flying, position: null }, LEG, DEP + 30 * MIN)).toBe(DEP + 33 * MIN);
  });

  it('FLDER-014: unknown or failing every 15 minutes; landed or past the window stops', () => {
    expect(nextPollAt({ ...start, phase: 'unknown' }, LEG, DEP + 130 * MIN)).toBe(DEP + 145 * MIN);
    expect(nextPollAt({ ...start, fail_count: 3 }, LEG, DEP)).toBe(DEP + 15 * MIN);
    expect(nextPollAt({ ...start, phase: 'landed' }, LEG, ARR)).toBeNull();
    expect(nextPollAt(start, LEG, ARR + 121 * MIN)).toBeNull();
    expect(nextPollAt(start, { ...LEG, scheduled_departure: null }, DEP)).toBeNull();
  });
});

describe('toLiveLeg and departureDelay', () => {
  it('FLDER-015: without a state the schedule answers: scheduled, unknown late in the window, scheduled after it', () => {
    const before = toLiveLeg(LEG, null, DEP - 24 * 60 * MIN);
    expect(flightLiveLegSchema.parse(before)).toEqual(before);
    expect(before).toMatchObject({
      phase: 'scheduled',
      scheduled_departure: '2026-07-01T10:00:00.000Z',
      scheduled_arrival: '2026-07-01T11:10:00.000Z',
      progress: 0,
      distance_remaining_km: before.distance_total_km,
      position: null,
      aircraft: null,
      source: null,
      stale: false,
    });
    expect(before.distance_total_km).toBeGreaterThan(400);
    expect(toLiveLeg(LEG, null, DEP + 130 * MIN).phase).toBe('unknown');
    // Past its window the client tells a past flight from its times; nothing claims a landing nobody saw.
    const after = toLiveLeg(LEG, null, ARR + 3 * 60 * MIN);
    expect(after).toMatchObject({ phase: 'scheduled', progress: 0, landed_at: null });
    expect(after.distance_remaining_km).toBe(after.distance_total_km);
  });

  it('FLDER-016: airborne answers its estimate from ground speed with the approach buffer and the delays', () => {
    const now = DEP + 40 * MIN;
    const position = {
      lat: 52.3667,
      lng: 10.5,
      altitude_ft: 36000,
      ground_speed_kt: 405,
      track_deg: 90,
      vertical_rate_fpm: 0,
      on_ground: false,
    };
    const state: LiveState = {
      ...start,
      phase: 'airborne',
      departed_at: DEP + 20 * MIN,
      first_seen_at: DEP,
      last_seen_at: now,
      fetched_at: now,
      registration: 'D-AINA',
      source: 'adsb.lol',
      position,
    };
    const live = toLiveLeg(LEG, state, now);
    expect(flightLiveLegSchema.parse(live)).toEqual(live);
    expect(live.departure_delay_min).toBe(20);
    expect(live.departed_at).toBe('2026-07-01T10:20:00.000Z');
    expect(live.aircraft).toEqual({ registration: 'D-AINA', type: null });
    expect(live.progress).toBeGreaterThan(0.3);
    expect(live.progress).toBeLessThan(1);
    // About 204 km left at 750 km/h is 16 minutes, plus 8 for the approach.
    const eta = Date.parse(live.estimated_arrival ?? '');
    expect(Math.round((eta - now) / MIN)).toBe(24);
    expect(live.arrival_delay_min).toBe(Math.round((eta - ARR) / MIN));
    expect(live.stale).toBe(false);
    expect(toLiveLeg(LEG, state, now + 11 * MIN).stale).toBe(true);
    const slow = { ...state, position: { ...position, ground_speed_kt: 120 } };
    expect(toLiveLeg(LEG, slow, now).estimated_arrival).toBeNull();
  });

  it('FLDER-017: landed answers its touchdown and the arrival delay from it', () => {
    const state: LiveState = { ...start, phase: 'landed', landed_at: ARR + 25 * MIN, fetched_at: ARR + 30 * MIN };
    const live = toLiveLeg(LEG, state, ARR + 30 * MIN);
    expect(live).toMatchObject({
      phase: 'landed',
      landed_at: '2026-07-01T11:35:00.000Z',
      arrival_delay_min: 25,
      distance_remaining_km: 0,
      progress: 1,
      estimated_arrival: null,
    });
  });

  it('FLDER-018: the departure delay comes from wheels-up, or from a recent report still at the gate past the time', () => {
    expect(departureDelay(LEG, { ...start, departed_at: DEP + 17 * MIN }, DEP + 30 * MIN)).toBe(17);
    const atGate = { ...start, phase: 'taxiing' as const, last_seen_at: DEP + 16 * MIN };
    expect(departureDelay(LEG, atGate, DEP + 17 * MIN)).toBe(16);
    // Gone quiet on the ground: the last report says nothing about now.
    expect(departureDelay(LEG, atGate, DEP + 26 * MIN)).toBeNull();
    // Heard before the scheduled time: not late yet, however late it is now.
    expect(departureDelay(LEG, { ...atGate, last_seen_at: DEP - 5 * MIN }, DEP + 2 * MIN)).toBeNull();
    expect(departureDelay(LEG, { ...start, phase: 'taxiing' }, DEP + 16 * MIN)).toBeNull();
    expect(departureDelay(LEG, start, DEP + 60 * MIN)).toBeNull();
    expect(departureDelay({ ...LEG, scheduled_departure: null }, { ...start, departed_at: DEP }, DEP)).toBeNull();
  });

  it('FLDER-019: after its window nothing is shown taxiing or in the air, and the state closes as unknown', () => {
    const after = ARR + 121 * MIN;
    const flying: LiveState = { ...start, phase: 'airborne', last_seen_at: ARR - 30 * MIN, next_poll_at: ARR };
    expect(toLiveLeg(LEG, flying, after)).toMatchObject({ phase: 'unknown', stale: false });
    expect(toLiveLeg(LEG, { ...flying, phase: 'taxiing' }, after).phase).toBe('unknown');
    expect(toLiveLeg(LEG, flying, ARR).phase).toBe('airborne');

    expect(closeIfOver(flying, LEG, after)).toMatchObject({ phase: 'unknown', next_poll_at: null });
    expect(closeIfOver(flying, LEG, ARR)).toBe(flying);
    const landed: LiveState = { ...start, phase: 'landed', landed_at: ARR };
    expect(closeIfOver(landed, LEG, after)).toBe(landed);
    expect(closeIfOver(start, LEG, after)).toBe(start);
    expect(closeIfOver(flying, { scheduled_departure: null, scheduled_arrival: null }, after)).toBe(flying);
  });
});
