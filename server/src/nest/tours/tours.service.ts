import { Places } from '../../db/entities/Places.entity';
import { TourActivities } from '../../db/entities/TourActivities.entity';
import { TourStationVisits } from '../../db/entities/TourStationVisits.entity';
import { TourTypes } from '../../db/entities/TourTypes.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { TourActivitiesRepository } from '../../db/repositories/TourActivities.repository';
import type { TourStationVisitsRepository } from '../../db/repositories/TourStationVisits.repository';
import type { TourTypesRepository } from '../../db/repositories/TourTypes.repository';
import type { TourWaypointsRepository, TourWaypointWithPlaceRow } from '../../db/repositories/TourWaypoints.repository';
import type { TourDayRow, ToursRepository, TourUpdate } from '../../db/repositories/Tours.repository';
import { AssignmentsService } from '../assignments/assignments.service';
import { badRequest, DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { PlaceImportService } from '../place-import/place-import.service';
import { PlacesService } from '../places/places.service';
import { toActivity, trackTimesFor } from './tour-activities.helpers';
import {
  copiedFacet,
  copyStart,
  tourCopySourceOf,
  type TakenOverFrom,
  type TourCopyLinks,
  type TourCopySource,
} from './tour-copy.helpers';
import { readTourFile } from './tour-file-import.helpers';
import { provenanceSource, tourItemOf } from './tour-item.helpers';
import { TourPaddleCheckService } from './tour-paddle-check.service';
import { advanceTourRevision } from './tour-revision';
import { toVisit } from './tour-visits.service';
import { checkTourCommand, firstPointOf, importFileName, keyedWaypoints, tourRouteFields } from './tour-write.helpers';
import { computeTourMetrics, localHashOf, parseRouteGeometry, type GeometryPoint } from './tours.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  type BikeProfile,
  type CityWalkCreateRequest,
  type PaddleBoatType,
  type PaddleLakeStyle,
  type PaddleWaterContext,
  type RunProfile,
  type SkiDiscipline,
  type SkiTechnique,
  type TourCreateRequest,
  type TourCreateResponse,
  type TourDetailResponse,
  type TourGpxImportFields,
  type TourGpxPreviewResponse,
  type TourListItem,
  type TourOrigin,
  type TourProvenance,
  type TourWaypoint,
  tourStageKeysOf,
  type WandererDifficulty,
  walkStationsOf,
  wandererDifficultyToSac,
} from '@trek/shared';

export interface ImportGpxAsTourResult {
  tours: TourListItem[];
  caution: boolean;
  skipped: number;
}

/**
 * Tours domain: the `tours` facet table (place_id PK/FK) carries tour-specific
 * metadata while existing places and day assignments are reused.
 * A GPX, KML or KMZ file is read through PlaceImportService (readTourFile), persistence goes through
 * PlacesService.importPreparedGpx. Places and facet rows are persisted in one transaction,
 * with tour metrics derived from each place's route_geometry.
 */
/** A GPX file imported without a type is a hike. */
const HIKE_IMPORT: TourGpxImportFields = { tour_type: 'hike' };

/**
 * What a create writes: the request as the contract reads it, or for a city
 * walk an assistant created from its stations (CW-11) the way the server's
 * router planned on foot, which has no heights, or no line when it planned
 * none, which the planner then plans when the walk is opened. Its points are
 * the tour's points as the rest of the domain reads them, so a change saved
 * or taken back from MCP (MCP-T03/T04) hands in its points unconverted.
 */
export type TourCreateCommand = Omit<TourCreateRequest, 'route_geometry' | 'waypoints'> & {
  route_geometry: GeometryPoint[] | null;
  waypoints: TourWaypoint[];
};

/** A route write checked and ready for its transaction: the write, where the tour starts and its fields. */
export interface TourRouteWrite {
  input: TourCreateCommand;
  start: GeometryPoint;
  fields: TourUpdate;
}

/** What a route write took along: the visits of stations that are gone, and the days that held a stage that is gone (MDT-02). */
export interface TourRouteDrops {
  visitsDropped: readonly number[];
  stagesDropped: ReadonlyArray<{ id: number; day_id: number }>;
}

/** The way on foot the server's router planned for a city walk (CW-11): its line, and how long it walks in seconds. */
interface CityWalkFootRoute {
  line: Array<[number, number]>;
  seconds: number;
}

