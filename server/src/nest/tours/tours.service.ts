import { InjectRepository } from '@mikro-orm/nestjs';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MAX_PLANNED_TOUR_DURATION_MINUTES, plannedTourDurationMinutesSchema, tourWebsiteSchema, type TourCreateRequest, type TourCreateResponse, type TourDetailResponse, type TourListItem, type TourWaypoint } from '@trek/shared';
import { Places } from '../../db/entities/Places.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TourTypes } from '../../db/entities/TourTypes.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { TourListRow, ToursRepository, TourUpdate } from '../../db/repositories/Tours.repository';
import type { TourTypesRepository } from '../../db/repositories/TourTypes.repository';
import type { TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { PlacesService } from '../places/places.service';
import { computeTourMetrics, parseRouteGeometry, LOW_CONFIDENCE_THRESHOLD, type GeometryPoint } from './tours.helpers';

export interface ImportGpxAsTourResult {
  tours: TourListItem[];
  caution: boolean;
  skipped: number;
}

/**
 * Tours domain: the `tours` facet table (place_id PK/FK) carries tour-specific
 * metadata while existing places and day assignments are reused.
 * GPX parsing and persistence are reused through PlacesService.prepareGpxRows
 * and importPreparedGpx. Places and facet rows are persisted in one transaction,
 * with tour metrics derived from each place's route_geometry.
 */
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
      max_hiking_difficulty: r.max_hiking_difficulty ?? 2,
      planned: Boolean(r.planned),
      caution: r.match_confidence !== null && r.match_confidence < LOW_CONFIDENCE_THRESHOLD,
      has_waypoints: Boolean(r.has_waypoints),
    };
  }

  /** The route a create or an update writes: metrics derived from the geometry, duration stored in minutes. */
  private routeFields(input: TourCreateRequest): TourUpdate {
    const metrics = computeTourMetrics(input.route_geometry as GeometryPoint[]);
    return {
      tour_type: input.tour_type,
      distance: metrics.distanceKm,
      elevation_gain: metrics.elevationGainM,
      elevation_loss: metrics.elevationLossM,
      duration: input.duration_seconds == null ? null : Math.round(input.duration_seconds / 60),
      ...(input.planned_duration_minutes !== undefined ? { planned_duration_minutes: input.planned_duration_minutes } : {}),
      ...(input.break_additional_minutes !== undefined ? { break_additional_minutes: input.break_additional_minutes } : {}),
      match_confidence: 1,
      max_hiking_difficulty: input.max_hiking_difficulty,
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
      Math.round(input.duration_seconds / 60) + (input.break_additional_minutes ?? 0) > MAX_PLANNED_TOUR_DURATION_MINUTES
    ) {
      throw new BadRequestException('walking time plus breaks must be 1440 minutes or less unless a total is overridden');
    }
  }

  /** All tours (the facet + owning place) for a trip, newest first. */
  async listTours(tripId: string): Promise<TourListItem[]> {
    const tid = toRowId(tripId);
    if (tid === null) return [];
    const rows = await this.toursRepo.listForTrip(tid);
    return rows.map(r => this.toItem(r));
  }

  /** One saved tour plus the persisted routing controls needed by the editor. */
  async getTour(tripId: string, placeId: string): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    const row = tid !== null && pid !== null ? await this.toursRepo.findInTrip(tid, pid) : undefined;
    if (!row) throw new NotFoundException('Tour not found');

    let waypoints: TourWaypoint[] = await this.waypointsRepo.listForPlace(row.place_id);
    // GPX tours created before tour_waypoints existed still belong in this
    // all-tours rail. A read-only endpoint must not backfill the database, so
    // expose their saved geometry endpoints as controls; the first edit/save
    // replaces them with normal persisted tour_waypoints transactionally.
    if (waypoints.length < 2) {
      const place = await this.placesRepo.findInTrip(row.place_id, tid!);
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

    return { tour: this.toItem(row), waypoints };
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

    const placeId = await this.uow.transactional(async () => {
      const id = await this.placesRepo.insertTourPlace({
        trip_id: tid, name: input.name, lat: start[0], lng: start[1], route_geometry: JSON.stringify(input.route_geometry),
        description: input.description ?? null, website: input.website ?? null,
      });
      await this.toursRepo.insertTour({
        place_id: id,
        ...fields,
        planned_duration_minutes: fields.planned_duration_minutes ?? null,
        break_additional_minutes: fields.break_additional_minutes ?? null,
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
    return { tour: this.toItem(row), waypoints };
  }

  /** Replace a saved tour's derived route and routing controls as one write. */
  async updateTour(tripId: string, placeId: string, input: TourCreateRequest, socketId?: string): Promise<TourDetailResponse> {
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
      const placeUpdated = await this.placesRepo.updateTourRoute(pid, tid, {
        name: input.name, lat: start[0], lng: start[1], route_geometry: JSON.stringify(input.route_geometry),
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

  private broadcastToursChanged(tripId: string, placeIds: number[], socketId?: string): void {
    try {
      this.places.broadcast(tripId, 'tours:changed', { placeIds }, socketId);
    } catch {
      this.logger.warn(`Committed Tours change for trip ${tripId}: realtime invalidation failed`);
    }
  }

  /**
   * The tours-mode GPX import prepares rows through PlacesService.prepareGpxRows
   * with waypoints excluded. PlacesService.importPreparedGpx persists the places
   * in the same transaction as their `tours` facet rows, whose metrics are
   * derived from route_geometry.
   *
   * Missing or implausible metrics do not block import:
   * a track without elevation still imports, just flagged with a low
   * match_confidence so the client can surface a "with caution" toast.
   */
  async importGpxAsTour(tripId: string, fileBuffer: Buffer, defaultName?: string, socketId?: string): Promise<ImportGpxAsTourResult | null> {
    const rows = this.places.prepareGpxRows(fileBuffer, {
      importWaypoints: false, importRoutes: true, importTracks: true, defaultName,
    });
    if (rows.length === 0) return null;

    const tours: TourListItem[] = [];
    const result = await this.uow.transactional(async () => {
      // A nested transactional, so the places and their facets commit together.
      const imported = await this.places.importPreparedGpx(tripId, rows);
      for (const place of imported.places) {
        const metrics = computeTourMetrics(parseRouteGeometry(place.route_geometry));
        const matchConfidence = metrics.hasElevation ? 1 : 0.3;
        await this.toursRepo.insertTour({
          place_id: place.id,
          tour_type: 'hike',
          distance: metrics.distanceKm,
          elevation_gain: metrics.elevationGainM,
          elevation_loss: metrics.elevationLossM,
          duration: null,
          planned_duration_minutes: null,
          break_additional_minutes: null,
          match_confidence: matchConfidence,
          max_hiking_difficulty: 2,
        });
        tours.push(this.toItem({
          place_id: place.id,
          name: place.name,
          description: place.description ?? null,
          website: place.website ?? null,
          tour_type: 'hike',
          distance: metrics.distanceKm,
          elevation_gain: metrics.elevationGainM,
          elevation_loss: metrics.elevationLossM,
          duration: null,
          planned_duration_minutes: null,
          break_additional_minutes: null,
          difficulty: null,
          wanderer_ref: null,
          match_confidence: matchConfidence,
          max_hiking_difficulty: 2,
          planned: 0,
          has_waypoints: 0,
        }));
      }
      return imported;
    });

    if (result.places.length === 0) return { tours: [], caution: false, skipped: result.skipped };
    this.broadcastToursChanged(tripId, result.places.map(place => place.id), socketId);
    for (const place of result.places) {
      try {
        this.places.broadcast(tripId, 'place:created', { place }, socketId);
      } catch {
        this.logger.warn(`Committed GPX place ${place.id}: realtime notification failed`);
      }
    }
    return { tours, caution: tours.some(t => t.caution), skipped: result.skipped };
  }
}
