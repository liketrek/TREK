/**
 * FE-AI-TOUR-001 to FE-AI-TOUR-012, FE-AI-TOUR-045 to FE-AI-TOUR-046
 *
 * A tour card's numbers: the profile scaled to the route's own length, the
 * hard grades tinted before the steep stretches, the stops worth a chip, the
 * figures each activity states, a way as the planner's way cards read one,
 * what "Plan this" can take, how an answer's routes are grouped, the words of
 * a stop and of a route's time, the grade under a spot and the sketch's lines
 * and marks.
 */
import type { TourRouteCard, TourRouteStop } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { GENTLE, HIKE, HIKE_LINE, SAVED, TOUR_LIST, tourStop } from '../../../../../tests/helpers/assistantTour';
import {
  canTake,
  chipStops,
  factKeysOf,
  gradeAt,
  legVariantOf,
  percentText,
  previousVariantOf,
  profileBands,
  profileGrades,
  profileMarks,
  profileSamples,
  routeEntries,
  routePoints,
  sacAt,
  sacPaint,
  steepStretches,
  wayGroups,
} from './tourRouteModel';
import { sketchOf } from './tourRouteSketchModel';
import { routeName, stopName, timeLabelKey } from './tourRouteWords';

/** A kilometre of way, flat, then 40 % steep from 300 m to 700 m, then flat again. */
const RAMP = [0, 0, 0, 0, 40, 80, 120, 160, 160, 160, 160].map((elevationMeters, index) => ({
  distanceMeters: index * 100,
  elevationMeters,
  lat: 47,
  lng: 11 + index * 0.001,
}));

/** The way a held change replaces, in brief. */
const PREVIOUS_LINE: [number, number][] = [
  [47.7, 12.5],
  [47.8, 12.6],
];

const named = (name: string, atM: number): TourRouteStop => tourStop({ name, atM });
const t = (key: string) => key;

