// FE-FLIGHTLIVE-MODEL-001 to FE-FLIGHTLIVE-MODEL-012 (011 retired with the great-circle helper)
import type { FlightLiveLeg } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { airportTime, currentLeg, delayTone, flightLiveView, splitDuration, toMs } from './flightLiveModel';

const DEP = Date.parse('2026-06-11T11:50:00Z');
const ARR = Date.parse('2026-06-11T20:35:00Z');
const H = 3_600_000;

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
    distance_total_km: 6200,
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

describe('flightLiveView', () => {
  it('FE-FLIGHTLIVE-MODEL-001: counts down to departure while it is more than three hours away', () => {
    const view = flightLiveView(leg(), DEP - 5 * H);
    expect(view.stage).toBe('upcoming');
    expect(view.countdownMs).toBe(5 * H);
    expect(view.progress).toBe(0);
  });

  it('FE-FLIGHTLIVE-MODEL-002: turns to soon within three hours of departure', () => {
    expect(flightLiveView(leg(), DEP - 2 * H).stage).toBe('soon');
  });

  it('FE-FLIGHTLIVE-MODEL-003: reads progress, the estimate and the countdown to landing in the air', () => {
    const view = flightLiveView(
      leg({
        phase: 'airborne',
        departed_at: new Date(DEP + 24 * 60_000).toISOString(),
        estimated_arrival: new Date(ARR + 16 * 60_000).toISOString(),
        progress: 0.42,
        departure_delay_min: 24,
        arrival_delay_min: 16,
      }),
      DEP + 3 * H
    );
    expect(view.stage).toBe('airborne');
    expect(view.progress).toBe(0.42);
    expect(view.arrExpected).toBe(ARR + 16 * 60_000);
    expect(view.arrIsEstimate).toBe(true);
    expect(view.countdownMs).toBe(ARR + 16 * 60_000 - (DEP + 3 * H));
  });

  it('FE-FLIGHTLIVE-MODEL-004: places a stale aircraft by the clock when the feed gave no progress', () => {
    const view = flightLiveView(leg({ phase: 'airborne', stale: true }), DEP + (ARR - DEP) / 2);
    expect(view.progress).toBeCloseTo(0.5, 5);
    expect(view.stale).toBe(true);
  });

  it('FE-FLIGHTLIVE-MODEL-005: a landed flight is full and its arrival is no longer an estimate', () => {
    const view = flightLiveView(leg({ phase: 'landed', landed_at: new Date(ARR + 5 * 60_000).toISOString() }), ARR + H);
    expect(view.stage).toBe('landed');
    expect(view.progress).toBe(1);
    expect(view.arrIsEstimate).toBe(false);
    expect(view.countdownMs).toBeNull();
  });

  it('FE-FLIGHTLIVE-MODEL-006: a schedule long over without any sighting reads as past', () => {
    expect(flightLiveView(leg(), ARR + 2 * H).stage).toBe('past');
  });

  it('FE-FLIGHTLIVE-MODEL-007: passes unknown through, a callsign the feed never heard', () => {
    expect(flightLiveView(leg({ phase: 'unknown' }), DEP + H).stage).toBe('unknown');
  });
});

describe('helpers', () => {
  it('FE-FLIGHTLIVE-MODEL-008: grades delays as on time, minor and major', () => {
    expect(delayTone(null)).toBe('ok');
    expect(delayTone(5)).toBe('ok');
    expect(delayTone(12)).toBe('minor');
    expect(delayTone(30)).toBe('major');
  });

  it('FE-FLIGHTLIVE-MODEL-009: rounds a duration up to the next minute and splits it', () => {
    expect(splitDuration(61_000)).toEqual({ days: 0, hours: 0, minutes: 2 });
    expect(splitDuration(26 * H + 5 * 60_000)).toEqual({ days: 1, hours: 2, minutes: 5 });
  });

  it('FE-FLIGHTLIVE-MODEL-010: tells the clock at the airport, in 24 or 12 hours, and survives a bad zone', () => {
    expect(airportTime(DEP, 'Europe/Berlin', 'en-GB', '24h')).toBe('13:50');
    expect(airportTime(DEP, 'America/New_York', 'en-US', '12h')).toMatch(/7:50\s?AM/);
    expect(() => airportTime(DEP, 'Not/AZone', 'en-GB', '24h')).not.toThrow();
    expect(toMs('nonsense')).toBeNull();
  });

  it('FE-FLIGHTLIVE-MODEL-012: picks the leg a summary speaks for', () => {
    const first = leg({ leg_index: 0, phase: 'landed', landed_at: new Date(ARR).toISOString() });
    const second = leg({
      leg_index: 1,
      scheduled_departure: new Date(ARR + 2 * H).toISOString(),
      scheduled_arrival: new Date(ARR + 4 * H).toISOString(),
    });
    expect(currentLeg([], ARR)).toBeNull();
    expect(currentLeg([first, second], ARR + H)?.leg_index).toBe(1);
    expect(currentLeg([first, { ...second, phase: 'airborne' }], ARR + 3 * H)?.leg_index).toBe(1);
    expect(currentLeg([first], ARR + H)?.leg_index).toBe(0);
  });
});