@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly places: PlacesService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(TourTypes) private readonly tourTypesRepo: TourTypesRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
    @InjectRepository(TourStationVisits) private readonly visitsRepo: TourStationVisitsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(TourActivities) private readonly activitiesRepo: TourActivitiesRepository,
    private readonly placeImport: PlaceImportService,
    private readonly paddleChecks: TourPaddleCheckService,
    private readonly assignments: AssignmentsService,
  ) {}

  /**
   * `tour_types` knows every key the contract accepts, most of them disabled.
   * Checked before the write, so a disabled type is a 400 and not a tour the
   * planner cannot show. The refusals here are DomainErrors, so REST answers
   * `{ error }` and an MCP tool the same text as its error result.
   */
  private async assertTourTypeEnabled(key: string): Promise<void> {
    if (!(await this.tourTypesRepo.isEnabled(key))) throw badRequest('Tour type is not available');
  }

  /** All tours (the facet + owning place) for a trip, newest first; a paddle tour with its check bench (PAD-09). */
  async listTours(tripId: string): Promise<TourListItem[]> {
    const tid = toRowId(tripId);
    if (tid === null) return [];
    const rows = await this.toursRepo.listForTrip(tid);
    const listedPoints = await this.listedPointsByPlace(rows);
    const activities = await this.activitiesRepo.listForTrip(tid);
    return await this.paddleChecks.forTrip(
      tid,
      rows.map((r) => tourItemOf(r, listedPoints.get(r.place_id) ?? [], activities)),
    );
  }

  /**
   * The points a list reads, by tour: a city walk's, which it counts the
   * stations and stays of (CW-02, CW-03), and a multi-day tour's, which it
   * reads the stops between the stages off (MDT-02). The points of any other
   * tour are not read.
   */
  async listedPointsByPlace(
    rows: readonly { place_id: number; tour_type: string; stage_ends?: number }[],
  ): Promise<Map<number, TourWaypointWithPlaceRow[]>> {
    const byPlace = new Map<number, TourWaypointWithPlaceRow[]>();
    const read = rows.filter((row) => row.tour_type === 'walk' || (row.stage_ends ?? 0) > 0).map((row) => row.place_id);
    for (const point of await this.waypointsRepo.listForPlaces(read)) {
      const points = byPlace.get(point.place_id);
      if (points) points.push(point);
      else byPlace.set(point.place_id, [point]);
    }
    return byPlace;
  }

  /** The days every tour of the trip sits on, for the MCP read tools. */
  async listTourDays(tripId: number): Promise<TourDayRow[]> {
    return await this.toursRepo.listTourDays(tripId);
  }

  /**
   * MCP-T01: the saved line of a tour of this trip, as stored; empty for a
   * place out of the trip and for a tour saved with its points only.
   */
  async savedLine(tripId: number, placeId: number): Promise<GeometryPoint[]> {
    return parseRouteGeometry((await this.placesRepo.findInTrip(placeId, tripId))?.route_geometry);
  }

  /** One saved tour plus the persisted routing controls needed by the editor. */
  async getTour(tripId: string, placeId: string): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    const row = tid !== null && pid !== null ? await this.toursRepo.findInTrip(tid, pid) : undefined;
    if (!row || tid === null) throw new NotFoundException('Tour not found');

    const stored: TourWaypoint[] = await this.waypointsRepo.listForPlace(row.place_id);
    let waypoints = stored;
    // A recorded paddle track's checklist reads its line, so the place is read for it as for the controls below.
    const place =
      waypoints.length < 2 || row.tour_type === 'kayak' ? await this.placesRepo.findInTrip(row.place_id, tid) : null;
    // GPX tours created before tour_waypoints existed still belong in this
    // all-tours rail. A read-only endpoint must not backfill the database, so
    // expose their saved geometry endpoints as controls; the first edit/save
    // replaces them with normal persisted tour_waypoints transactionally.
    if (waypoints.length < 2) {
      const geometry = parseRouteGeometry(place?.route_geometry);
      if (geometry.length >= 2) {
        const start = geometry[0];
        const end = geometry[geometry.length - 1];
        waypoints = [
          { lat: start[0], lng: start[1], role: 'start', sequence: 0 },
          { lat: end[0], lng: end[1], role: 'end', sequence: 1 },
        ];
      }
    }

    // ACT-01: the recordings assigned to this tour, and the assignment this tour is the recording of.
    const activities = await this.activitiesRepo.listForPlace(tid, row.place_id);
    const documents = await this.activitiesRepo.findByTrack(row.place_id);
    const refs = documents ? [...activities, documents] : activities;
    const checked = await this.paddleChecks.forTour(
      tourItemOf(row, stored, refs),
      stored,
      place?.route_geometry ?? null,
    );
    return {
      tour: checked.item,
      waypoints,
      provenance: await this.provenanceOf(tid, row.place_id),
      ...(checked.obstacle_check ? { obstacle_check: checked.obstacle_check } : {}),
      activities: activities.map(toActivity),
    };
  }

  /**
   * Where a tour came from (P2C-02): the origin it was saved with, what its
   * source carried, the import it was planned from, and whether it still
   * matches the import. Nothing here is guessed: a field the tour never
   * recorded stays null.
   */
  private async provenanceOf(tripId: number, placeId: number): Promise<TourProvenance> {
    const row = await this.toursRepo.findProvenance(tripId, placeId);
    if (!row) throw new NotFoundException('Tour not found');
    const origin = row.origin as TourOrigin;
    return {
      origin,
      createdAt: row.created_at,
      source: provenanceSource(origin, row),
      derivedFrom:
        row.derived_from_place_id !== null && row.derived_from_name !== null
          ? { placeId: row.derived_from_place_id, name: row.derived_from_name }
          : null,
      plannedOver: row.has_recorded_track === 1,
      editedLocally:
        origin === 'wanderer' && row.source_local_hash !== null
          ? localHashOf(row.name, parseRouteGeometry(row.route_geometry)) !== row.source_local_hash
          : null,
      takenOverFrom:
        row.taken_over_from_trip_title != null && row.taken_over_from_tour_name != null
          ? { tripTitle: row.taken_over_from_trip_title, tourName: row.taken_over_from_tour_name }
          : null,
    };
  }

  /**
   * Create the owning Place, Tours facet, and ordered control points as one write. A create
   * without a line (CW-11) puts the place at its first point.
   */
  async createTour(tripId: string, input: TourCreateCommand, socketId?: string): Promise<TourCreateResponse> {
    // The controller's TripAccessGuard already resolved this trip id.
    const tid = toRowId(tripId)!;
    const placeId = await this.uow.transactional(() => this.insertTour(tid, input));
    return await this.announceCreatedTour(tripId, placeId, socketId);
  }

  /**
   * The rows of a new tour (its place, its facet, its control points), written
   * inside the caller's transaction after the same checks, so a caller can put
   * more into that write (a hike put on its day). Answers the new place's id;
   * the trip is told by announceCreatedTour once the write committed.
   */
  async insertTour(tid: number, input: TourCreateCommand): Promise<number> {
    await this.assertTourTypeEnabled(input.tour_type);
    checkTourCommand(input);
    const start = input.route_geometry ? input.route_geometry[0] : firstPointOf(input.waypoints);
    if (!start || (input.route_geometry === null && input.waypoints.length < 2)) {
      throw badRequest('A tour needs at least two points');
    }
    const fields = tourRouteFields(input);
    const derivedFrom = input.derived_from_place_id ?? null;
    // What it was planned from has to be an import (no waypoints of its own) of this same trip,
    // read in the write so it cannot go meanwhile.
    if (derivedFrom !== null) {
      const source = await this.toursRepo.findInTrip(tid, derivedFrom);
      if (!source || source.origin === 'trek' || source.has_waypoints) {
        throw new DomainError(400, 'derived_from_place_id is not an imported tour of this trip');
      }
    }
    const id = await this.placesRepo.insertTourPlace({
      trip_id: tid,
      name: input.name,
      lat: start[0],
      lng: start[1],
      route_geometry: input.route_geometry ? JSON.stringify(input.route_geometry) : null,
      description: input.description ?? null,
      website: input.website ?? null,
    });
    await this.toursRepo.insertTour({
      place_id: id,
      ...fields,
      planned_duration_minutes: fields.planned_duration_minutes ?? null,
      break_additional_minutes: fields.break_additional_minutes ?? null,
      derived_from_place_id: derivedFrom,
    });
    await this.waypointsRepo.insertForPlace(id, keyedWaypoints(await this.linkedWaypoints(tid, input.waypoints)));
    return id;
  }

  /** A tour just written, read back as a create answers it, and the trip told once every row committed. */
  async announceCreatedTour(tripId: string, placeId: number, socketId?: string): Promise<TourCreateResponse> {
    const tid = toRowId(tripId)!;
    const row = await this.toursRepo.findInTrip(tid, placeId);
    const place = await this.placesRepo.findWithTagsAndRatings(placeId);
    if (!row || !place) throw new Error('Created tour could not be loaded');
    const waypoints = await this.waypointsRepo.listForPlace(placeId);

    // Only announce after every row committed. The originating client reloads
    // explicitly because socket-id exclusion intentionally suppresses its echo.
    this.broadcastToursChanged(tripId, [placeId], socketId);
    try {
      this.places.broadcast(tripId, 'place:created', { place }, socketId);
    } catch {
      this.logger.warn(`Committed Tour ${placeId}: place notification failed`);
    }
    const checked = await this.paddleChecks.forTour(
      tourItemOf(row, waypoints),
      waypoints,
      place.route_geometry ?? null,
    );
    return {
      tour: checked.item,
      waypoints,
      provenance: await this.provenanceOf(tid, placeId),
      ...(checked.obstacle_check ? { obstacle_check: checked.obstacle_check } : {}),
      // ACT-01: answered as the read answers it; a tour just made has no recording assigned yet.
      activities: [],
    };
  }

  /**
   * CW-11: a city walk the traveller confirmed through an assistant, made the
   * way the planner's save makes one, in the same write with the same checks:
   * its stations in order, each with a key of its own, its links to the trip's
   * places checked. Its distance and walking time come from the way the
   * server's router planned on foot. Without one it is saved with its stations
   * only: no line, no distance and no walking time, until the planner plans the
   * way when it is opened.
   */
  async createCityWalk(
    tripId: string,
    input: CityWalkCreateRequest,
    way: CityWalkFootRoute | null,
  ): Promise<TourCreateResponse> {
    const last = input.stations.length - 1;
    return await this.createTour(tripId, {
      name: input.name,
      description: input.description,
      tour_type: 'walk',
      route_geometry: way?.line ?? null,
      duration_seconds: way?.seconds ?? null,
      max_hiking_difficulty: null,
      waypoints: input.stations.map((station, sequence) => ({
        ...station,
        role: sequence === 0 ? 'start' : sequence === last ? 'end' : 'via',
        sequence,
      })),
    });
  }

  /**
   * Takes an import that was planned over in place back to the track it was
   * recorded with: its line, the measures read from that line and the grade
   * its source gave, without the waypoints. The tour keeps its id, days and notes.
   */
  async restoreRecordedTrack(tripId: string, placeId: string, socketId?: string): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');

    const stagesDropped = await this.uow.transactional(async () => {
      const row = await this.toursRepo.findInTrip(tid, pid);
      if (!row) throw new NotFoundException('Tour not found');
      const recorded = await this.toursRepo.findRecordedTrack(tid, pid);
      if (recorded === null) {
        throw new DomainError(409, 'This tour keeps no recorded track to go back to', {
          code: 'no_recorded_track',
          details: { code: 'no_recorded_track' },
        });
      }
      const geometry = parseRouteGeometry(recorded);
      const start = geometry[0];
      if (!start)
        throw new DomainError(409, 'The recorded track of this tour is empty', {
          code: 'no_recorded_track',
          details: { code: 'no_recorded_track' },
        });
      const metrics = computeTourMetrics(geometry);
      await advanceTourRevision(this.toursRepo, pid);
      await this.placesRepo.updateTourRoute(pid, tid, {
        name: row.name,
        lat: start[0],
        lng: start[1],
        route_geometry: recorded,
      });
      await this.toursRepo.updateInTrip(tid, pid, {
        tour_type: row.tour_type,
        distance: metrics.distanceKm,
        elevation_gain: metrics.elevationGainM,
        elevation_loss: metrics.elevationLossM,
        duration: null,
        match_confidence: metrics.hasElevation ? 1 : 0.3,
        // The grade its source gave, on the one scale tours use; a GPX file gives none.
        max_hiking_difficulty:
          row.wanderer_ref && row.tour_type === 'hike'
            ? wandererDifficultyToSac(row.difficulty as WandererDifficulty | null)
            : null,
        bike_profile: row.bike_profile as BikeProfile | null,
        run_profile: row.run_profile as RunProfile | null,
        run_pace_seconds_per_km: row.run_pace_seconds_per_km,
        ski_discipline: row.ski_discipline as SkiDiscipline | null,
        ski_technique: row.ski_technique as SkiTechnique | null,
        boat_type: row.boat_type as PaddleBoatType | null,
        water_context: row.water_context as PaddleWaterContext | null,
        paddle_speed_kmh: row.paddle_speed_kmh,
        portage_speed_kmh: row.portage_speed_kmh,
        paddle_lake_style: row.paddle_lake_style as PaddleLakeStyle | null,
      });
      await this.waypointsRepo.deleteForPlace(pid);
      await this.toursRepo.clearRecordedTrack(pid);
      // MDT-02: back to the recorded track the tour has no stages, so no day holds one.
      return await this.assignments.dropStaleTourStages(pid, []);
    });

    const result = await this.getTour(tripId, placeId);
    const place = await this.placesRepo.findWithTagsAndRatings(pid);
    if (!place) throw new Error('Restored tour could not be loaded');
    this.broadcastToursChanged(tripId, [pid], socketId);
    try {
      this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    } catch {
      this.logger.warn(`Committed Tour ${placeId}: place notification failed`);
    }
    await this.announceStagesDropped(tripId, stagesDropped);
    return result;
  }

  /**
   * P2C-07 "save as new tour": an independent tour made from one of the trip,
   * with its own id, its own copy of the line and the control points, the
   * same measures and source, and none of the days. It points at the tour it
   * came from (`derived_from_place_id`), so the detail can name it; nothing
   * keeps the two in step afterwards.
   */
  async copyTour(tripId: string, placeId: string, name: string, socketId?: string): Promise<TourCreateResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');
    // Within the trip: the copy points at the tour it was planned from, keeps its
    // stops' links to the trip's places and the decisions about its obstacles.
    const copyId = await this.uow.transactional(async () =>
      this.insertCopy(await this.requireCopySource(tid, pid), { tid, name }, { derivedFrom: pid, sameTrip: true }),
    );
    return await this.announceCopy(tripId, copyId, socketId);
  }

  /**
   * LIB-02: an independent copy of a tour of another trip, written into this
   * trip. The caller has checked that the user may open the source trip; the
   * source is read here again, inside the write, so a tour gone meanwhile
   * leaves nothing behind. The copy keeps where it came from as text, and none
   * of what belongs to the other trip: no link to its places or its import, no
   * decisions its people took about obstacles, no days.
   */
  async takeOverTour(
    tripId: string,
    source: { tripId: number; placeId: number; tripTitle: string; tourName: string },
    name: string,
    socketId?: string,
  ): Promise<TourCreateResponse> {
    const tid = toRowId(tripId);
    if (tid === null) throw new NotFoundException('Tour not found');
    const copyId = await this.uow.transactional(async () =>
      this.insertCopy(
        await this.requireCopySource(source.tripId, source.placeId),
        { tid, name },
        { derivedFrom: null, sameTrip: false, takenOverFrom: source },
      ),
    );
    return await this.announceCopy(tripId, copyId, socketId);
  }

  /**
   * LIB-03: a tour of this trip made from a tour kept in a collection, the way
   * a take-over makes one: its own id, the kept line, type, measures and
   * settings, the points `read` hands over (none when they were left out) and
   * no days. `read` runs inside the write, so a kept tour removed meanwhile
   * leaves nothing behind. The new tour names the trip and tour the kept one
   * was saved from.
   */
  async createFromKeptTour(
    tripId: string,
    read: () => Promise<TourCopySource>,
    name: string,
    takenOverFrom: TakenOverFrom,
    socketId?: string,
  ): Promise<TourCreateResponse> {
    const tid = toRowId(tripId);
    if (tid === null) throw new NotFoundException('Tour not found');
    const copyId = await this.uow.transactional(async () =>
      this.insertCopy(await read(), { tid, name }, { derivedFrom: null, sameTrip: false, takenOverFrom }),
    );
    return await this.announceCopy(tripId, copyId, socketId);
  }

  /**
   * A saved tour of a trip as a copy is made from it, read whole: its line and
   * texts, every measure and setting, where it came from and its control
   * points. Undefined when the place is no tour of that trip.
   */
  async readCopySource(tripId: number, placeId: number): Promise<TourCopySource | undefined> {
    const [row, provenance, waypoints] = await Promise.all([
      this.toursRepo.findInTrip(tripId, placeId),
      this.toursRepo.findProvenance(tripId, placeId),
      this.waypointsRepo.listForPlace(placeId),
    ]);
    return row && provenance ? tourCopySourceOf(row, provenance, waypoints) : undefined;
  }

  private async requireCopySource(tripId: number, placeId: number): Promise<TourCopySource> {
    const source = await this.readCopySource(tripId, placeId);
    if (!source) throw new NotFoundException('Tour not found');
    return source;
  }

  /**
   * One copy of a tour: its place with the same line, its facet with every
   * measure and setting, its control points. Inside the caller's transaction.
   */
  private async insertCopy(
    source: TourCopySource,
    target: { tid: number; name: string },
    links: TourCopyLinks,
  ): Promise<number> {
    // A line that holds no point, and a walk without line or stations, have nothing to copy.
    const start = copyStart(source);
    if (!start) throw new NotFoundException('Tour not found');
    if (!links.sameTrip) await this.assertTourTypeEnabled(source.facet.tour_type);
    const id = await this.placesRepo.insertTourPlace({
      trip_id: target.tid,
      name: target.name,
      lat: start[0],
      lng: start[1],
      route_geometry: source.route_geometry,
      description: source.description,
      website: source.website,
    });
    await this.toursRepo.insertTour(copiedFacet(source, id, links));
    // A stop standing for a place of the source trip stands for nothing in another trip.
    await this.waypointsRepo.insertForPlace(
      id,
      links.sameTrip ? source.waypoints : source.waypoints.map((point) => ({ ...point, linked_place_id: null })),
    );
    if (source.place_id === null) return id;
    if (links.sameTrip) {
      // The copy keeps the decisions about its obstacles, bound to what they were decided on.
      await this.toursRepo.copyObstacleReviews(source.place_id, id);
    } else {
      // The import record says where the line itself came from, whichever trip holds it.
      await this.toursRepo.copySource(source.place_id, id);
    }
    return id;
  }

  /** After a copy committed: the trip's tours and places follow it live, and the copy is answered as the editor reads it. */
  private async announceCopy(tripId: string, copyId: number, socketId?: string): Promise<TourCreateResponse> {
    const result = await this.getTour(tripId, String(copyId));
    const created = await this.placesRepo.findWithTagsAndRatings(copyId);
    this.broadcastToursChanged(tripId, [copyId], socketId);
    try {
      if (created) this.places.broadcast(tripId, 'place:created', { place: created }, socketId);
    } catch {
      this.logger.warn(`Committed Tour copy ${copyId}: place notification failed`);
    }
    return result;
  }

  /** Replace a saved tour's derived route and routing controls as one write. */
  async updateTour(
    tripId: string,
    placeId: string,
    input: TourCreateRequest,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');
    const write = await this.routeWrite(input);
    const dropped = await this.uow.transactional(() => this.replaceRoute(tid, pid, write));
    return await this.announceRouteUpdate(tripId, pid, dropped, socketId);
  }

  /**
   * A route write checked before its transaction opens: its type switched on,
   * its texts and times valid, where it starts and the tour fields it writes.
   * A city walk saved from a confirmed change (MCP-T03) may come without a
   * line, as a created one may (CW-11): it is then at its first point, and the
   * planner plans the way when it is opened.
   */
  async routeWrite(input: TourCreateCommand): Promise<TourRouteWrite> {
    await this.assertTourTypeEnabled(input.tour_type);
    checkTourCommand(input);
    const start = input.route_geometry ? input.route_geometry[0] : firstPointOf(input.waypoints);
    if (!start) throw badRequest('A tour needs at least two points');
    return { input, start, fields: tourRouteFields(input) };
  }

  /**
   * A saved tour's route, points and visits written inside the caller's transaction, so what else a
   * caller records of the change (MCP-T03) commits or rolls back with it. Answers the revision it
   * raised the tour to and the day assignments whose visits went with a station that is gone.
   */
  async replaceRoute(
    tripId: number,
    placeId: number,
    { input, start, fields }: TourRouteWrite,
  ): Promise<{ revision: number } & TourRouteDrops> {
    // The trip predicate is the cross-trip boundary. It runs inside the write
    // so an id from another accessible trip cannot be moved into the current
    // one, and a place deleted meanwhile answers 404 instead of failing a
    // waypoint insert on its foreign key.
    if (!(await this.toursRepo.findInTrip(tripId, placeId))) throw new NotFoundException('Tour not found');
    // P2C-03: refused here, before anything is written, while the draft's tour has moved on.
    const revision = await advanceTourRevision(this.toursRepo, placeId, input.expected_revision);
    // An import planned over for the first time keeps the track it was recorded with.
    await this.toursRepo.keepRecordedTrack(placeId);
    const placeUpdated = await this.placesRepo.updateTourRoute(placeId, tripId, {
      name: input.name,
      lat: start[0],
      lng: start[1],
      route_geometry: input.route_geometry ? JSON.stringify(input.route_geometry) : null,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
    });
    if (!placeUpdated) throw new NotFoundException('Tour not found');
    if (!(await this.toursRepo.updateInTrip(tripId, placeId, fields))) throw new NotFoundException('Tour not found');
    await this.waypointsRepo.deleteForPlace(placeId);
    const waypoints = keyedWaypoints(await this.linkedWaypoints(tripId, input.waypoints));
    await this.waypointsRepo.insertForPlace(placeId, waypoints);
    // CW-03: a station that is gone takes its visits with it; a tour that is no city walk keeps none.
    const stations = input.tour_type === 'walk' ? walkStationsOf(waypoints).map((point) => point.key) : [];
    return {
      revision,
      visitsDropped: await this.visitsRepo.dropStationsNotIn(placeId, stations),
      // MDT-02: a stage the change took away (its stage end gone, the tour a day tour again) leaves its day.
      stagesDropped: await this.assignments.dropStaleTourStages(placeId, tourStageKeysOf(waypoints)),
    };
  }

  /** After a route write committed: the tour read back, and the trip told of it and of the visits and stages it took along. */
  async announceRouteUpdate(
    tripId: string,
    placeId: number,
    { visitsDropped, stagesDropped }: TourRouteDrops,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const result = await this.getTour(tripId, String(placeId));
    const place = await this.placesRepo.findWithTagsAndRatings(placeId);
    if (!place) throw new Error('Updated tour could not be loaded');
    this.broadcastToursChanged(tripId, [placeId], socketId);
    try {
      this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    } catch {
      this.logger.warn(`Committed Tour ${placeId}: place notification failed`);
    }
    await this.announceVisits(tripId, visitsDropped);
    await this.announceStagesDropped(tripId, stagesDropped);
    return result;
  }

  /**
   * MDT-02: the days that held a stage a change took away, told to every
   * client of the trip, the one that saved included, since its day plan still
   * shows them; the journey follows the days as after any unassign.
   */
  private async announceStagesDropped(
    tripId: string,
    dropped: ReadonlyArray<{ id: number; day_id: number }>,
  ): Promise<void> {
    if (dropped.length === 0) return;
    for (const { id, day_id } of dropped) {
      try {
        this.places.broadcast(tripId, 'assignment:deleted', { assignmentId: id, dayId: day_id }, undefined);
      } catch {
        this.logger.warn(`Committed Tour stage change: realtime notification of assignment ${id} failed`);
      }
    }
    await this.assignments.reconcile(tripId);
  }

  /**
   * CW-03: the days whose visits an edit took along, told to every client of
   * the trip, the one that saved included, so no day plan goes on counting a
   * station the walk no longer has.
   */
  private async announceVisits(tripId: string, assignmentIds: readonly number[]): Promise<void> {
    await Promise.all(
      assignmentIds.map(async (assignmentId) => {
        const visits = (await this.visitsRepo.listForAssignment(assignmentId)).map(toVisit);
        try {
          this.places.broadcast(tripId, 'tours:visits', { assignmentId, visits }, undefined);
        } catch {
          this.logger.warn(`Committed Tour visits of assignment ${assignmentId}: realtime notification failed`);
        }
      }),
    );
  }

  /** PR1-10: the names of the places the points stand for, for a reader that wants them spelled out. */
  async linkedPlaceNames(tripId: number, waypoints: readonly TourWaypoint[]): Promise<Map<number, string>> {
    return await this.waypointsRepo.placeNames(
      tripId,
      waypoints.flatMap((point) => (point.linked_place_id ? [point.linked_place_id] : [])),
    );
  }

  /**
   * PR1-10: the points of a write with their links checked, inside its
   * transaction. A point may stand for a place of the tour's trip that is not
   * a tour itself; naming a tour of the trip is refused. A place that is gone,
   * or one this trip does not have, leaves the point unlinked, the same either
   * way, so a draft or a queued write that outlived its place still saves and
   * no answer tells another trip's ids apart.
   */
  private async linkedWaypoints(tripId: number, waypoints: TourWaypoint[]): Promise<TourWaypoint[]> {
    const ids = waypoints.flatMap((point) => (point.linked_place_id ? [point.linked_place_id] : []));
    if (ids.length === 0) return waypoints;
    const linkable = await this.waypointsRepo.linkablePlaceIds(tripId, ids);
    // A place that cannot be linked may be a tour of this trip, which a stop never stands for.
    const tours = await Promise.all(
      ids.filter((id) => !linkable.has(id)).map((id) => this.toursRepo.findInTrip(tripId, id)),
    );
    if (tours.some(Boolean)) {
      throw new DomainError(400, 'A waypoint cannot stand for a tour', {
        code: 'waypoint_links_a_tour',
        details: { code: 'waypoint_links_a_tour' },
      });
    }
    return waypoints.map((point) =>
      point.linked_place_id && !linkable.has(point.linked_place_id) ? { ...point, linked_place_id: null } : point,
    );
  }

  /** Tells the trip's other clients to reload these tours; a failed notice never fails the committed write. */
  broadcastToursChanged(tripId: string, placeIds: number[], socketId?: string): void {
    try {
      this.places.broadcast(tripId, 'tours:changed', { placeIds }, socketId);
    } catch {
      this.logger.warn(`Committed Tours change for trip ${tripId}: realtime invalidation failed`);
    }
  }

  /**
   * The tours-mode file import reads rows through readTourFile: a GPX file's
   * tracks and routes with its waypoints excluded, a KML or KMZ file's lines
   * (IO-02). PlacesService.importPreparedGpx persists the places in the same
   * transaction as their `tours` facet rows, whose metrics are derived from
   * route_geometry, so a failure leaves no tour half stored.
   *
   * Missing or implausible metrics do not block import:
   * a track without elevation still imports, just flagged with a low
   * match_confidence so the client can surface a "with caution" toast.
   */
  async importGpxAsTour(
    tripId: string,
    fileBuffer: Buffer,
    fileName?: string,
    socketId?: string,
    fields: TourGpxImportFields = HIKE_IMPORT,
  ): Promise<ImportGpxAsTourResult | null> {
    const { rows } = await readTourFile(this.placeImport, fileBuffer, fileName);
    if (rows.length === 0) return null;
    await this.assertTourTypeEnabled(fields.tour_type);
    // What the type adds to each imported tour: a bike tour and a run their profile, a paddle tour its boat and water,
    // a ski track its discipline and technique (SKI-02). A run comes in without a pace and a ski track without a
    // time: neither is worked out for them, so they stay unknown.
    const typeFields = {
      bike_profile: fields.bike_profile ?? null,
      run_profile: fields.run_profile ?? null,
      run_pace_seconds_per_km: null,
      ski_discipline: fields.ski_discipline ?? null,
      ski_technique: fields.ski_technique ?? null,
      boat_type: fields.boat_type ?? null,
      water_context: fields.water_context ?? null,
      paddle_speed_kmh: null,
    };

    const tours: TourListItem[] = [];
    const result = await this.uow.transactional(async () => {
      // A nested transactional, so the places and their facets commit together.
      const imported = await this.places.importPreparedGpx(tripId, rows);
      const times = trackTimesFor(rows, imported.places);
      for (const place of imported.places) {
        const recorded = times.get(place.id);
        const metrics = computeTourMetrics(parseRouteGeometry(place.route_geometry));
        const matchConfidence = metrics.hasElevation ? 1 : 0.3;
        await this.toursRepo.insertTour({
          place_id: place.id,
          tour_type: fields.tour_type,
          ...typeFields,
          distance: metrics.distanceKm,
          elevation_gain: metrics.elevationGainM,
          elevation_loss: metrics.elevationLossM,
          duration: null,
          planned_duration_minutes: null,
          break_additional_minutes: null,
          match_confidence: matchConfidence,
          max_hiking_difficulty: null,
          origin: 'gpx',
          origin_file_name: importFileName(fileName),
          track_started_at: recorded?.started ?? null,
          track_ended_at: recorded?.ended ?? null,
        });
        tours.push(
          tourItemOf({
            place_id: place.id,
            name: place.name,
            description: place.description ?? null,
            website: place.website ?? null,
            tour_type: fields.tour_type,
            ...typeFields,
            distance: metrics.distanceKm,
            elevation_gain: metrics.elevationGainM,
            elevation_loss: metrics.elevationLossM,
            duration: null,
            planned_duration_minutes: null,
            break_additional_minutes: null,
            difficulty: null,
            wanderer_ref: null,
            match_confidence: matchConfidence,
            max_hiking_difficulty: null,
            derived_from_place_id: null,
            origin: 'gpx',
            portage_speed_kmh: null,
            paddle_lake_style: null,
            track_marks: null,
            has_recorded_track: 0,
            planned: 0,
            has_waypoints: 0,
            stage_ends: 0,
            route_missing: 0,
            revision: 1,
            hiking_preferences: null,
            track_started_at: recorded?.started ?? null,
            track_ended_at: recorded?.ended ?? null,
          }),
        );
      }
      return imported;
    });

    if (result.places.length === 0) return { tours: [], caution: false, skipped: result.skipped };
    this.broadcastToursChanged(
      tripId,
      result.places.map((place) => place.id),
      socketId,
    );
    for (const place of result.places) {
      try {
        this.places.broadcast(tripId, 'place:created', { place }, socketId);
      } catch {
        this.logger.warn(`Committed GPX place ${place.id}: realtime notification failed`);
      }
    }
    return { tours, caution: tours.some((t) => t.caution), skipped: result.skipped };
  }

  /**
   * PAD-02: what a file would import, read with the import's own parser and
   * duplicate rule and written nowhere. Null when the file holds no track or
   * route, the import's own refusal. A KML or KMZ file also says what it holds
   * besides its lines (IO-02).
   */
  async previewGpx(tripId: string, fileBuffer: Buffer, fileName?: string): Promise<TourGpxPreviewResponse | null> {
    const { rows, leftOut } = await readTourFile(this.placeImport, fileBuffer, fileName);
    if (rows.length === 0) return null;
    const duplicates = await this.places.gpxDuplicates(tripId, rows);
    return {
      tracks: rows.map((row, index) => {
        const geometry = parseRouteGeometry(row.routeGeometry);
        const metrics = computeTourMetrics(geometry);
        return {
          name: row.name,
          geometry,
          point_count: geometry.length,
          distance_km: metrics.distanceKm,
          elevation_gain_m: metrics.elevationGainM,
          elevation_loss_m: metrics.elevationLossM,
          started_at: row.trackTimes?.startedAt ?? null,
          ended_at: row.trackTimes?.endedAt ?? null,
          duplicate: duplicates[index] ?? false,
        };
      }),
      ...(leftOut ? { left_out: leftOut } : {}),
    };
  }
}
