/**
 * CW-11: the pure half of a city walk proposed from a briefing. Walking times
 * are estimates over the straight distance, stays are only what was given,
 * an arrival after an unknown stay is the earliest one, and the opening hours
 * are read with the helpers the planner uses. The distances below run along
 * one meridian at 48 degrees north: 0.009 degrees are about 1001 metres, an
 * estimated 18 minutes on foot.
 */
import { DomainError } from '../../../src/nest/common/domain-error';
import {
  briefingCategories,
  describeWalk,
  footWayOf,
  frameOf,
  hoursCheckOf,
  legOf,
  planWalk,
  themeCandidates,
  type FootWay,
  type WalkCandidate,
  type WalkFrame,
  type WalkPlanInput,
} from '../../../src/nest/tours/city-walk-briefing.helpers';
import { TOUR_STATION_HOURS_MAX, type TourPoi } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const SUNDAY = '2026-07-12';
const FRAME: WalkFrame = { start: 10 * 60, end: 13 * 60, date: null };
/** No way from the router: the estimates time the walk. */
const UNROUTED: FootWay = { kind: 'unrouted', why: 'router_unavailable', position: null };

function candidate(source: WalkCandidate['source'], lat: number, over: Partial<WalkCandidate> = {}): WalkCandidate {
  return {
    source,
    name: null,
    lat,
    lng: 11,
    stay: null,
    placeHours: null,
    osmHours: null,
    placeId: null,
    time: null,
    find: null,
    ...over,
  };
}

const START = candidate('start', 48, { name: 'Hotel', stay: 0 });
const END = candidate('end', 48.027, { stay: 0 });
const CATHEDRAL = candidate('wished', 48.009, { name: 'Cathedral', stay: 30 });
const LUNCH = candidate('appointment', 48.018, { name: 'Lunch', stay: 60, time: 11 * 60 + 30, placeId: 7 });

function plan(over: Partial<WalkPlanInput> = {}): WalkPlanInput {
  return {
    frame: FRAME,
    start: START,
    end: END,
    appointments: [LUNCH],
    wished: [CATHEDRAL],
    tripPlaces: [],
    themes: [],
    themeLimit: 8,
    ...over,
  };
}

function poi(id: string, lat: number, over: Partial<TourPoi> = {}): TourPoi {
  return {
    id,
    name: id,
    lat,
    lng: 11.0005,
    category: 'museum',
    kind: 'tourism=museum',
    source: 'openstreetmap',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    distance_m: 40,
    along_m: 0,
    ...over,
  };
}

/** The names of the stations in their order. */
const order = (route: readonly WalkCandidate[]) => route.map((station) => station.name ?? station.source);

