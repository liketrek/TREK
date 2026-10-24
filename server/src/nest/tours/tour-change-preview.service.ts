import { TourStationVisits } from '../../db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import type { TourStationVisitsRepository } from '../../db/repositories/TourStationVisits.repository';
import type { TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import { DomainError } from '../common/domain-error';
import { CityWalkFootWayService } from './city-walk-foot-way.service';
import { applyChanges, editsOnly, refusalText, type RefusedAction, type StationDone } from './tour-change-apply';
import { describeChange } from './tour-change-effects';
import { proposalIdOf, staleProposal } from './tour-change-proposal';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TourChange, TourChangeRequest } from '@trek/shared';

/** The refusal of a proposal the rules of its tour do not allow; its text names every change and why. */
export const TOUR_CHANGE_REFUSED = 'tour_change_refused';

/**
 * What the changes are laid for: a preparation, or the save of a proposal
 * prepared on a revision, whose refusal then says nothing was saved.
 */
export type LayFor = { action: Extract<RefusedAction, 'prepared'> } | { action: 'saved'; preparedOn: number };

/** The places of the trip the new stations of a proposal name. */
function linkedIds(changes: readonly TourChange[]): number[] {
  return changes.flatMap((change) => {
    const id = 'station' in change ? change.station.linked_place_id : null;
    return id ? [id] : [];
  });
}

/** The stations visited or skipped on any day of the walk, by key, each with the days. */
export function doneByKey(visits: ReadonlyArray<StationDone & { station_key: string }>): Map<string, StationDone[]> {
  const done = new Map<string, StationDone[]>();
  for (const { station_key, day_id, status } of visits) {
    done.set(station_key, [...(done.get(station_key) ?? []), { day_id, status }]);
  }
  return done;
}

/**
 * MCP-T02: a change to a saved tour prepared for the traveller to review.
 * It reads the saved tour, the visits of all its days and the places the new
 * stations name, lays the changes onto the saved points by the rules of the
 * tour's type and works out the effects with the way on foot the router
 * plans before and after. It writes nothing: no tour, station, visit or day
 * plan changes, and turning the proposal down leaves the plan as it is. The
 * proposal names the revision it was prepared on, so a save of it can be
 * refused once the tour has moved on, and carries the id a save of it has to
 * name (MCP-T03).
 */
@Injectable()
export class TourChangePreviewService {
  constructor(
    private readonly tours: ToursService,
    private readonly footWays: CityWalkFootWayService,
    @InjectRepository(TourStationVisits) private readonly visitsRepo: TourStationVisitsRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
  ) {}

  /**
   * The changes laid onto the tour as it is saved now, with the visits of all
   * its days and the places the new stations name, or the refusal naming
   * every change the rules of the tour do not allow, saying it was not
   * `layFor.action`. A save lays them again on the tour it is about to write, so
   * it is held to the same rules, and names the revision they were prepared
   * on: a tour that moved past it is a conflict before any rule is asked.
   */
  async lay(tripId: number, placeId: number, changes: readonly TourChange[], layFor: LayFor) {
    const { tour, waypoints } = await this.tours.getTour(String(tripId), String(placeId));
    if (layFor.action === 'saved' && tour.revision !== layFor.preparedOn) {
      throw staleProposal(layFor.preparedOn, tour.revision ?? null);
    }
    const [visits, linkable] = await Promise.all([
      this.visitsRepo.listForPlace(tripId, placeId),
      this.waypointsRepo.linkablePlaceIds(tripId, linkedIds(changes)),
    ]);
    const outcome = applyChanges(
      {
        tourType: tour.tour_type,
        recorded: tour.has_waypoints !== true,
        points: waypoints,
        done: doneByKey(visits),
        linkable,
      },
      changes,
    );
    if (outcome.kind === 'refused') {
      throw new DomainError(422, refusalText(outcome.refused, layFor.action), {
        code: TOUR_CHANGE_REFUSED,
        details: { refused: outcome.refused },
      });
    }
    return { tour, waypoints, outcome };
  }

  async prepare(tripId: number, placeId: number, userId: number, { changes }: TourChangeRequest) {
    const { tour, waypoints, outcome } = await this.lay(tripId, placeId, changes, { action: 'prepared' });
    // Edits alone move no station, so the way after is the way before and the router is asked once.
    const [wayBefore, wayAfter] = editsOnly(changes)
      ? await this.footWays.plan(userId, tripId, waypoints).then((way) => [way, way] as const)
      : await Promise.all([
          this.footWays.plan(userId, tripId, waypoints),
          this.footWays.plan(userId, tripId, outcome.points),
        ]);
    const revision = tour.revision ?? null;
    return {
      prepared_only: true,
      proposal_id: proposalIdOf({ tripId, placeId, revision, changes }),
      base: { place_id: tour.place_id, name: tour.name, tour_type: tour.tour_type, revision },
      changes,
      ...describeChange({
        saved: waypoints,
        after: outcome.points,
        removed: outcome.removed,
        replaced: outcome.replaced,
        shapingDropped: outcome.shapingDropped,
        wayBefore,
        wayAfter,
        stored: { distance_km: tour.distance, walking_minutes: tour.duration },
      }),
    };
  }
}
