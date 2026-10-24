import { derivedFields, planLegs, planLine, planPoints } from '../../../src/nest/tours/tour-plan-read';
import type { WalkProgress } from '../../../src/nest/tours/tour-visits.service';
import type { TourDetailResponse, TourWaypoint } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// TOUR-PLAN-READ-001 to TOUR-PLAN-READ-009

/** The detail of a tour of this type, only as far as the plan reads it. */
function detailOf(tourType: TourDetailResponse['tour']['tour_type']): TourDetailResponse {
  return { tour: { tour_type: tourType }, waypoints: [] } as unknown as TourDetailResponse;
}

const point = (sequence: number, extra: Partial<TourWaypoint> = {}): TourWaypoint => ({
  lat: 48 + sequence * 0.01,
  lng: 11,
  role: 'via',
  sequence,
  ...extra,
});

/** A walk on a day where the station keyed `seen` was visited. */
const run: WalkProgress = {
  place_id: 1,
  day_id: 2,
  assignment_id: 3,
  stations: [
    {
      position: 1,
      key: 'seen',
      name: null,
      lat: 48,
      lng: 11,
      status: 'visited',
      importance: 'normal',
      protected: false,
      stay_minutes: null,
      opening_hours: null,
      linked_place_id: null,
    },
  ],
  open: { stations: 1, stay_minutes_known: 0, stays_unknown: 1 },
  walking_minutes: null,
};

describe('tour plan read (MCP-T01)', () => {
  it('TOUR-PLAN-READ-001: a station without a key is planned on the day read, never another station of it', () => {
    const points = [point(0, { key: 'seen' }), point(1), point(2, { key: 'other' })];
    expect(planPoints('walk', points, run).map((station) => 'visit_status' in station && station.visit_status)).toEqual(
      ['visited', 'planned', 'planned'],
    );
  });

  it('TOUR-PLAN-READ-002: the points of any other type stay as stored, whatever day is read', () => {
    const points = [point(0, { key: 'seen' }), point(1)];
    expect(planPoints('bike', points, run)).toEqual(points);
  });

  it('TOUR-PLAN-READ-003: a portage is a fixed leg of its own kind, and a single point has no leg', () => {
    const portage = point(0, {
      fixed_leg: {
        kind: 'portage',
        geometry: [
          [48, 11],
          [48.01, 11],
        ],
      },
    });
    expect(planLegs([portage, point(1)], { recorded: false })).toEqual([
      expect.objectContaining({ kind: 'portage', name: null, length_km: 1.11 }),
    ]);
    expect(planLegs([point(0)], { recorded: false })).toEqual([]);
  });

  it('TOUR-PLAN-READ-004: a line of fewer than two points is no line', () => {
    expect(planLine([])).toBeNull();
    expect(planLine([[48, 11]])).toBeNull();
  });

  it('TOUR-PLAN-READ-005: a paddle tour names its check bench and checklist as worked out, a walk its station counts', () => {
    const none = { controlsFromTrack: false, line: null, run: null };
    expect(derivedFields(detailOf('kayak'), none)).toEqual(
      expect.arrayContaining(['tour.paddle_check', 'obstacle_check']),
    );
    expect(derivedFields(detailOf('kayak'), none)).not.toContain('tour.station_count');
    const walk = derivedFields(detailOf('walk'), none);
    expect(walk).toEqual(expect.arrayContaining(['tour.station_count', 'tour.station_stays_unknown']));
    expect(walk).not.toContain('tour.paddle_check');
    expect(walk).not.toContain('run.open');
  });

  it('TOUR-PLAN-READ-006: a leg of a recorded track is a track, never routed, and a fixed leg keeps its own kind', () => {
    expect(planLegs([point(0), point(1)], { recorded: false })).toEqual([
      expect.objectContaining({ kind: 'routed', length_km: null }),
    ]);
    expect(planLegs([point(0), point(1)], { recorded: true })).toEqual([
      expect.objectContaining({ kind: 'track', name: null, length_km: null }),
    ]);
    const free = point(0, {
      fixed_leg: {
        kind: 'free',
        geometry: [
          [48, 11],
          [48.01, 11],
        ],
      },
    });
    expect(planLegs([free, point(1)], { recorded: true })).toEqual([expect.objectContaining({ kind: 'free' })]);
  });

  it('TOUR-PLAN-READ-007: an actual track names its metrics as worked out, a multi-day tour its stage count and stops', () => {
    const none = { controlsFromTrack: false, line: null, run: null };
    const plain = derivedFields(detailOf('hike'), none);
    expect(plain).not.toContain('activities[].metrics');
    expect(plain).not.toContain('tour.stage_count');
    const tracked = { ...detailOf('hike'), activities: [{ id: 1 }] } as unknown as TourDetailResponse;
    expect(derivedFields(tracked, none)).toContain('activities[].metrics');
    expect(derivedFields({ ...detailOf('hike'), activities: [] }, none)).not.toContain('activities[].metrics');
    const staged = {
      ...detailOf('hike'),
      tour: { tour_type: 'hike', stage_count: 2 },
    } as unknown as TourDetailResponse;
    expect(derivedFields(staged, none)).toEqual(expect.arrayContaining(['tour.stage_count', 'tour.stage_stops']));
  });

  it('TOUR-PLAN-READ-008: every leg of a planned ski tour is drawn freely with its straight length, a fixed one kept (SKI-02)', () => {
    const free = point(1, {
      fixed_leg: {
        kind: 'free',
        geometry: [
          [48.01, 11],
          [48.02, 11],
        ],
      },
    });
    expect(planLegs([point(0), free, point(2)], { recorded: false, drawn: () => true })).toEqual([
      expect.objectContaining({ kind: 'free', name: null, length_km: 1.11 }),
      expect.objectContaining({ kind: 'free', name: null, length_km: 1.11 }),
    ]);
    // A leg the piste router planned is routed, with no length of its own; the leg drawn straight keeps its line.
    expect(planLegs([point(0), point(1), point(2)], { recorded: false, drawn: (leg) => leg === 1 })).toEqual([
      expect.objectContaining({ kind: 'routed', length_km: null }),
      expect.objectContaining({ kind: 'free', length_km: 1.11 }),
    ]);
    // A ski track kept as recorded stays a track.
    expect(planLegs([point(0), point(1)], { recorded: true, drawn: () => true })).toEqual([
      expect.objectContaining({ kind: 'track', length_km: null }),
    ]);
  });

  it('TOUR-PLAN-READ-009: an estimated time is named as worked out, a tour without one names none (TIME-01)', () => {
    const none = { controlsFromTrack: false, line: null, run: null };
    const estimated = {
      ...detailOf('hike'),
      tour: { tour_type: 'hike', time_estimate: { minutes: 240, basis: 'din33466' } },
    } as unknown as TourDetailResponse;
    expect(derivedFields(estimated, none)).toContain('tour.time_estimate');
    expect(derivedFields(detailOf('hike'), none)).not.toContain('tour.time_estimate');
  });
});
