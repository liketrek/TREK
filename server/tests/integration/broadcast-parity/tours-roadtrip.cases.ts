import { CollectionTours } from '../../../src/db/entities/CollectionTours.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourChangeSteps } from '../../../src/db/entities/TourChangeSteps.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { PaddleRoutingService } from '../../../src/nest/paddle-routing/paddle-routing.service';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { SkiRoutingService } from '../../../src/nest/ski-routing/ski-routing.service';
import { proposalIdOf } from '../../../src/nest/tours/tour-change-proposal';
import { ToursWandererService } from '../../../src/nest/tours/tours-wanderer.service';
import { WandererService } from '../../../src/nest/wanderer/wanderer.service';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { createRow, deleteRows, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, linkTourPacking, makeTour, makeTourActivity } from '../../helpers/factories/tours';
import type { CaseGroup, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { TourChange } from '@trek/shared';

import { vi } from 'vitest';

const ormOf = (app: INestApplication) => app.get(MikroORM);

/**
 * The row a case's setup made beyond its scene (a recorded track, a kept
 * tour, a saved step), by the scene's number, for the arguments to point at.
 */
const madeFor = new Map<number, number>();

function made(s: Scene): number {
  const id = madeFor.get(s.n);
  if (id === undefined) throw new Error(`scene ${s.n}: the case's setup made no row to point at`);
  return id;
}

/**
 * No routing host in a test: the router that plans a city walk's and a
 * hike's way on foot fails as a router that is down does, so each is saved
 * with its points only, the way both tools save one when the router is away.
 */
function routerDown(app: INestApplication): () => void {
  const route = vi.spyOn(app.get(RoadtripRouterService), 'route');
  route.mockRejectedValue(new Error('no routing host in the broadcast parity test'));
  return () => route.mockRestore();
}

/**
 * No water or piste data in a test: the paddle and piste routers plan the
 * one leg asked as a straight stretch, and no height host answers, so each
 * tour is saved with its points only, as both tools save one then.
 */
function sportRouters(app: INestApplication): () => void {
  const geometry: Array<[number, number]> = [
    [47, 11],
    [47.02, 11.02],
  ];
  const paddle = vi.spyOn(app.get(PaddleRoutingService), 'route').mockResolvedValue({
    legs: [
      {
        status: 'ok',
        geometry,
        segments: [{ kind: 'water', from: 0, to: 1, name: null, source: null, osm_ref: null, grade: null }],
        distance_m: 2700,
        snapped_m: { from: 0, to: 0 },
      },
    ],
    graph_rev: null,
  });
  const ski = vi.spyOn(app.get(SkiRoutingService), 'route').mockResolvedValue({
    legs: [
      {
        status: 'ok',
        geometry: geometry.map(([lat, lng]): [number, number, null] => [lat, lng, null]),
        segments: [],
        distance_m: 2700,
        climb_m: 0,
        descent_m: 0,
        seconds: { ski: 600, lift: 0, wait: 0, walk: 0 },
        snapped_m: { from: 0, to: 0 },
        area_ids: [],
        why: [],
        alternatives: [],
      },
    ],
    build: null,
    stale: false,
    area_names: [],
    colour_scheme: 'europe',
    attribution: '',
  });
  const heights = vi.spyOn(app.get(RoadtripRouterService), 'heights').mockResolvedValue(null);
  return () => {
    paddle.mockRestore();
    ski.mockRestore();
    heights.mockRestore();
  };
}

/** The two points of every tour the parity cases create. */
const TWO_POINTS = [
  { lat: 47, lng: 11 },
  { lat: 47.02, lng: 11.02 },
];

/** A hike's line with its heights, as the planner saves one. */
const HIKE_LINE: [number, number, number][] = [
  [47, 11, 600],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];

/** The planner's save of a hike, for the create and edit routes. */
const hikeBody = (name: string) => ({
  name,
  route_geometry: HIKE_LINE,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
});

/** The scene's hike with its line and its start and end, as the planner saves one. */
async function planHike(s: Scene, app: INestApplication): Promise<void> {
  const orm = ormOf(app);
  await updateRows(orm, Places, { id: s.tourPlace.id }, { route_geometry: JSON.stringify(HIKE_LINE) });
  await addTourWaypoints(orm, s.tourPlace.id, [
    { lat: 47, lng: 11 },
    { lat: 47.02, lng: 11.02 },
  ]);
}

/** The stations of the scene's tour as a city walk: a gate, a market and a park. */
const STATIONS = [
  { lat: 48.1, lng: 11.5, station_key: 'walk-gate', name: 'Gate' },
  { lat: 48.104, lng: 11.5, station_key: 'walk-market', name: 'Market' },
  { lat: 48.108, lng: 11.5, station_key: 'walk-park', name: 'Park' },
];

/** The scene's tour made a city walk of three stations, without a line yet. */
async function planWalk(s: Scene, app: INestApplication): Promise<void> {
  const orm = ormOf(app);
  await updateRows(orm, Tours, { place: s.tourPlace.id }, { tourTypeRef: 'walk' });
  await addTourWaypoints(orm, s.tourPlace.id, STATIONS);
}

/** The market left out of the walk. */
const WITHOUT_MARKET: TourChange[] = [{ op: 'remove', key: 'walk-market' }];

/** The planner's save of the walk from the gate to the park, against the revision it was opened at. */
const walkBody = (revision: number) => ({
  name: 'Old town',
  tour_type: 'walk',
  route_geometry: [
    [48.1, 11.5, 520],
    [48.108, 11.5, 525],
  ],
  waypoints: [
    { lat: 48.1, lng: 11.5, role: 'start', sequence: 0, key: 'walk-gate', name: 'Gate' },
    { lat: 48.108, lng: 11.5, role: 'end', sequence: 1, key: 'walk-park', name: 'Park' },
  ],
  expected_revision: revision,
});

/**
 * The walk after a saved step took the market out: the step at revision 2
 * keeps the three stations as they were before it, and the walk holds two.
 * Written row by row, since the save that records a step tells the trip.
 */
async function walkWithSavedStep(s: Scene, app: INestApplication): Promise<void> {
  const orm = ormOf(app);
  await planWalk(s, app);
  const before = STATIONS.map(({ station_key, ...station }, sequence) => ({
    ...station,
    key: station_key,
    role: sequence === 0 ? 'start' : sequence === STATIONS.length - 1 ? 'end' : 'via',
    sequence,
  }));
  const step = await createRow(orm, TourChangeSteps, {
    place: s.tourPlace.id,
    proposal_id: `parity-step-${s.n}`,
    base_revision: 1,
    revision: 2,
    changes: JSON.stringify(WITHOUT_MARKET),
    before_state: JSON.stringify({
      route_geometry: null,
      waypoints: before,
      distance: null,
      duration: null,
      elevation_gain: null,
      elevation_loss: null,
    }),
  });
  await deleteRows(orm, TourWaypoints, { place: s.tourPlace.id, station_key: 'walk-market' });
  await updateRows(orm, Tours, { place: s.tourPlace.id }, { revision: 2 });
  madeFor.set(s.n, step.id);
}

/** A recorded track of the scene's trip (a GPX import, not planned over), for the hike to be done with. */
async function recordedTrack(s: Scene, app: INestApplication): Promise<number> {
  const orm = ormOf(app);
  const track = await makePlace(orm, s.trip.id, {
    name: `Recorded ${s.n}`,
    lat: 47,
    lng: 11,
    route_geometry: JSON.stringify(HIKE_LINE),
  });
  await makeTour(orm, track.id, { origin: 'gpx' });
  return track.id;
}

/** The scene's collection keeping a hike of its own, with its line and its two points. */
async function keptTour(s: Scene, app: INestApplication): Promise<void> {
  const row = await createRow(ormOf(app), CollectionTours, {
    collection: s.collection.id,
    name: `Kept ridge ${s.n}`,
    route_geometry: JSON.stringify(HIKE_LINE),
    waypoints: JSON.stringify(hikeBody('').waypoints),
    tourTypeRef: 'hike',
    origin: 'trek',
    source_trip_title: `Alps ${s.n}`,
    source_tour_name: `Ridge ${s.n}`,
  });
  madeFor.set(s.n, row.id);
}

/** A city walk of two stations on the scene's first day; the walk's place is the row made. */
async function walkOnDay(s: Scene, app: INestApplication): Promise<void> {
  const orm = ormOf(app);
  const walk = await makePlace(orm, s.trip.id, { name: `Old town ${s.n}` });
  await makeTour(orm, walk.id, { tourTypeRef: 'walk' });
  await addTourWaypoints(orm, walk.id, [
    { lat: 48.1, lng: 11.5, station_key: 'stop-gate', name: 'Gate' },
    { lat: 48.108, lng: 11.5, station_key: 'stop-park', name: 'Park' },
  ]);
  const visit = await makeDayAssignment(orm, s.days[0].id, walk.id);
  madeFor.set(s.n, walk.id);
  visitFor.set(s.n, visit.id);
}

/** The day assignment of the walk a case's setup put on the first day, by the scene's number. */
const visitFor = new Map<number, number>();

/** Two stops of a Google Maps directions link, reviewed. */
const GOOGLE_STOPS = [
  { name: 'Brandenburger Tor', lat: 52.5163, lng: 13.3777 },
  { name: 'Alexanderplatz', lat: 52.5219, lng: 13.4132 },
];

/** A GPX file with one track and its heights. */
const gpxOf = (s: Scene) =>
  `<gpx><trk><name>Ridge ${s.n}</name><trkseg><trkpt lat="47.6" lon="11.3"><ele>800</ele></trkpt>` +
  '<trkpt lat="47.61" lon="11.3"><ele>1000</ele></trkpt></trkseg></trk></gpx>';

/** The fingerprint of the wanderer trail a case's setup previewed, by the scene's number. */
const trailHashFor = new Map<number, string>();

function trailHash(s: Scene): string {
  const hash = trailHashFor.get(s.n);
  if (hash === undefined) throw new Error(`scene ${s.n}: the case's setup previewed no trail`);
  return hash;
}

/** No wanderer instance in a test: the owner's own trail, found and downloaded as the connection would. */
function wandererTrail(app: INestApplication): () => void {
  const wanderer = app.get(WandererService);
  const summary = {
    id: 'trail-1',
    name: 'Kesselberg',
    description: null,
    location: 'Kochel',
    distanceM: 2200,
    durationS: 3600,
    elevationGainM: 200,
    elevationLossM: 0,
    difficulty: 'moderate' as const,
    public: false,
    author: 'owner',
    line: [],
    externalUrl: 'https://wanderer.example/trail/view/trail-1',
  };
  const found = vi.spyOn(wanderer, 'findTrail').mockResolvedValue(summary);
  const download = vi.spyOn(wanderer, 'download').mockResolvedValue({
    instance: 'https://wanderer.example',
    trail: { id: 'trail-1', name: 'Kesselberg', description: null, author: 'owner', updated: null } as never,
    gpx:
      '<gpx><trk><name>Kesselberg</name><trkseg><trkpt lat="47.6" lon="11.3"><ele>800</ele></trkpt>' +
      '<trkpt lat="47.62" lon="11.3"><ele>1000</ele></trkpt></trkseg></trk></gpx>',
  });
  return () => {
    found.mockRestore();
    download.mockRestore();
  };
}

/** The trail previewed first, as the traveller sees it before the import: its fingerprint is what the import takes. */
async function previewTrail(s: Scene, app: INestApplication): Promise<void> {
  // Called straight on the service, outside a request: it reads the snapshots through repositories, which need a context.
  const preview = await withRequestContext(ormOf(app), () =>
    app.get(ToursWandererService).preview(String(s.trip.id), s.owner.id, 'trail-1'),
  );
  trailHashFor.set(s.n, preview.contentHash);
}

const roadtripDay = (s: Scene) => `/api/trips/${s.trip.id}/roadtrip/days/${s.days[0].id}`;
const tourPath = (s: Scene) => `/api/trips/${s.trip.id}/tours/${s.tourPlace.id}`;

/**
 * Tours and road trips: city walks, hikes and their library, the tours kept in
 * collections, recorded tracks, the packing link, route vias, day boundaries,
 * the road trip settings and the Google route import. Paddling, skiing and
 * charging plan and read only; they have no write tool.
 */
export const toursRoadtrip: CaseGroup = {
  name: 'tours-roadtrip',
  prefix: 'BCP-TOUR',
  cases: [
    {
      tool: 'set_day_boundary',
      needs: ['assignment'],
      args: (s) => ({
        tripId: s.trip.id,
        dayNumber: 1,
        boundary: { day_number: 1, from_assignment_id: s.assignment.id, to_assignment_id: null, fraction: 1 },
      }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/roadtrip/day-boundaries`,
        body: (s) => ({ day_number: 1, from_assignment_id: s.assignment.id, to_assignment_id: null, fraction: 1 }),
      },
      expect: ['roadtripBoundary:changed'],
    },
    {
      tool: 'import_google_maps_route',
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, stops: GOOGLE_STOPS }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/roadtrip/google-maps-import`,
        body: (s) => ({ dayId: s.days[0].id, stops: GOOGLE_STOPS }),
      },
      // Each reviewed stop as a place and its visit, in the order of the link.
      expect: ['place:created', 'assignment:created', 'place:created', 'assignment:created'],
    },
    {
      tool: 'update_roadtrip_settings',
      args: (s) => ({ tripId: s.trip.id, settings: { roadtrip_hotel_bookends: true } }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/roadtrip/preferences`,
        body: () => ({ roadtrip_hotel_bookends: true }),
      },
      expect: ['roadtripPreferences:changed'],
    },
    {
      // G8: the day id goes out as text on both surfaces now, as the route always sent it.
      tool: 'add_route_via',
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, after_order_index: 0, lat: 48.86, lng: 2.34 }),
      rest: {
        method: 'post',
        path: (s) => `${roadtripDay(s)}/vias`,
        body: () => ({ after_order_index: 0, lat: 48.86, lng: 2.34 }),
      },
      expect: ['roadtripVia:changed'],
    },
    {
      tool: 'add_route_vias',
      args: (s) => ({
        tripId: s.trip.id,
        dayId: s.days[0].id,
        vias: [{ after_order_index: 0, lat: 48.86, lng: 2.34 }],
      }),
      rest: {
        method: 'post',
        path: (s) => `${roadtripDay(s)}/vias/batch`,
        body: () => ({ vias: [{ after_order_index: 0, lat: 48.86, lng: 2.34 }] }),
      },
      // The vias first, then the track the day follows now (none here), as the batch always sent them.
      expect: ['roadtripVia:changed', 'roadtripTrack:changed'],
    },
    {
      tool: 'reanchor_route_vias',
      needs: ['via'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, vias: [{ id: s.via.id, after_order_index: 1 }] }),
      rest: {
        method: 'put',
        path: (s) => `${roadtripDay(s)}/vias`,
        body: (s) => ({ vias: [{ id: s.via.id, after_order_index: 1 }] }),
      },
      expect: ['roadtripVia:changed'],
    },
    {
      tool: 'remove_route_via',
      needs: ['via'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, viaId: s.via.id }),
      rest: { method: 'delete', path: (s) => `${roadtripDay(s)}/vias/${s.via.id}` },
      expect: ['roadtripVia:changed'],
    },
    {
      tool: 'update_route_via',
      needs: ['via'],
      args: (s) => ({ tripId: s.trip.id, dayId: s.days[0].id, viaId: s.via.id, lat: 48.87, lng: 2.35 }),
      rest: {
        method: 'put',
        path: (s) => `${roadtripDay(s)}/vias/${s.via.id}`,
        body: () => ({ lat: 48.87, lng: 2.35 }),
      },
      expect: ['roadtripVia:changed'],
    },
    {
      tool: 'create_city_walk',
      args: (s) => ({
        tripId: s.trip.id,
        name: 'Old town',
        stations: [
          { lat: 48.1, lng: 11.5, name: 'Gate' },
          { lat: 48.108, lng: 11.5, name: 'Park' },
        ],
      }),
      // The planner saves a new walk through the tours route, with the line it planned in the browser.
      rest: { method: 'post', path: (s) => `/api/trips/${s.trip.id}/tours`, body: () => walkBody(1) },
      stub: routerDown,
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'set_city_walk_visit',
      setup: walkOnDay,
      args: (s) => ({
        tripId: s.trip.id,
        placeId: made(s),
        dayId: s.days[0].id,
        stationKey: 'stop-park',
        status: 'visited',
      }),
      // The day plan checks a station off through the visits route.
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/tour-visits/${visitFor.get(s.n)}/stop-park`,
        body: () => ({ status: 'visited' }),
      },
      expect: ['tours:visits'],
    },
    {
      tool: 'create_hike',
      args: (s) => ({
        tripId: s.trip.id,
        name: 'Ridge walk',
        waypoints: [
          { lat: 47, lng: 11 },
          { lat: 47.02, lng: 11.02 },
        ],
      }),
      rest: { method: 'post', path: (s) => `/api/trips/${s.trip.id}/tours`, body: () => hikeBody('Ridge walk') },
      stub: routerDown,
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'create_tour',
      args: (s) => ({ tripId: s.trip.id, name: 'Lake ride', activity: 'bike', waypoints: TWO_POINTS }),
      // The planner saves a new bike tour through the tours route, with the line it planned in the browser.
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/tours`,
        body: () => ({
          ...hikeBody('Lake ride'),
          tour_type: 'bike',
          bike_profile: 'touring',
          max_hiking_difficulty: null,
        }),
      },
      stub: routerDown,
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'create_paddle_tour',
      args: (s) => ({ tripId: s.trip.id, name: 'River day', waypoints: TWO_POINTS, water_context: 'river' }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/tours`,
        body: () => ({
          ...hikeBody('River day'),
          tour_type: 'kayak',
          boat_type: 'kayak',
          water_context: 'river',
          max_hiking_difficulty: null,
        }),
      },
      stub: sportRouters,
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'create_ski_tour',
      args: (s) => ({ tripId: s.trip.id, name: 'Piste day', waypoints: TWO_POINTS, discipline: 'alpine' }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/tours`,
        body: () => ({
          ...hikeBody('Piste day'),
          tour_type: 'ski',
          ski_discipline: 'alpine',
          max_hiking_difficulty: null,
        }),
      },
      stub: sportRouters,
      expect: ['tours:changed', 'place:created'],
    },
    {
      // Only the name changes, so the hike keeps its way and the router is not asked.
      tool: 'update_tour',
      needs: ['tour'],
      setup: planHike,
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, expected_revision: 1, name: 'Renamed ridge' }),
      rest: {
        method: 'put',
        path: tourPath,
        body: () => ({ ...hikeBody('Renamed ridge'), expected_revision: 1 }),
      },
      // Not needed while only the name changes, but a hike edit must never reach a real router.
      stub: routerDown,
      expect: ['tours:changed', 'place:updated'],
    },
    {
      tool: 'import_tour_gpx',
      args: (s) => ({ tripId: s.trip.id, gpx: gpxOf(s), file_name: 'ridge.gpx' }),
      // A multipart upload, which the parity harness does not send.
      twin: 'POST /api/trips/:tripId/tours/import/gpx with the file',
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'import_wanderer_trail',
      setup: previewTrail,
      args: (s) => ({ tripId: s.trip.id, trailId: 'trail-1', contentHash: trailHash(s) }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/tours/wanderer/import`,
        body: (s) => ({ trailId: 'trail-1', contentHash: trailHash(s) }),
      },
      stub: wandererTrail,
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'save_tour_change',
      needs: ['tour'],
      setup: planWalk,
      args: (s) => ({
        tripId: s.trip.id,
        placeId: s.tourPlace.id,
        changes: WITHOUT_MARKET,
        expected_revision: 1,
        proposal_id: proposalIdOf({ tripId: s.trip.id, placeId: s.tourPlace.id, revision: 1, changes: WITHOUT_MARKET }),
        confirmed: true,
      }),
      // The planner saves the changed walk through the same route write.
      rest: { method: 'put', path: tourPath, body: () => walkBody(1) },
      stub: routerDown,
      expect: ['tours:changed', 'place:updated'],
    },
    {
      // P6: a found place taken into the walk as a station, saved as save_tour_change saves one change.
      tool: 'insert_tour_stop',
      needs: ['tour'],
      setup: planWalk,
      args: (s) => ({
        tripId: s.trip.id,
        placeId: s.tourPlace.id,
        expected_revision: 1,
        stop: { lat: 48.106, lng: 11.5, name: 'Fountain' },
        after_key: 'walk-market',
      }),
      // The planner takes a found place in as a point of its draft and saves the walk through the same route write.
      rest: { method: 'put', path: tourPath, body: () => walkBody(1) },
      stub: routerDown,
      expect: ['tours:changed', 'place:updated'],
    },
    {
      tool: 'remove_tour_stop',
      needs: ['tour'],
      setup: planWalk,
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, expected_revision: 1, key: 'walk-market' }),
      rest: { method: 'put', path: tourPath, body: () => walkBody(1) },
      stub: routerDown,
      expect: ['tours:changed', 'place:updated'],
    },
    {
      tool: 'undo_tour_change',
      needs: ['tour'],
      setup: walkWithSavedStep,
      args: (s) => ({
        tripId: s.trip.id,
        placeId: s.tourPlace.id,
        step_id: made(s),
        expected_revision: 2,
        confirmed: true,
      }),
      // Taking a step back writes the walk as it was through the route write the planner's save uses.
      rest: { method: 'put', path: tourPath, body: () => walkBody(2) },
      expect: ['tours:changed', 'place:updated'],
    },
    {
      tool: 'take_over_tour',
      needs: ['tour'],
      setup: planHike,
      args: (s) => ({ tripId: s.trip.id, source_trip_id: s.trip.id, source_place_id: s.tourPlace.id }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/tours/take-over`,
        body: (s) => ({ source_trip_id: s.trip.id, source_place_id: s.tourPlace.id }),
      },
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'assign_tour_track',
      needs: ['tour'],
      setup: async (s, app) => {
        madeFor.set(s.n, await recordedTrack(s, app));
      },
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, track_place_id: made(s), assignment_id: null }),
      rest: {
        method: 'put',
        path: (s) => `${tourPath(s)}/activities`,
        body: (s) => ({ track_place_id: made(s), assignment_id: null }),
      },
      expect: ['tours:changed'],
    },
    {
      tool: 'unassign_tour_track',
      needs: ['tour'],
      setup: async (s, app) => {
        const activity = await makeTourActivity(ormOf(app), s.tourPlace.id, await recordedTrack(s, app));
        madeFor.set(s.n, activity.id);
      },
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, activityId: made(s) }),
      rest: { method: 'delete', path: (s) => `${tourPath(s)}/activities/${made(s)}` },
      expect: ['tours:changed'],
    },
    {
      tool: 'link_tour_packing',
      needs: ['tour'],
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id, category: null }),
      rest: { method: 'put', path: (s) => `${tourPath(s)}/packing-link`, body: () => ({ category: null }) },
      expect: ['tours:changed'],
    },
    {
      tool: 'unlink_tour_packing',
      needs: ['tour'],
      setup: (s, app) => linkTourPacking(ormOf(app), s.tourPlace.id, null, s.owner.id),
      args: (s) => ({ tripId: s.trip.id, placeId: s.tourPlace.id }),
      rest: { method: 'delete', path: (s) => `${tourPath(s)}/packing-link` },
      expect: ['tours:changed'],
    },
    {
      // A collection is the user's, not the trip's: its people hear it on their own sockets.
      tool: 'save_tour_to_collection',
      needs: ['collection', 'tour'],
      setup: planHike,
      args: (s) => ({ collection_id: s.collection.id, source_trip_id: s.trip.id, source_place_id: s.tourPlace.id }),
      rest: {
        method: 'post',
        path: (s) => `/api/addons/collections/${s.collection.id}/tours`,
        body: (s) => ({ source_trip_id: s.trip.id, source_place_id: s.tourPlace.id }),
      },
      expect: [{ event: 'collections:updated', user: 'actor' }],
    },
    {
      tool: 'take_over_collection_tour',
      needs: ['collection'],
      setup: keptTour,
      args: (s) => ({
        tripId: s.trip.id,
        collection_id: s.collection.id,
        collection_tour_id: made(s),
        include_waypoints: true,
      }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/tours/from-collection`,
        body: (s) => ({ collection_id: s.collection.id, collection_tour_id: made(s), include_waypoints: true }),
      },
      expect: ['tours:changed', 'place:created'],
    },
    {
      tool: 'delete_collection_tour',
      needs: ['collection'],
      setup: keptTour,
      args: (s) => ({ collection_id: s.collection.id, collection_tour_id: made(s) }),
      rest: { method: 'delete', path: (s) => `/api/addons/collections/${s.collection.id}/tours/${made(s)}` },
      expect: [{ event: 'collections:updated', user: 'actor' }],
    },
  ],
  exempt: [
    {
      tool: 'set_tour_activity_excluded',
      reason:
        "the user's own activity sums, read fresh when the tours statistics open; both surfaces are silent, and the registry has no event for them yet",
      needs: ['tour'],
      args: (s) => ({ place_id: s.tourPlace.id, excluded: true }),
    },
  ],
};