describe('tourRouteModel', () => {
  it('FE-AI-TOUR-001: the profile follows the line, scaled so it ends at the route length the card states', () => {
    const samples = profileSamples(HIKE);
    expect(samples).toHaveLength(HIKE_LINE.length);
    expect(samples[0]).toEqual({ distanceMeters: 0, elevationMeters: 600, lat: 47.77, lng: 12.59 });
    expect(samples[samples.length - 1]?.distanceMeters).toBeCloseTo(8200, 6);
    expect(samples[4]?.distanceMeters).toBeCloseTo(3132.1, 0);
    expect(samples.map((sample) => sample.elevationMeters)).toEqual(HIKE_LINE.map((point) => point[2]));
  });

  it('FE-AI-TOUR-002: no profile for a route joined straight or one where a single height is missing', () => {
    expect(profileSamples({ ...HIKE, routed: false })).toEqual([]);
    const gap = HIKE_LINE.map((point, index): [number, number, number | null] =>
      index === 3 ? [point[0], point[1], null] : point
    );
    expect(profileSamples({ ...HIKE, line: gap })).toEqual([]);
  });

  it('FE-AI-TOUR-003: tints the T3 and harder stretches in their SAC colour, and the steep ones only without them', () => {
    expect(profileBands(HIKE, RAMP)).toEqual([{ fromM: 3000, toM: 4100, color: 'var(--hike-sac-t3)' }]);
    expect(profileBands(GENTLE, RAMP)).toEqual([{ fromM: 300, toM: 700, color: 'var(--warning)' }]);
    expect(sacPaint(5)).toBe('var(--hike-sac-t5)');
  });

  it('FE-AI-TOUR-004: finds the steep stretches over 27 % and reads the grade at a spot of the profile', () => {
    expect(steepStretches(RAMP)).toEqual([{ fromM: 300, toM: 700 }]);
    const grades = profileGrades(RAMP);
    expect(gradeAt(grades, 450)).toBe(40);
    expect(gradeAt(grades, 50)).toBe(0);
    expect(gradeAt(grades, 2000)).toBeNull();
    // A ramp shorter than 100 m is no steep stretch.
    const short = RAMP.map((sample) => ({ ...sample, distanceMeters: sample.distanceMeters / 20 }));
    expect(steepStretches(short)).toEqual([]);
  });

  it('FE-AI-TOUR-005: marks the named stops and the stage ends across the profile, six at most', () => {
    expect(profileMarks(HIKE)).toEqual([2400, 4100]);
    const many = Array.from({ length: 9 }, (_, index) => named(`Hut ${index}`, index * 100));
    expect(profileMarks({ ...HIKE, stops: many })).toHaveLength(6);
    expect(profileMarks({ ...HIKE, stops: [tourStop({ role: 'end', atM: 900, stageEnd: true })] })).toEqual([900]);
  });

  it('FE-AI-TOUR-006: a chip for every stop but a shaping point, the middle folded past eight', () => {
    const shaping = tourStop({ role: 'via', atM: 50 });
    expect(chipStops({ ...HIKE, stops: [...HIKE.stops, shaping] }).head).toHaveLength(5);
    const vias = Array.from({ length: 10 }, (_, index) => named(`Station ${index}`, (index + 1) * 100));
    const stops = [tourStop({ role: 'start' }), ...vias, tourStop({ role: 'end', atM: 2000 })];
    const { head, folded, tail } = chipStops({ ...HIKE, stops });
    expect(head.map((stop) => stop.name ?? stop.role)).toEqual(['start', 'Station 0', 'Station 1', 'Station 2']);
    expect(folded).toHaveLength(6);
    expect(tail.map((stop) => stop.name ?? stop.role)).toEqual(['Station 9', 'end']);
  });

  it('FE-AI-TOUR-007: each activity states its own figures, leaving out what the route does not know', () => {
    expect(factKeysOf(HIKE)).toEqual(['time', 'distance', 'ascent', 'descent']);
    expect(factKeysOf({ ...HIKE, activity: 'ski' })).toEqual(['time', 'distance', 'descent']);
    const paddle: TourRouteCard = { ...HIKE, activity: 'kayak', minutes: null, ascentM: null, descentM: null };
    expect(factKeysOf(paddle)).toEqual(['distance']);
    expect(percentText(0.4)).toBe('40 %');
  });

  it('FE-AI-TOUR-008: reads a route and the way a change replaces as the planner reads its ways', () => {
    expect(legVariantOf(HIKE, 'b')).toEqual({
      key: 'b',
      current: false,
      coordinates: HIKE_LINE.map(([lat, lng]) => [lat, lng]),
      distanceM: 8200,
      gainM: 640,
      lossM: 640,
      minutes: 200,
      heights: 'known',
    });
    expect(legVariantOf({ ...HIKE, ascentM: null }, 'current').heights).toBe('unknown');
    expect(previousVariantOf(HIKE)).toBeNull();
    const previous = { line: PREVIOUS_LINE, distanceM: 7000, ascentM: 500, minutes: 180 };
    expect(previousVariantOf({ ...HIKE, previous })).toMatchObject({
      key: 'current',
      distanceM: 7000,
      gainM: 500,
      lossM: null,
      minutes: 180,
      heights: 'known',
    });
  });

  it('FE-AI-TOUR-009: "Plan this" takes a planned hike or a city walk, nothing else', () => {
    expect(canTake(HIKE)).toBe(true);
    expect(canTake({ ...HIKE, routed: false })).toBe(false);
    expect(canTake({ ...HIKE, activity: 'walk', routed: false })).toBe(true);
    expect(canTake(SAVED)).toBe(false);
    expect(canTake({ ...HIKE, activity: 'kayak', source: 'plan' })).toBe(false);
    expect(canTake({ ...HIKE, source: 'pending' })).toBe(false);
  });

  it('FE-AI-TOUR-010: proposals of one answer form ways of three at most; anything else stands alone', () => {
    const entry = (toolCallId: string, card: TourRouteCard) => ({ toolCallId, card });
    const routes = routeEntries([entry('a', HIKE), { toolCallId: 'list', card: TOUR_LIST }, entry('b', GENTLE)]);
    expect(routes.map((route) => route.toolCallId)).toEqual(['a', 'b']);
    expect(wayGroups(routes).map((group) => group.length)).toEqual([2]);
    const four = ['a', 'b', 'c', 'd'].map((id) => entry(id, HIKE));
    expect(wayGroups(four).map((group) => group.length)).toEqual([3, 1]);
    expect(wayGroups([entry('s', SAVED), entry('h', HIKE)]).map((group) => group.length)).toEqual([1, 1]);
    expect(routePoints(HIKE)).toHaveLength(HIKE_LINE.length);
    expect(routePoints({ ...HIKE, line: [] })).toEqual(HIKE.stops.map((stop) => [stop.lat, stop.lng]));
  });

  it('FE-AI-TOUR-011: a stop without a name says what it is or where it lies; a walk without a name is its kind', () => {
    expect(stopName(named('Strausshütte', 10), t)).toBe('Strausshütte');
    expect(stopName(tourStop({ kind: 'shelter' }), t)).toBe('assistant.card.tour.stop.shelter');
    expect(stopName(tourStop({ role: 'start' }), t)).toBe('assistant.card.tour.stop.start');
    expect(stopName(tourStop({ kind: 'station' }), t)).toBe('assistant.card.tour.stop.other');
    expect(stopName(tourStop({ kind: 'cafe' }), t)).toBe('assistant.card.tour.stop.other');
    expect(routeName({ name: null, activity: 'walk' }, t)).toBe('tourTypes.walk');
    expect(routeName(HIKE, t)).toBe('Hochfelln from Bergen');
  });

  it('FE-AI-TOUR-012: the sketch tints the hard stretch, dashes a straight route and draws one disc for a loop', () => {
    const { lines, marks } = sketchOf(HIKE, 'var(--hike-variant-a)');
    expect(lines.map((line) => line.id)).toEqual(['route', 'sac-1']);
    expect(lines[0]).toMatchObject({
      color: 'var(--hike-variant-a)',
      casing: 'var(--bike-highlight-casing)',
      dashed: false,
    });
    expect(lines[1]?.points).toEqual([
      [47.785, 12.615],
      [47.79, 12.62],
      [47.795, 12.625],
      [47.79, 12.63],
    ]);
    expect(marks.map((mark) => mark.id)).toEqual(['start']);
    const oneWay = { ...HIKE, routed: false, stops: [HIKE.stops[0] as TourRouteStop, named('Hochfelln', 4100)] };
    const end = { ...(oneWay.stops[1] as TourRouteStop), role: 'end' as const, lat: 47.795, lng: 12.625 };
    const straight = sketchOf({ ...oneWay, stops: [oneWay.stops[0] as TourRouteStop, end] }, 'red');
    expect(straight.lines[0]?.dashed).toBe(true);
    expect(straight.marks.map((mark) => mark.shape)).toEqual(['service', 'stop']);
    const previous = { line: PREVIOUS_LINE, distanceM: 1, ascentM: null, minutes: null };
    const changed = sketchOf({ ...HIKE, previous }, 'red');
    expect(changed.lines[0]).toMatchObject({ id: 'previous', dim: true });
  });

  it('FE-AI-TOUR-045: reads the SAC step under a spot, the harder where two grades meet, none where nothing is graded', () => {
    expect(sacAt(HIKE, 1200)).toBe(2);
    expect(sacAt(HIKE, 3000)).toBe(3);
    expect(sacAt(HIKE, 4100)).toBe(3);
    expect(sacAt(HIKE, 6000)).toBeNull();
    expect(sacAt({ stretches: [{ facet: 'mark', fromM: 0, toM: 100, kind: 'ferry' }] }, 50)).toBeNull();
  });

  it('FE-AI-TOUR-046: names the time of a route by how it was reckoned, and a paddle tour by its own without a basis', () => {
    expect(timeLabelKey(HIKE)).toBe('tours.planner.walkingEstimatedInfo');
    expect(timeLabelKey({ ...HIKE, minutesBasis: 'router' })).toBe('tours.scope.routed');
    expect(timeLabelKey(SAVED)).toBe('tours.scope.planned');
    expect(timeLabelKey({ ...HIKE, activity: 'walk', minutesBasis: 'stations' })).toBe('tours.scope.plannedWithStays');
    expect(timeLabelKey({ ...HIKE, activity: 'ski', minutesBasis: 'piste' })).toBe('tours.ski.time');
    expect(timeLabelKey({ ...HIKE, activity: 'kayak', minutesBasis: null })).toBe('tours.paddle.timeEstimated');
    expect(timeLabelKey({ ...HIKE, minutesBasis: null })).toBe('tours.planner.walkingEstimated');
  });
});