describe('city walk briefing helpers (CW-11)', () => {
  it('CWALK-HELP-001: the frame is read in minutes, and refused when it is backwards or an appointment lies outside', () => {
    expect(frameOf({ start_time: '10:00', end_time: '13:00' }, SUNDAY)).toEqual({ start: 600, end: 780, date: SUNDAY });
    const refusals = [
      { start_time: '13:00', end_time: '10:00' },
      { start_time: 'noon', end_time: '13:00' },
      { start_time: '10:00', end_time: 'later' },
      { start_time: '10:00', end_time: '13:00', appointments: [{ time: '09:30' }] },
      { start_time: '10:00', end_time: '13:00', appointments: [{ time: 'later' }] },
    ].map((briefing) => {
      try {
        frameOf(briefing, null);
        return null;
      } catch (err: unknown) {
        return err instanceof DomainError ? [err.getStatus(), err.publicMessage] : err;
      }
    });
    expect(refusals).toEqual([
      [400, 'end_time must be after start_time, both HH:MM on one day'],
      [400, 'end_time must be after start_time, both HH:MM on one day'],
      [400, 'end_time must be after start_time, both HH:MM on one day'],
      [400, 'An appointment has to lie between start_time and end_time'],
      [400, 'An appointment has to lie between start_time and end_time'],
    ]);
  });

  it('CWALK-HELP-002: the themes ask for their categories once each, as many as one search takes, and name the rest', () => {
    expect(briefingCategories(['mixed'])).toEqual({
      searched: ['sights', 'museum', 'park', 'viewpoint', 'cafe', 'market'].map((category) => ({
        category,
        theme: 'mixed',
      })),
      notSearched: [],
    });
    const three = briefingCategories(['culture', 'parks', 'food']);
    expect(three.searched.map((entry) => `${entry.theme}:${entry.category}`)).toEqual([
      'culture:museum',
      'culture:sights',
      'parks:park',
      'parks:viewpoint',
      'food:cafe',
      'food:restaurant',
    ]);
    expect(three.notSearched).toEqual(['market']);
  });

  it('CWALK-HELP-003: a leg is its straight distance, its walking time an estimate with an allowance for streets', () => {
    expect(legOf(START, CATHEDRAL)).toEqual({ metres: 1001, minutes: 18 });
    expect(legOf(START, START)).toEqual({ metres: 0, minutes: 0 });
  });

  it('CWALK-HELP-004: places of the themes take turns by category, nearest first, without unnamed ones or a station already named', () => {
    const searched = [
      { category: 'museum' as const, theme: 'culture' as const },
      { category: 'park' as const, theme: 'parks' as const },
    ];
    const found = [
      poi('Far museum', 48.003, { distance_m: 400 }),
      poi('Near museum', 48.004, { distance_m: 20, opening_hours: 'Mo-Su 09:00-18:00' }),
      poi('', 48.005, { distance_m: 5 }),
      poi('Garden', 48.006, { category: 'park', kind: 'leisure=park', distance_m: 90 }),
      poi('Cathedral museum', 48.009, { distance_m: 1 }),
      poi('Elsewhere', 48.007, { category: 'cafe' }),
    ];
    const offered = themeCandidates(found, searched, [START, CATHEDRAL]);
    expect(order(offered)).toEqual(['Near museum', 'Garden', 'Far museum']);
    expect(offered[0]).toMatchObject({
      source: 'theme',
      stay: null,
      osmHours: 'Mo-Su 09:00-18:00',
      find: {
        theme: 'culture',
        category: 'museum',
        kind: 'tourism=museum',
        found_in: 'openstreetmap',
        poi_id: 'Near museum',
        distance_to_search_m: 20,
      },
    });
    expect(themeCandidates([], searched, [])).toEqual([]);
  });

  it('CWALK-HELP-005: with every stay known the times are complete, the appointment keeps its time and the free time is named', () => {
    const { route, leftOut } = planWalk(plan());
    expect(order(route)).toEqual(['Hotel', 'Cathedral', 'Lunch', 'end']);
    expect(leftOut).toEqual([]);
    const walk = describeWalk(route, FRAME, UNROUTED);
    expect(
      walk.stations.map((s) => [s.name, s.arrival, s.arrival_is_earliest, s.leave, s.walk_from_previous?.minutes]),
    ).toEqual([
      ['Hotel', '10:00', false, '10:00', undefined],
      ['Cathedral', '10:18', false, '10:48', 18],
      ['Lunch', '11:30', false, '12:30', 18],
      [null, '12:48', false, '12:48', 18],
    ]);
    expect(walk.stations[2]).toMatchObject({
      appointment_time: '11:30',
      importance: 'must',
      protected: true,
      place_id: 7,
      hours: { kind: 'no_date' },
      conflicts: [],
    });
    expect(walk.stations[0]).toMatchObject({
      hours: null,
      walk_from_previous: null,
      importance: null,
      stay_source: 'frame',
    });
    expect(walk.stations[1]?.stay_source).toBe('given');
    expect(walk.gaps).toEqual([
      { before_position: 3, from: '11:06', to: '11:30', minutes: 24, unknown_stays: 0, kind: 'before_appointment' },
      { before_position: null, from: '12:48', to: '13:00', minutes: 12, unknown_stays: 0, kind: 'at_end' },
    ]);
    expect(walk.totals).toEqual({
      walk_minutes: 54,
      walk_m: 3003,
      stay_minutes_known: 90,
      stays_unknown: 0,
      total_minutes: 144,
      total_complete: true,
      ends_at: '12:48',
      ends_at_is_earliest: false,
      over_frame_by_minutes: 0,
      minutes_left_for_unknown_stays: null,
    });
    expect(walk.estimate).toEqual({
      kind: 'straight_line',
      street_factor: 1.3,
      pace_kmh: 4.5,
      why: 'router_unavailable',
      position: null,
    });
    expect(walk.wishes_not_met).toEqual([]);
    expect(walk.can_create).toBe(true);
  });

  it('CWALK-HELP-006: a place of a theme has no stay: later arrivals are the earliest, and the total is at least', () => {
    const museum = candidate('theme', 48.0045, { name: 'Museum', lng: 11.0005, osmHours: 'Mo-Su 09:00-18:00' });
    const { route } = planWalk(plan({ themes: [museum] }));
    expect(order(route)).toEqual(['Hotel', 'Museum', 'Cathedral', 'Lunch', 'end']);
    const walk = describeWalk(route, { ...FRAME, date: SUNDAY }, UNROUTED);
    expect(walk.stations.map((s) => [s.name, s.arrival, s.arrival_is_earliest, s.leave])).toEqual([
      ['Hotel', '10:00', false, '10:00'],
      ['Museum', '10:09', false, null],
      ['Cathedral', '10:18', true, '10:48'],
      ['Lunch', '11:30', false, '12:30'],
      [null, '12:48', false, '12:48'],
    ]);
    expect(walk.stations[1]).toMatchObject({
      stay_source: null,
      importance: 'optional',
      opening_hours: 'Mo-Su 09:00-18:00',
      hours: { kind: 'open', source: 'osm', window: { from: '09:00', to: '18:00' } },
    });
    // The cathedral has no hours: unknown, never open.
    expect(walk.stations[2]?.hours).toEqual({ kind: 'unknown' });
    expect(walk.gaps[0]).toMatchObject({ before_position: 4, minutes: 24, unknown_stays: 1 });
    expect(walk.totals).toMatchObject({
      walk_minutes: 54,
      stays_unknown: 1,
      total_minutes: 144,
      total_complete: false,
      minutes_left_for_unknown_stays: 24,
    });
    expect(walk.stations_for_create[1]).toEqual({
      lat: 48.0045,
      lng: 11.0005,
      name: 'Museum',
      stay_minutes: null,
      importance: 'optional',
      protected: false,
      opening_hours: 'Mo-Su 09:00-18:00',
      linked_place_id: null,
    });
  });

  it('CWALK-HELP-007: a place that cannot fit is left out with the reason; a wish is kept and said to be unmet', () => {
    const castle = candidate('theme', 48.5, { name: 'Castle', find: null });
    const gallery = candidate('theme', 48.0135, { name: 'Gallery', osmHours: 'Mo-Fr 09:00-18:00; Sa,Su off' });
    const shop = candidate('trip_place', 48.012, { name: 'Shop', placeId: 9, osmHours: 'Su 08:00-10:00' });
    const chapel = candidate('wished', 48.003, { name: 'Chapel', stay: 10, osmHours: 'Su off' });
    const { route, leftOut } = planWalk(
      plan({
        frame: { ...FRAME, date: SUNDAY },
        wished: [CATHEDRAL, chapel],
        tripPlaces: [shop],
        themes: [castle, gallery],
      }),
    );
    expect(order(route)).toEqual(['Hotel', 'Chapel', 'Cathedral', 'Lunch', 'end']);
    expect(leftOut).toEqual([
      { name: 'Shop', source: 'trip_place', place_id: 9, poi_id: null, reason: 'closed_at_arrival' },
      { name: 'Castle', source: 'theme', place_id: null, poi_id: null, reason: 'no_time' },
      { name: 'Gallery', source: 'theme', place_id: null, poi_id: null, reason: 'closed_all_day' },
    ]);
    const walk = describeWalk(route, { ...FRAME, date: SUNDAY }, UNROUTED);
    expect(walk.wishes_not_met).toEqual([
      { position: 2, name: 'Chapel', source: 'wished', conflicts: ['closed_all_day'] },
    ]);
  });

  it('CWALK-HELP-008: an appointment reached late, a wish after the frame and an end past it are said, never hidden', () => {
    const early = candidate('appointment', 48.018, { name: 'Tickets', stay: null, time: 10 * 60 + 5 });
    const far = candidate('wished', 48.2, { name: 'Lake', stay: 30 });
    const { route } = planWalk(plan({ appointments: [early], wished: [far], end: null }));
    expect(order(route)).toEqual(['Hotel', 'Tickets', 'Lake']);
    const walk = describeWalk(route, FRAME, UNROUTED);
    expect(walk.stations[1]).toMatchObject({ arrival: '10:35', appointment_time: '10:05', conflicts: ['late'] });
    expect(walk.stations[2]).toMatchObject({ arrival_is_earliest: true, conflicts: ['after_frame'] });
    expect(walk.wishes_not_met.map((wish) => wish.conflicts)).toEqual([['late'], ['after_frame']]);
    expect(walk.gaps).toEqual([]);
    expect(walk.totals.over_frame_by_minutes).toBeGreaterThan(0);
    // The late appointment does not set the clock again: what follows its unknown stay is the earliest.
    expect(walk.totals).toMatchObject({ ends_at_is_earliest: true, minutes_left_for_unknown_stays: 0 });
  });

  it('CWALK-HELP-009: a theme gives as many places as asked and looks at no more than twice as many', () => {
    const near = [1, 2, 3, 4, 5].map((step) => candidate('theme', 48 + step * 0.0005, { name: `Sight ${step}` }));
    const one = planWalk(plan({ themes: near, themeLimit: 1, wished: [], appointments: [], end: null }));
    expect(order(one.route)).toEqual(['Hotel', 'Sight 1']);
    expect(planWalk(plan({ themes: near, themeLimit: 0 })).route).toHaveLength(4);
    const closed = near.map((station) => ({ ...station, osmHours: 'Su off' }));
    const looked = planWalk(plan({ themes: closed, themeLimit: 2, frame: { ...FRAME, date: SUNDAY } }));
    expect(looked.leftOut.map((station) => station.name)).toEqual(['Sight 1', 'Sight 2', 'Sight 3', 'Sight 4']);
  });

  it('CWALK-HELP-010: what create_city_walk takes is what the proposal knows: no hours too long to keep, no name made up', () => {
    const long = 'Mo 09:00-10:00; '.repeat(40);
    expect(long.length).toBeGreaterThan(TOUR_STATION_HOURS_MAX);
    const shop = candidate('trip_place', 48.003, { name: 'S'.repeat(250), placeId: 9, osmHours: long, stay: 15 });
    const lone = describeWalk([candidate('start', 48, { stay: 0 }), shop], FRAME, UNROUTED);
    expect(lone.stations_for_create).toEqual([
      {
        lat: 48,
        lng: 11,
        name: null,
        stay_minutes: 0,
        importance: null,
        protected: false,
        opening_hours: null,
        linked_place_id: null,
      },
      {
        lat: 48.003,
        lng: 11,
        name: 'S'.repeat(200),
        stay_minutes: 15,
        importance: null,
        protected: false,
        opening_hours: null,
        linked_place_id: 9,
      },
    ]);
    expect(describeWalk([START], FRAME, UNROUTED)).toMatchObject({
      can_create: false,
      stations_for_create: [{ name: 'Hotel' }],
    });
  });

  it('CWALK-HELP-011: every answer of the opening hours reads as an assistant reads it', () => {
    const window = [540, 1080] as const;
    expect(
      [
        'no_date' as const,
        { kind: 'unknown' as const },
        { kind: 'unread' as const, text: 'by appointment' },
        { kind: 'nextDay' as const },
        { kind: 'uncertain' as const, source: 'osm' as const },
        { kind: 'open' as const, source: 'place' as const, window },
        { kind: 'closedAllDay' as const, source: 'osm' as const },
        { kind: 'closed' as const, source: 'osm' as const, windows: [window] },
        { kind: 'closes' as const, source: 'osm' as const, window },
      ].map(hoursCheckOf),
    ).toEqual([
      { kind: 'no_date' },
      { kind: 'unknown' },
      { kind: 'unread', text: 'by appointment' },
      { kind: 'next_day' },
      { kind: 'uncertain', source: 'osm' },
      { kind: 'open', source: 'place', window: { from: '09:00', to: '18:00' } },
      { kind: 'closed_all_day', source: 'osm' },
      { kind: 'closed', source: 'osm', windows: [{ from: '09:00', to: '18:00' }] },
      { kind: 'closes', source: 'osm', window: { from: '09:00', to: '18:00' } },
    ]);
  });

  it('CWALK-HELP-012: appointments are kept in the order of their times, however they were told', () => {
    const tea = candidate('appointment', 48.009, { name: 'Tea', stay: 30, time: 12 * 60 });
    const { route } = planWalk(plan({ appointments: [tea, LUNCH], wished: [] }));
    expect(order(route)).toEqual(['Hotel', 'Lunch', 'Tea', 'end']);
  });

  it('CWALK-HELP-013: a place goes in only where every station already on the walk stays open', () => {
    // The wish closes at 10:40 and is reached at 10:27. The garden lies a kilometre to the side of the start: before
    // the wish is the shorter detour, but the wish would then be reached at 10:50 at the earliest, so it goes after.
    const tower = candidate('wished', 48.0135, { name: 'Tower', osmHours: 'Mo-Su 09:00-10:40' });
    const garden = candidate('theme', 48, { name: 'Garden', lng: 11.0134 });
    const sunday = { ...FRAME, date: SUNDAY };
    const { route, leftOut } = planWalk(
      plan({ frame: sunday, end: null, appointments: [], wished: [tower], themes: [garden] }),
    );
    expect(order(route)).toEqual(['Hotel', 'Tower', 'Garden']);
    expect(leftOut).toEqual([]);
    const walk = describeWalk(route, sunday, UNROUTED);
    expect(walk.stations[1]).toMatchObject({ arrival: '10:27', conflicts: [] });
    expect(walk.wishes_not_met).toEqual([]);
  });

  it('CWALK-HELP-014: the way the router planned on foot times the walk; a station it had to move far onto a way leaves the estimates', () => {
    const line: Array<[number, number]> = [
      [48, 11],
      [48.009, 11.001],
      [48.018, 11],
    ];
    const parts = [
      { distance: 1240.4, duration: 900 },
      { distance: 1180.6, duration: 841 },
    ];
    const way = footWayOf({ leg: { line }, parts, snapped: [{ meters: 4 }, { meters: 300 }, { meters: 12 }] });
    expect(way).toEqual({
      kind: 'routed',
      line,
      legs: [
        { metres: 1240, minutes: 15 },
        { metres: 1181, minutes: 15 },
      ],
      seconds: 1741,
    });
    const { route } = planWalk(plan({ end: null }));
    const walk = describeWalk(route, FRAME, way);
    expect(walk.stations.map((s) => [s.name, s.arrival, s.walk_from_previous])).toEqual([
      ['Hotel', '10:00', null],
      ['Cathedral', '10:15', { metres: 1240, minutes: 15 }],
      ['Lunch', '11:30', { metres: 1181, minutes: 15 }],
    ]);
    expect(walk.totals).toMatchObject({ walk_minutes: 30, walk_m: 2421 });
    expect(walk.estimate).toEqual({ kind: 'routed', profile: 'walking' });

    // Without the snapped points nothing says a station is off the way; with one further than the planner allows, nothing is taken.
    expect(footWayOf({ leg: { line }, parts })).toMatchObject({ kind: 'routed', seconds: 1741 });
    expect(footWayOf({ leg: { line }, parts, snapped: [{ meters: 4 }, { meters: 301 }, { meters: 12 }] })).toEqual({
      kind: 'unrouted',
      why: 'station_off_the_way',
      position: 2,
    });
  });

  it('CWALK-HELP-015: a way that crosses by boat is none on foot; the estimates stand in and say where the boat starts (CW-12)', () => {
    const line: Array<[number, number]> = [
      [45.434, 12.338],
      [45.4296, 12.3264],
      [45.4268, 12.33],
    ];
    const parts = [
      { distance: 1400, duration: 1000 },
      { distance: 500, duration: 520 },
    ];
    const way = footWayOf({
      leg: { line },
      parts,
      snapped: [{ meters: 3 }, { meters: 4 }, { meters: 5 }],
      ferryLegs: [1],
    });
    expect(way).toEqual({ kind: 'unrouted', why: 'ferry_only', position: 2 });
    const { route } = planWalk(plan({ end: null }));
    expect(describeWalk(route, FRAME, way).estimate).toMatchObject({
      kind: 'straight_line',
      why: 'ferry_only',
      position: 2,
    });
    // No crossing named, the way stands.
    expect(footWayOf({ leg: { line }, parts, ferryLegs: [] })).toMatchObject({ kind: 'routed' });
  });
});
