// FE-WALK-TIMES-001 to FE-WALK-TIMES-006: a city walk's walking time and stays kept apart (CW-02).
import { describe, expect, it } from 'vitest';
import { parseStay, walkTimes, walkTimesOf, withStationFields } from './stationModel';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

const cathedral: TourPlannerWaypoint = { id: 'a', lat: 48.1, lng: 11.5, role: 'start', stayMinutes: 30 };
const steer: TourPlannerWaypoint = { id: 's', lat: 48.105, lng: 11.505, role: 'via', shaping: true, stayMinutes: 99 };
const market: TourPlannerWaypoint = { id: 'b', lat: 48.11, lng: 11.51, role: 'via', stayMinutes: 0 };
const park: TourPlannerWaypoint = { id: 'c', lat: 48.13, lng: 11.53, role: 'end' };

describe('walkTimes', () => {
  it('FE-WALK-TIMES-001: adds the stays entered to the walking time and says what is not known', () => {
    expect(walkTimes([cathedral, steer, market, park], 45)).toEqual({
      walkingMinutes: 45,
      stayMinutes: 30,
      unknownStays: 1,
      stations: 3,
      totalMinutes: 75,
      partial: true,
    });
    expect(walkTimes([cathedral, market], 20)).toMatchObject({ stations: 2, totalMinutes: 50, partial: false });
  });

  it("FE-WALK-TIMES-002: the way back of a loop is its start again, so the start's stay counts once", () => {
    const back: TourPlannerWaypoint = { ...cathedral, id: 'back', role: 'end' };
    expect(walkTimes([cathedral, market, { ...park, role: 'via' }, back], 45)).toEqual({
      walkingMinutes: 45,
      stayMinutes: 30,
      unknownStays: 1,
      stations: 3,
      totalMinutes: 75,
      partial: true,
    });
  });

  it('FE-WALK-TIMES-003: 45 min of walking, a museum of 90 min and a cafe of 30 min are 2 h 45 min', () => {
    const museum: TourPlannerWaypoint = { id: 'm', lat: 48.12, lng: 11.52, role: 'via', stayMinutes: 90 };
    const cafe: TourPlannerWaypoint = { id: 'k', lat: 48.13, lng: 11.53, role: 'end', stayMinutes: 30 };
    const start: TourPlannerWaypoint = { id: 's', lat: 48.1, lng: 11.5, role: 'start', stayMinutes: 0 };
    expect(walkTimes([start, museum, cafe], 45)).toMatchObject({ totalMinutes: 165, partial: false, stations: 3 });
  });

  it('FE-WALK-TIMES-004: without a walking time the stays entered are a part of the whole, and nothing known is no total', () => {
    expect(walkTimes([cathedral, market], null)).toMatchObject({ totalMinutes: 30, partial: true });
    expect(walkTimesOf({ walkingMinutes: null, stayMinutes: 0, unknownStays: 2, stations: 2 })).toEqual({
      walkingMinutes: null,
      stayMinutes: 0,
      unknownStays: 2,
      stations: 2,
      totalMinutes: null,
      partial: false,
    });
    expect(walkTimesOf({ walkingMinutes: 40, stayMinutes: 0, unknownStays: 0, stations: 2 })).toMatchObject({
      totalMinutes: 40,
      partial: false,
    });
  });
});

describe('the station dialog model', () => {
  it('FE-WALK-TIMES-005: reads a stay as typed: empty is unknown, whole minutes up to a day are taken, the rest is not', () => {
    expect(parseStay('')).toBeNull();
    expect(parseStay('  ')).toBeNull();
    expect(parseStay('0')).toBe(0);
    expect(parseStay(' 45 ')).toBe(45);
    expect(parseStay('1440')).toBe(1440);
    for (const text of ['1441', '12.5', '-3', 'abc', '12345']) expect(parseStay(text)).toBeUndefined();
  });

  it('FE-WALK-TIMES-006: puts the edited fields on the point, each left out where it is empty', () => {
    const point: TourPlannerWaypoint = { ...cathedral, key: 'stop-a', openingHours: 'Mo-Su 09:00-18:00' };
    expect(
      withStationFields(point, { name: '  Dom  ', stayMinutes: 0, importance: 'optional', protected: false })
    ).toEqual({
      id: 'a',
      lat: 48.1,
      lng: 11.5,
      role: 'start',
      key: 'stop-a',
      openingHours: 'Mo-Su 09:00-18:00',
      name: 'Dom',
      stayMinutes: 0,
      importance: 'optional',
    });
    expect(withStationFields(point, { name: ' ', stayMinutes: null, importance: null, protected: true })).toEqual({
      id: 'a',
      lat: 48.1,
      lng: 11.5,
      role: 'start',
      key: 'stop-a',
      openingHours: 'Mo-Su 09:00-18:00',
      protected: true,
    });
  });
});
