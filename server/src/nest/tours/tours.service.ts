import { Places } from '../../db/entities/Places.entity';
import { TourTypes } from '../../db/entities/TourTypes.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TOUR_TRACK_MARKS } from '../../db/json-columns';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { TourTypesRepository } from '../../db/repositories/TourTypes.repository';
import type { TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import type {
  TourDayRow,
  TourListRow,
  TourProvenanceRow,
  ToursRepository,
  TourUpdate,
} from '../../db/repositories/Tours.repository';
import { decodeJson } from '../../utils/json-column';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { PlaceImportService } from '../place-import/place-import.service';
import { PlacesService } from '../places/places.service';
import { TourPaddleCheckService } from './tour-paddle-check.service';
import {
  computeTourMetrics,
  localHashOf,
  parseRouteGeometry,
  LOW_CONFIDENCE_THRESHOLD,
  type GeometryPoint,
} from './tours.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  plannedTourDurationMinutesSchema,
  tourWebsiteSchema,
  type PaddleBoatType,
  type PaddleWaterContext,
  type TourCreateRequest,
  type TourCreateResponse,
  type TourDetailResponse,
  type TourGpxImportFields,
  type TourGpxPreviewResponse,
  type TourListItem,
  type TourOrigin,
  type TourProvenance,
  type TourProvenanceSource,
  type TourWaypoint,
  type WandererDifficulty,
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
 * GPX parsing goes through PlaceImportService.readGpx, persistence through
 * PlacesService.importPreparedGpx. Places and facet rows are persisted in one transaction,
 * with tour metrics derived from each place's route_geometry.
 */
/** A GPX file imported without a type is a hike. */
const HIKE_IMPORT: TourGpxImportFields = { tour_type: 'hike' };

@Injectable()
export class ToursService {
  private readonly logger = new Logger(ToursService.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly places: PlacesService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(TourTypes) private readonly tourTypesRepo: TourTypesRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    private readonly placeImport: PlaceImportService,
    private readonly paddleChecks: TourPaddleCheckService,
  ) {}

  private toItem(r: TourListRow): TourListItem {
    return {
      place_id: r.place_id,
      name: r.name,
      description: r.description,
      website: r.website,
      tour_type: r.tour_type as TourListItem['tour_type'],
      distance: r.distance,
      elevation_gain: r.elevation_gain,
      elevation_loss: r.elevation_loss,
      duration: r.duration,
      planned_duration_minutes: r.planned_duration_minutes,
      break_additional_minutes: r.break_additional_minutes,
      difficulty: r.difficulty,
      wanderer_ref: r.wanderer_ref,
      match_confidence: r.match_confidence,
      max_hiking_difficulty: r.max_hiking_difficulty,
      derived_from_place_id: r.derived_from_place_id,
      origin: r.origin as TourOrigin,
      boat_type: r.boat_type as PaddleBoatType | null,
      water_context: r.water_context as PaddleWaterContext | null,
      paddle_speed_kmh: r.paddle_speed_kmh,
      portage_speed_kmh: r.portage_speed_kmh,
      track_marks: decodeJson(TOUR_TRACK_MARKS, r.track_marks, 'tour'),
      has_recorded_track: Boolean(r.has_recorded_track),
      planned: Boolean(r.planned),
      caution: r.match_confidence !== null && r.match_confidence < LOW_CONFIDENCE_THRESHOLD,
      has_waypoints: Boolean(r.has_waypoints),
    };
  }

  /** The route a create or an update writes: metrics derived from the geometry, duration stored in minutes. */
  private routeFields(input: TourCreateRequest): TourUpdate {
    const metrics = computeTourMetrics(input.route_geometry as GeometryPoint[]);
    // A paddle tour drawn here has its heights read off the banks at the points set, not
    // off the water: its ascent and descent stay unknown rather than wrong.
    const heightsKnown = input.tour_type !== 'kayak';
    return {
      tour_type: input.tour_type,
      distance: metrics.distanceKm,
      elevation_gain: heightsKnown ? metrics.elevationGainM : null,
      elevation_loss: heightsKnown ? metrics.elevationLossM : null,
      duration: input.duration_seconds == null ? null : Math.round(input.duration_seconds / 60),
      ...(input.planned_duration_minutes !== undefined
        ? { planned_duration_minutes: input.planned_duration_minutes }
        : {}),
      ...(input.break_additional_minutes !== undefined
        ? { break_additional_minutes: input.break_additional_minutes }
        : {}),
      match_confidence: 1,
      max_hiking_difficulty: input.max_hiking_difficulty,
      boat_type: input.boat_type ?? null,
      water_context: input.water_context ?? null,
      paddle_speed_kmh: input.paddle_speed_kmh ?? null,
      portage_speed_kmh: input.portage_speed_kmh ?? null,
    };
  }

  /**
   * `tour_types` knows every key the contract accepts, most of them disabled.
   * Checked before the write, so a disabled type is a 400 and not a tour the
   * planner cannot show.
   */
  private async assertTourTypeEnabled(key: string): Promise<void> {
    if (!(await this.tourTypesRepo.isEnabled(key))) throw new BadRequestException('Tour type is not available');
  }

  private validateInformationalMetadata(input: TourCreateRequest): void {
    if (input.description != null && input.description.length > 2000) {
      throw new BadRequestException('description must be 2000 characters or less');
    }
    if (input.website != null && !tourWebsiteSchema.safeParse(input.website).success) {
      throw new BadRequestException('website must be a valid HTTPS URL without credentials');
    }
  }

  private validatePlannedTimes(input: TourCreateRequest): void {
    for (const value of [input.planned_duration_minutes, input.break_additional_minutes]) {
      if (value !== undefined && !plannedTourDurationMinutesSchema.safeParse(value).success) {
        throw new BadRequestException('planned Tour times must be whole minutes from 0 to 1440');
      }
    }
    if (
      input.planned_duration_minutes == null &&
      input.duration_seconds != null &&
      Math.round(input.duration_seconds / 60) + (input.break_additional_minutes ?? 0) >
        MAX_PLANNED_TOUR_DURATION_MINUTES
    ) {
      throw new BadRequestException(
        'walking time plus breaks must be 1440 minutes or less unless a total is overridden',
      );
    }
  }

  /** All tours (the facet + owning place) for a trip, newest first; a paddle tour with its check bench (PAD-09). */
  async listTours(tripId: string): Promise<TourListItem[]> {
    const tid = toRowId(tripId);
    if (tid === null) return [];
    const rows = await this.toursRepo.listForTrip(tid);
    return await this.paddleChecks.forTrip(
      tid,
      rows.map((r) => this.toItem(r)),
    );
  }

  /** The days every tour of the trip sits on, for the MCP read tools. */
  async listTourDays(tripId: number): Promise<TourDayRow[]> {
    return await this.toursRepo.listTourDays(tripId);
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

    const checked = await this.paddleChecks.forTour(this.toItem(row), stored, place?.route_geometry ?? null);
    return {
      tour: checked.item,
      waypoints,
      provenance: await this.provenanceOf(tid, row.place_id),
      ...(checked.obstacle_check ? { obstacle_check: checked.obstacle_check } : {}),
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
    };
  }

  /** Create the owning Place, Tours facet, and ordered control points as one write. */
  async createTour(tripId: string, input: TourCreateRequest, socketId?: string): Promise<TourCreateResponse> {
    // The controller's TripAccessGuard already resolved this trip id.
    const tid = toRowId(tripId)!;
    await this.assertTourTypeEnabled(input.tour_type);
    this.validateInformationalMetadata(input);
    this.validatePlannedTimes(input);
    const start = input.route_geometry[0];
    const fields = this.routeFields(input);
    const derivedFrom = input.derived_from_place_id ?? null;

    const placeId = await this.uow.transactional(async () => {
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
        route_geometry: JSON.stringify(input.route_geometry),
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
      await this.waypointsRepo.insertForPlace(id, input.waypoints);
      return id;
    });

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
    const checked = await this.paddleChecks.forTour(this.toItem(row), waypoints, place.route_geometry ?? null);
    return {
      tour: checked.item,
      waypoints,
      provenance: await this.provenanceOf(tid, placeId),
      ...(checked.obstacle_check ? { obstacle_check: checked.obstacle_check } : {}),
    };
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

    await this.uow.transactional(async () => {
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
        boat_type: row.boat_type as PaddleBoatType | null,
        water_context: row.water_context as PaddleWaterContext | null,
        paddle_speed_kmh: row.paddle_speed_kmh,
        portage_speed_kmh: row.portage_speed_kmh,
      });
      await this.waypointsRepo.deleteForPlace(pid);
      await this.toursRepo.clearRecordedTrack(pid);
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

    const copyId = await this.uow.transactional(async () => {
      const [source, provenance, place] = await Promise.all([
        this.toursRepo.findInTrip(tid, pid),
        this.toursRepo.findProvenance(tid, pid),
        this.placesRepo.findInTrip(pid, tid),
      ]);
      const start = parseRouteGeometry(place?.route_geometry)[0];
      // A tour without a line has nothing to copy.
      if (!source || !provenance || !place?.route_geometry || !start) throw new NotFoundException('Tour not found');
      const id = await this.placesRepo.insertTourPlace({
        trip_id: tid,
        name,
        lat: start[0],
        lng: start[1],
        route_geometry: place.route_geometry,
        description: place.description ?? null,
        website: place.website ?? null,
      });
      await this.toursRepo.insertTour({
        place_id: id,
        tour_type: source.tour_type,
        distance: source.distance,
        elevation_gain: source.elevation_gain,
        elevation_loss: source.elevation_loss,
        duration: source.duration,
        planned_duration_minutes: source.planned_duration_minutes,
        break_additional_minutes: source.break_additional_minutes,
        match_confidence: source.match_confidence,
        max_hiking_difficulty: source.max_hiking_difficulty,
        boat_type: source.boat_type as PaddleBoatType | null,
        water_context: source.water_context as PaddleWaterContext | null,
        paddle_speed_kmh: source.paddle_speed_kmh,
        portage_speed_kmh: source.portage_speed_kmh,
        track_marks: source.track_marks,
        wanderer_ref: source.wanderer_ref,
        difficulty: source.difficulty,
        derived_from_place_id: pid,
        origin: source.origin as TourOrigin,
        origin_file_name: provenance.origin_file_name,
      });
      await this.waypointsRepo.insertForPlace(id, await this.waypointsRepo.listForPlace(pid));
      // The copy keeps the decisions about its obstacles, bound to what they were decided on.
      await this.toursRepo.copyObstacleReviews(pid, id);
      return id;
    });

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
    await this.assertTourTypeEnabled(input.tour_type);
    this.validateInformationalMetadata(input);
    this.validatePlannedTimes(input);
    const start = input.route_geometry[0];
    const fields = this.routeFields(input);

    await this.uow.transactional(async () => {
      // The trip predicate is the cross-trip boundary. It runs inside the write
      // so an id from another accessible trip cannot be moved into the current
      // one, and a place deleted meanwhile answers 404 instead of failing a
      // waypoint insert on its foreign key.
      if (!(await this.toursRepo.findInTrip(tid, pid))) throw new NotFoundException('Tour not found');
      // An import planned over for the first time keeps the track it was recorded with.
      await this.toursRepo.keepRecordedTrack(pid);
      const placeUpdated = await this.placesRepo.updateTourRoute(pid, tid, {
        name: input.name,
        lat: start[0],
        lng: start[1],
        route_geometry: JSON.stringify(input.route_geometry),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.website !== undefined ? { website: input.website } : {}),
      });
      if (!placeUpdated) throw new NotFoundException('Tour not found');
      if (!(await this.toursRepo.updateInTrip(tid, pid, fields))) throw new NotFoundException('Tour not found');
      await this.waypointsRepo.deleteForPlace(pid);
      await this.waypointsRepo.insertForPlace(pid, input.waypoints);
    });

    const result = await this.getTour(tripId, placeId);
    const place = await this.placesRepo.findWithTagsAndRatings(pid);
    if (!place) throw new Error('Updated tour could not be loaded');
    this.broadcastToursChanged(tripId, [pid], socketId);
    try {
      this.places.broadcast(tripId, 'place:updated', { place }, socketId);
    } catch {
      this.logger.warn(`Committed Tour ${placeId}: place notification failed`);
    }
    return result;
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
   * The tours-mode GPX import reads rows through PlaceImportService.readGpx
   * with waypoints excluded. PlacesService.importPreparedGpx persists the places
   * in the same transaction as their `tours` facet rows, whose metrics are
   * derived from route_geometry.
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
    const rows = this.readGpxTracks(fileBuffer, fileName);
    if (rows.length === 0) return null;
    await this.assertTourTypeEnabled(fields.tour_type);
    const paddle = {
      boat_type: fields.boat_type ?? null,
      water_context: fields.water_context ?? null,
      paddle_speed_kmh: null,
    };

    const tours: TourListItem[] = [];
    const result = await this.uow.transactional(async () => {
      // A nested transactional, so the places and their facets commit together.
      const imported = await this.places.importPreparedGpx(tripId, rows);
      for (const place of imported.places) {
        const metrics = computeTourMetrics(parseRouteGeometry(place.route_geometry));
        const matchConfidence = metrics.hasElevation ? 1 : 0.3;
        await this.toursRepo.insertTour({
          place_id: place.id,
          tour_type: fields.tour_type,
          ...paddle,
          distance: metrics.distanceKm,
          elevation_gain: metrics.elevationGainM,
          elevation_loss: metrics.elevationLossM,
          duration: null,
          planned_duration_minutes: null,
          break_additional_minutes: null,
          match_confidence: matchConfidence,
          max_hiking_difficulty: null,
          origin: 'gpx',
          origin_file_name: gpxFileName(fileName),
        });
        tours.push(
          this.toItem({
            place_id: place.id,
            name: place.name,
            description: place.description ?? null,
            website: place.website ?? null,
            tour_type: fields.tour_type,
            ...paddle,
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
            track_marks: null,
            has_recorded_track: 0,
            planned: 0,
            has_waypoints: 0,
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
   * PAD-02: what a GPX file would import, read with the import's own parser
   * and duplicate rule and written nowhere. Null when the file holds no track
   * or route, the import's own refusal.
   */
  async previewGpx(tripId: string, fileBuffer: Buffer, fileName?: string): Promise<TourGpxPreviewResponse | null> {
    const rows = this.readGpxTracks(fileBuffer, fileName);
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
          duplicate: duplicates[index] ?? false,
        };
      }),
    };
  }

  /** The tracks and routes of a GPX file, never its loose waypoints: the reading every Tours import shares. */
  private readGpxTracks(fileBuffer: Buffer, fileName?: string) {
    return this.placeImport.readGpx(fileBuffer, {
      importWaypoints: false,
      importRoutes: true,
      importTracks: true,
      defaultName: fileName,
    });
  }
}

/** The file name a GPX import keeps: the name as uploaded, without a path, cut to what the column shows. */
function gpxFileName(name: string | undefined): string | null {
  const base = name?.split('/').pop()?.trim();
  return base ? base.slice(0, 255) : null;
}

/** What the source of a tour carried, read from the tour's own record and its import's snapshot row. */
function provenanceSource(origin: TourOrigin, row: TourProvenanceRow): TourProvenanceSource {
  if (origin === 'gpx') return { kind: 'gpx', fileName: row.origin_file_name };
  if (origin === 'wanderer') {
    // The reference `instance#trail` is on the tour itself, so a snapshot whose row is missing still names its source.
    const [refInstance, refTrail] = splitWandererRef(row.wanderer_ref);
    return {
      kind: 'wanderer',
      instance: row.source_instance ?? refInstance,
      externalId: row.source_external_id ?? refTrail,
      externalUrl: row.source_external_url,
      externalUpdated: row.source_external_updated,
      importedAt: row.source_imported_at,
    };
  }
  return { kind: 'trek' };
}

function splitWandererRef(ref: string | null): [string, string] {
  const at = ref?.lastIndexOf('#') ?? -1;
  return ref && at > 0 ? [ref.slice(0, at), ref.slice(at + 1)] : ['', ''];
}
