import { Places } from '../../db/entities/Places.entity';
import { TourStationVisits } from '../../db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type {
  TourStationVisitRow,
  TourStationVisitsRepository,
} from '../../db/repositories/TourStationVisits.repository';
import type { TourWaypointRow, TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { PlacesService } from '../places/places.service';
import { parseRouteGeometry } from './tours.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ferryCrossingsOf,
  isClosedLoop,
  walkRemainderOf,
  walkStationsOf,
  type TourVisit,
  type TourVisitListResponse,
  type TourVisitUpdateRequest,
  type WalkRemainder,
} from '@trek/shared';

/** A city walk on one of its days: the assignment, the walk and its stations in order. */
export interface WalkOnDay {
  assignmentId: number;
  dayId: number;
  placeId: number;
  /** The walk ends where it starts, so its line leads back to the start after the last station. */
  loop: boolean;
  stations: TourWaypointRow[];
  visits: TourStationVisitRow[];
}

/**
 * CW-03: how far a city walk got on one of its days. A visit belongs to the
 * walk's day assignment and the station's key, so the same walk on another
 * day, or a copy, starts with nothing visited. Marking one changes no route,
 * place or order.
 */
@Injectable()
export class TourVisitsService {
  constructor(
    @InjectRepository(TourStationVisits) private readonly visitsRepo: TourStationVisitsRepository,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    private readonly places: PlacesService,
  ) {}

  /** Every visit on the days of a trip, for its day plan. */
  async list(tripId: string): Promise<TourVisitListResponse> {
    return { visits: (await this.visitsRepo.listForTrip(Number(tripId))).map(toVisit) };
  }

  /** A city walk on one day of this trip, with its stations and visits; 404 for anything else. */
  async walkOnDay(tripId: number | string, assignmentId: number): Promise<WalkOnDay> {
    const assignment = await this.visitsRepo.assignmentInTrip(assignmentId, Number(tripId));
    if (!assignment) throw new NotFoundException('Assignment not found');
    const tour = await this.toursRepo.findInTrip(Number(tripId), assignment.place_id);
    if (tour?.tour_type !== 'walk') throw new NotFoundException('City walk not found');
    const points = await this.waypointsRepo.listForPlace(assignment.place_id);
    return {
      assignmentId,
      dayId: assignment.day_id,
      placeId: assignment.place_id,
      loop: isClosedLoop(points),
      stations: walkStationsOf(points),
      visits: await this.visitsRepo.listForAssignment(assignmentId),
    };
  }

  /** CW-09: a walk on one day, read for an assistant; nothing changes. */
  async progress(tripId: number, placeId: number, dayId: number, assignmentId?: number): Promise<WalkProgress> {
    return (await this.dayRun(tripId, placeId, dayId, assignmentId)).progress;
  }

  /**
   * CW-13: what is left of a walk on one day, read for an assistant: the
   * reference it counts from, the walking time left along the saved line and
   * the stays still open, apart. Read afresh each time, so a station checked
   * off since counts; nothing changes.
   */
  async remaining(tripId: number, placeId: number, dayId: number, assignmentId?: number): Promise<WalkRemaining> {
    const [{ walk, progress }, place, points] = await Promise.all([
      this.dayRun(tripId, placeId, dayId, assignmentId),
      this.placesRepo.findInTrip(placeId, tripId),
      this.waypointsRepo.listForPlace(placeId),
    ]);
    const remainder = walkRemainderOf({
      stations: progress.stations.map((station) => ({ ...station, stayMinutes: station.stay_minutes })),
      line: parseRouteGeometry(place?.route_geometry),
      walkingMinutes: progress.walking_minutes,
      // CW-12: a ferry leg is crossed by boat; the saved walking time holds none of it.
      crossings: ferryCrossingsOf(points),
    });
    return {
      place_id: placeId,
      day_id: progress.day_id,
      assignment_id: progress.assignment_id,
      loop: walk.loop,
      ...remainder,
      derived: REMAINDER_DERIVED,
    };
  }

