import { Tours } from '../../db/entities/Tours.entity';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { isUpdateConflict } from '../common/conflictResult';
import { badRequest } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { PlacesService } from '../places/places.service';
import { advanceTourRevision } from './tour-revision';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  maxTourMinutesFor,
  plannedTimeLimitMessage,
  tourStageCountOf,
  type TourDetailsUpdateRequest,
  type TourListItem,
} from '@trek/shared';

/** A tour's words and planned times, as update_tour_details reads and writes them. */
interface TourDetails {
  name: string;
  description: string | null;
  website: string | null;
  break_additional_minutes: number | null;
  planned_duration_minutes: number | null;
}

function detailsOf(tour: TourListItem): TourDetails {
  return {
    name: tour.name,
    description: tour.description ?? null,
    website: tour.website ?? null,
    break_additional_minutes: tour.break_additional_minutes ?? null,
    planned_duration_minutes: tour.planned_duration_minutes ?? null,
  };
}

/** The value a change gives a field, or the one it keeps. */
function next<K extends keyof TourDetails>(request: TourDetailsUpdateRequest, before: TourDetails, key: K) {
  const value = request[key];
  return (value === undefined ? before[key] : value) as TourDetails[K];
}

/**
 * P8: the edits of a saved tour besides its route, for every type, a
 * recorded track included. Its words (name, description, website) are the
 * place's, written through the places' own update; its planned times are
 * the tour's, held to the limit the planner's save holds them to (the moving
 * time and the breaks within a day, a day a stage for a tour over several
 * days, unless a planned total is set). Both go in one transaction that
 * raises the tour's revision against the one it was read at, and the trip
 * hears tours:changed and place:updated as after the planner's save. The
 * route, the points and the days stay as they are.
 *
 * Also the two writes the tour detail makes on the place: the colour of its
 * line, and the copy of the tour as a new one of the trip.
 */
@Injectable()
export class TourDetailsService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tours: ToursService,
    private readonly places: PlacesService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
  ) {}

  async update(tripId: number, request: TourDetailsUpdateRequest) {
    const { placeId } = request;
    const detail = await this.tours.getTour(String(tripId), String(placeId));
    const before = detailsOf(detail.tour);
    const after: TourDetails = {
      name: next(request, before, 'name'),
      description: next(request, before, 'description'),
      website: next(request, before, 'website'),
      break_additional_minutes: next(request, before, 'break_additional_minutes'),
      planned_duration_minutes: next(request, before, 'planned_duration_minutes'),
    };
    const stages = tourStageCountOf(detail.waypoints);
    const moving = detail.tour.duration;
    if (
      after.planned_duration_minutes == null &&
      moving != null &&
      after.break_additional_minutes != null &&
      moving + after.break_additional_minutes > maxTourMinutesFor(stages)
    ) {
      throw badRequest(plannedTimeLimitMessage(stages));
    }
    const words = request.name !== undefined || request.description !== undefined || request.website !== undefined;
    const times = request.break_additional_minutes !== undefined || request.planned_duration_minutes !== undefined;
    const revision = await this.uow.transactional(async () => {
      const raised = await advanceTourRevision(this.toursRepo, placeId, request.expected_revision);
      if (words) {
        // The places' update keeps a field it is not handed; website and description clear with null.
        const place = await this.places.update(String(tripId), String(placeId), {
          name: after.name,
          description: after.description,
          website: after.website,
        } as Parameters<PlacesService['update']>[2]);
        if (!place) throw new NotFoundException('Tour not found');
      }
      if (times) {
        const { planned_duration_minutes, break_additional_minutes } = after;
        await this.toursRepo.updateTimesInTrip(tripId, placeId, { planned_duration_minutes, break_additional_minutes });
      }
      return raised;
    });
    const saved = await this.tours.announceRouteUpdate(String(tripId), placeId, {
      visitsDropped: [],
      stagesDropped: [],
    });
    return {
      tour: { place_id: placeId, tour_type: saved.tour.tour_type, revision, ...detailsOf(saved.tour) },
      previous: { revision: detail.tour.revision ?? null, ...before },
    };
  }

  /**
   * The colour the tour's line is drawn in, as the tour detail sets it on the
   * place: through the places' update and its place:updated, without raising
   * the tour's revision (the route is not touched). Null draws it in the
   * colour of its type again.
   */
  async setRouteColor(tripId: number, placeId: number, color: string | null) {
    if (!(await this.toursRepo.findInTrip(tripId, placeId))) throw new NotFoundException('Tour not found');
    const current = await this.places.get(String(tripId), String(placeId));
    if (!current) throw new NotFoundException('Tour not found');
    const place = await this.places.update(String(tripId), String(placeId), { route_color: color });
    // No base version is sent, so the update never answers a conflict; the check only narrows the type.
    if (!place || isUpdateConflict(place)) throw new NotFoundException('Tour not found');
    this.places.broadcast(String(tripId), 'place:updated', { place }, undefined);
    await this.places.onUpdated(place.id);
    return { place_id: placeId, route_color: color, previous_route_color: current.route_color ?? null };
  }
}
