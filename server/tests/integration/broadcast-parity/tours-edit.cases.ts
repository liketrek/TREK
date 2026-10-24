import { Places } from '../../../src/db/entities/Places.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints } from '../../helpers/factories/tours';
import type { CaseGroup, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

const ormOf = (app: INestApplication) => app.get(MikroORM);

/** A hike's line with its heights, as the planner saves one. */
const LINE: [number, number, number][] = [
  [47, 11, 600],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];

/** The planner's save of the scene's hike, for the edit route. */
const hikeBody = (extra: Record<string, unknown>) => ({
  name: 'Ridge',
  route_geometry: LINE,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
  expected_revision: 1,
  ...extra,
});

/** The scene's hike with its line and its start and end, as the planner saves one. */
async function planHike(s: Scene, app: INestApplication): Promise<void> {
  const orm = ormOf(app);
  await updateRows(orm, Places, { id: s.tourPlace.id }, { route_geometry: JSON.stringify(LINE) });
  await addTourWaypoints(orm, s.tourPlace.id, [
    { lat: 47, lng: 11 },
    { lat: 47.02, lng: 11.02 },
  ]);
}

/** The scene's tour as an imported ski track, classified alpine. */
async function skiTrack(s: Scene, app: INestApplication): Promise<void> {
  const orm = ormOf(app);
  await updateRows(orm, Places, { id: s.tourPlace.id }, { route_geometry: JSON.stringify(LINE) });
  await updateRows(
    orm,
    Tours,
    { place: s.tourPlace.id },
    { tourTypeRef: 'ski', origin: 'gpx', ski_discipline: 'alpine' },
  );
}

/** The scene's tour as a recorded paddle track; with `line` false it has no line yet. */
function paddleTrack(line: boolean) {
  return async (s: Scene, app: INestApplication): Promise<void> => {
    const orm = ormOf(app);
    if (line) await updateRows(orm, Places, { id: s.tourPlace.id }, { route_geometry: JSON.stringify(LINE) });
    await updateRows(
      orm,
      Tours,
      { place: s.tourPlace.id },
      { tourTypeRef: 'kayak', origin: 'gpx', boat_type: 'kayak', water_context: 'river', max_hiking_difficulty: null },
    );
  };
}

/** The scene's hike planned over an import: it still keeps the track it was recorded with. */
async function plannedImport(s: Scene, app: INestApplication): Promise<void> {
  await planHike(s, app);
  await updateRows(ormOf(app), Tours, { place: s.tourPlace.id }, { recorded_route_geometry: JSON.stringify(LINE) });
}

const tourPath = (s: Scene) => `/api/trips/${s.trip.id}/tours/${s.tourPlace.id}`;
const MARKS = { portages: [{ from_m: 100, to_m: 300, extra_minutes: null }], locks: [] };
const CLEAR = [{ key: 'node/12', op: 'clear', decision: null, note: null, basis: null }];

/**
 * P8 and P9: the edits of a saved tour besides its route (its words and
 * times, the colour of its line, a copy) and the writes a ski or paddle tour
 * has of its own, each with the REST route the Tours tab saves it through.
 */
export const toursEdit: CaseGroup = {
  name: 'tours-edit',
  prefix: 'BCP-TEDIT',
  cases: [
    {
      tool: 'update_tour_details',
      needs: ['tour'],
      setup: planHike,
      args: (s) => ({
        tripId: s.trip.id,
        placeId: s.tourPlace.id,
        expected_revision: 1,
        website: 'https://a.example/',
      }),
      // The planner saves the tour's words and times with its route.
      rest: { method: 'put', path: tourPath, body: () => hikeBody({ website: 'https://a.example/' }) },
      expect: ['tours:changed', 'place:updated'],
    },
    {
      tool: 'set_tour_route_color',
      needs: ['tour'],
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, route_color: '#e11d48' }),
      // The tour detail's colour picker writes the place.
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/places/${s.tourPlace.id}`,
        body: () => ({ route_color: '#e11d48' }),
      },
      expect: ['place:updated'],
    },
    {
      tool: 'copy_tour',
      needs: ['tour'],
      setup: planHike,
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, name: 'Ridge (short)' }),
      rest: { method: 'post', path: (s) => `${tourPath(s)}/copy`, body: () => ({ name: 'Ridge (short)' }) },
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'classify_ski_track',
      needs: ['tour'],
      setup: skiTrack,
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, ski_discipline: 'snowshoe' }),
      rest: { method: 'put', path: (s) => `${tourPath(s)}/ski`, body: () => ({ ski_discipline: 'snowshoe' }) },
      expect: ['tours:changed'],
    },
    {
      tool: 'set_paddle_plan',
      needs: ['tour'],
      setup: paddleTrack(true),
      args: (s) => ({
        tripId: s.trip.id,
        placeId: s.tourPlace.id,
        paddle_speed_kmh: 5,
        portage_speed_kmh: null,
        track_marks: MARKS,
      }),
      rest: {
        method: 'put',
        path: (s) => `${tourPath(s)}/paddle-plan`,
        body: () => ({ paddle_speed_kmh: 5, portage_speed_kmh: null, track_marks: MARKS }),
      },
      expect: ['tours:changed'],
    },
    {
      // A track without a line has nothing to read against the obstacle data, so no data is asked for.
      tool: 'decide_paddle_obstacles',
      needs: ['tour'],
      setup: paddleTrack(false),
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, ops: CLEAR }),
      rest: { method: 'put', path: (s) => `${tourPath(s)}/obstacle-reviews`, body: () => ({ ops: CLEAR }) },
      expect: ['tours:changed'],
    },
    {
      tool: 'restore_recorded_track',
      needs: ['tour'],
      setup: plannedImport,
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id }),
      rest: { method: 'post', path: (s) => `${tourPath(s)}/restore-recorded` },
      expect: ['tours:changed', 'place:updated'],
    },
  ],
  exempt: [],
};