  private async dayRun(
    tripId: number,
    placeId: number,
    dayId: number,
    runId?: number,
  ): Promise<{ walk: WalkOnDay; progress: WalkProgress }> {
    const assignmentId = await this.runOnDay(tripId, placeId, dayId, runId);
    if (assignmentId === undefined) throw new NotFoundException('City walk not on this day');
    const walk = await this.walkOnDay(tripId, assignmentId);
    const tour = await this.toursRepo.findInTrip(tripId, placeId);
    const statusOf = new Map(walk.visits.map((visit) => [visit.station_key, visit.status]));
    const stations: WalkProgressStation[] = walk.stations.map((station, index) => ({
      position: index + 1,
      key: station.key ?? null,
      name: station.name ?? null,
      lat: station.lat,
      lng: station.lng,
      status: (station.key && statusOf.get(station.key)) || 'planned',
      importance: station.importance ?? 'normal',
      protected: station.protected === true,
      stay_minutes: station.stay_minutes ?? null,
      opening_hours: station.opening_hours ?? null,
      linked_place_id: station.linked_place_id ?? null,
    }));
    const open = stations.filter((station) => station.status === 'planned');
    const progress: WalkProgress = {
      place_id: placeId,
      day_id: walk.dayId,
      assignment_id: assignmentId,
      stations,
      open: {
        stations: open.length,
        stay_minutes_known: open.reduce((sum, station) => sum + (station.stay_minutes ?? 0), 0),
        stays_unknown: open.filter((station) => station.stay_minutes === null).length,
      },
      walking_minutes: tour?.duration ?? null,
    };
    return { walk, progress };
  }

  /** The named run of the walk on that day, or its first one when none is named. */
  private async runOnDay(
    tripId: number,
    placeId: number,
    dayId: number,
    runId: number | undefined,
  ): Promise<number | undefined> {
    if (runId === undefined) return await this.visitsRepo.assignmentOnDay(tripId, placeId, dayId);
    const run = await this.visitsRepo.assignmentInTrip(runId, tripId);
    return run?.place_id === placeId && run.day_id === dayId ? runId : undefined;
  }

  /** Marks a station of a walk on one of its days, or takes it back to planned. */
  async update(
    tripId: string,
    assignmentId: number,
    stationKey: string,
    body: TourVisitUpdateRequest,
    socketId?: string,
  ): Promise<TourVisitListResponse> {
    const walk = await this.walkOnDay(tripId, assignmentId);
    if (!walk.stations.some((station) => station.key === stationKey)) {
      throw new NotFoundException('Station not found');
    }
    if (body.status === 'planned') await this.visitsRepo.clear(assignmentId, stationKey);
    else await this.visitsRepo.set(assignmentId, stationKey, body.status);
    const visits = (await this.visitsRepo.listForAssignment(assignmentId)).map(toVisit);
    this.places.broadcast(tripId, 'tours:visits', { assignmentId, visits }, socketId);
    return { visits };
  }
}

/** CW-09: one station of a walk on a day, as an assistant reads it. */
interface WalkProgressStation {
  position: number;
  /** The station's own key, the same across saves; null only for a point saved before keys existed. */
  key: string | null;
  name: string | null;
  lat: number;
  lng: number;
  status: 'planned' | 'visited' | 'skipped';
  importance: 'normal' | 'optional' | 'must';
  protected: boolean;
  /** Null where the stay is not known; 0 is a station passed through. */
  stay_minutes: number | null;
  /** As OpenStreetMap writes them; a hint to check, null when none is known. */
  opening_hours: string | null;
  linked_place_id: number | null;
}

/**
 * CW-09: how far a walk got on a day, for an assistant: every station with its
 * status, what is still open, and the times known, an unknown time left
 * unknown rather than counted as nothing.
 */
export interface WalkProgress {
  place_id: number;
  day_id: number;
  assignment_id: number;
  stations: WalkProgressStation[];
  open: { stations: number; stay_minutes_known: number; stays_unknown: number };
  walking_minutes: number | null;
}

/**
 * The fields of a remaining time worked out on reading, never stored with the
 * walk; walking.total_minutes is the walking time as saved.
 */
const REMAINDER_DERIVED = [
  'reference',
  'finished',
  'walking.remaining_minutes',
  'walking.upper_bound',
  'walking.skipped_ahead',
  'walking.unknown_because',
  'walking.after_last_station_minutes',
  'stays',
  'open_stations',
] as const;

/** CW-13: what is left of a walk on one day, for an assistant. */
export type WalkRemaining = {
  place_id: number;
  day_id: number;
  assignment_id: number;
  loop: boolean;
  derived: readonly string[];
} & WalkRemainder;

/** A visit as the routes and the trip's socket send it. */
export function toVisit(row: TourStationVisitRow): TourVisit {
  return { assignment_id: row.assignment_id, station_key: row.station_key, status: row.status };
}
