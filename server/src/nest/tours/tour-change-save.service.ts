import { TourChangeSteps } from '../../db/entities/TourChangeSteps.entity';
import { TOUR_CHANGE_STEP_BEFORE, TOUR_CHANGE_STEP_CHANGES } from '../../db/json-columns';
import type { TourChangeStepRow, TourChangeStepsRepository } from '../../db/repositories/TourChangeSteps.repository';
import { encodeJson } from '../../utils/json-column';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import type { FootWay } from './city-walk-briefing.helpers';
import { CityWalkFootWayService } from './city-walk-foot-way.service';
import { editsOnly, type DraftPoint } from './tour-change-apply';
import { asWaypoint } from './tour-change-effects';
import { TourChangePreviewService } from './tour-change-preview.service';
import { proposalIdOf } from './tour-change-proposal';
import { tourWriteOf, writtenStations, writtenTour } from './tour-change-write';
import { ToursService, type TourCreateCommand, type TourRouteDrops } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  GeometryPoint,
  TourChangeSaveRequest,
  TourDetailResponse,
  TourListItem,
  TourWaypoint,
} from '@trek/shared';

/** The refusal of a save naming a proposal other than the one these changes were prepared as. */
export const TOUR_CHANGE_NOT_PREPARED = 'tour_change_not_prepared';

/** What a save writes: the tour as read, the points after the changes and the way on foot through them. */
interface ChangedTour {
  tour: TourListItem;
  points: readonly DraftPoint[];
  way: FootWay;
  preparedOn: number;
  /**
   * Edits alone move no station: the walk keeps its saved line (heights and
   * all) and its walking time, and the router is not asked, so a router that
   * is down never takes the way of a walk whose stays were changed.
   */
  kept?: { line: GeometryPoint[] | null; seconds: number | null };
}

/** The step a save recorded: its id and the revision it raised the tour to. */
interface SavedStep {
  id: number;
  revision: number;
}

/** What the save's transaction answers: the step a save sent alongside recorded first, or its own. */
type SaveOutcome = { earlier: TourChangeStepRow } | ({ step: SavedStep } & TourRouteDrops);

/**
 * The write of a confirmed change: the points after it and the way on foot
 * the router planned through them. Without a way the walk keeps its stations
 * only, as a created one does (CW-11): no line, no distance and no walking
 * time until the planner plans the way.
 */
function writeOf({ tour, points, way, preparedOn, kept }: ChangedTour): TourCreateCommand {
  const routed = way.kind === 'routed' ? way : null;
  return tourWriteOf(tour, {
    route_geometry: kept ? kept.line : (routed?.line ?? null),
    duration_seconds: kept ? kept.seconds : (routed?.seconds ?? null),
    waypoints: points.map(asWaypoint),
    expected_revision: preparedOn,
  });
}

/** The saved tour as the answer gives it, read back through the read the app uses. */
function savedAnswer(detail: TourDetailResponse, step: SavedStep, { way, preparedOn }: ChangedTour) {
  return {
    saved: true as const,
    step: { id: step.id, base_revision: preparedOn, revision: step.revision },
    tour: writtenTour(detail, step.revision),
    foot_way:
      way.kind === 'routed'
        ? { planned: true as const }
        : { planned: false as const, why: way.why, position: way.position },
    stations: writtenStations(detail),
  };
}

/**
 * The answer to a save of a proposal already saved, a save sent again after
 * its answer was lost, say: it writes nothing and points at the step the
 * first save recorded, so the assistant neither prepares the same changes
 * again on the new revision nor saves them twice.
 */
function alreadySavedAnswer(step: TourChangeStepRow) {
  const undone =
    step.undone_revision === null
      ? ''
      : ` It was taken back since, at revision ${step.undone_revision}: ` +
        'prepare it anew only if the traveller asks for it again.';
  return {
    saved: true as const,
    already_saved: true as const,
    step: { id: step.id, base_revision: step.base_revision, revision: step.revision },
    undone_revision: step.undone_revision,
    message:
      `This very proposal was already saved as step ${step.id}, raising the tour to revision ${step.revision}, ` +
      `and this save wrote nothing. Do not prepare or save it again: read the tour with get_tour_plan.${undone}`,
  };
}

/**
 * MCP-T03: a prepared change the traveller confirmed, saved whole or not at
 * all through the write the planner's save uses. The save names the revision
 * the proposal was prepared on (P2C-03, the one revision a tour has) and the
 * proposal's id, so only the very proposal shown is saved, and never over a
 * tour that has moved on. The changes are laid again on the tour as it is, by
 * the same rules: first to plan the way on foot, then once more inside the
 * write, so a station visited or a place gone in between refuses the save
 * instead of being written over, and a failure leaves the tour as it was.
 * A proposal is saved once: sent again once saved, it answers the step it
 * was saved as instead of the conflict of a tour that moved on.
 *
 * The write records the step: the proposal, both revisions, the changes and
 * the tour as it was before them (its line, its points, its measures), so it
 * can be followed and taken back (TourChangeUndoService, MCP-T04). Nothing of the conversation is
 * kept. A new city walk has no revision to name: it is created through
 * create_city_walk (CW-11), never saved as a change.
 */
@Injectable()
export class TourChangeSaveService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tours: ToursService,
    private readonly preview: TourChangePreviewService,
    private readonly footWays: CityWalkFootWayService,
    @InjectRepository(TourChangeSteps) private readonly stepsRepo: TourChangeStepsRepository,
  ) {}

  async save(tripId: number, placeId: number, userId: number, request: TourChangeSaveRequest) {
    const { changes, expected_revision: preparedOn, proposal_id: proposalId } = request;
    if (proposalId !== proposalIdOf({ tripId, placeId, revision: preparedOn, changes })) {
      throw new DomainError(
        422,
        'These changes are not the proposal that was prepared. Nothing was saved: save the changes and the revision exactly as prepare_tour_change answered them, or prepare the change again.',
        { code: TOUR_CHANGE_NOT_PREPARED },
      );
    }
    const earlier = await this.stepsRepo.findSavedProposal(placeId, proposalId, preparedOn);
    if (earlier) return alreadySavedAnswer(earlier);
    const laid = await this.preview.lay(tripId, placeId, changes, { action: 'saved', preparedOn });
    const changed: ChangedTour = editsOnly(changes)
      ? await this.keptWay(tripId, placeId, laid.tour, laid.outcome.points, preparedOn)
      : {
          tour: laid.tour,
          points: laid.outcome.points,
          way: await this.footWays.plan(userId, tripId, laid.outcome.points),
          preparedOn,
        };
    const write = await this.tours.routeWrite(writeOf(changed));
    const saved = await this.uow.transactional(async (): Promise<SaveOutcome> => {
      // The same proposal saved by a save sent alongside this one while the way was planned.
      const savedMeanwhile = await this.stepsRepo.findSavedProposal(placeId, proposalId, preparedOn);
      if (savedMeanwhile) return { earlier: savedMeanwhile };
      // Laid once more on the tour as it is now: a tour moved on, a station done or a place gone refuses here.
      const now = await this.preview.lay(tripId, placeId, changes, { action: 'saved', preparedOn });
      const before = await this.beforeState(tripId, placeId, now);
      const { revision, visitsDropped, stagesDropped } = await this.tours.replaceRoute(tripId, placeId, write);
      const id = await this.stepsRepo.record({
        place_id: placeId,
        proposal_id: proposalId,
        base_revision: preparedOn,
        revision,
        changes: encodeJson(TOUR_CHANGE_STEP_CHANGES, changes),
        before_state: before,
        saved_by: userId,
      });
      return { step: { id, revision }, visitsDropped, stagesDropped };
    });
    if ('earlier' in saved) return alreadySavedAnswer(saved.earlier);
    const detail = await this.tours.announceRouteUpdate(String(tripId), placeId, {
      visitsDropped: saved.visitsDropped,
      stagesDropped: saved.stagesDropped,
    });
    return savedAnswer(detail, saved.step, changed);
  }

  /** A change of edits only, written with the walk's saved line and walking time. */
  private async keptWay(
    tripId: number,
    placeId: number,
    tour: TourListItem,
    points: readonly DraftPoint[],
    preparedOn: number,
  ): Promise<ChangedTour> {
    const line = await this.tours.savedLine(tripId, placeId);
    const way: FootWay =
      line.length >= 2
        ? { kind: 'routed', line: line.map(([lat, lng]): [number, number] => [lat, lng]), legs: [], seconds: 0 }
        : { kind: 'unrouted', why: 'nothing_to_route', position: null };
    const seconds = tour.duration == null ? null : tour.duration * 60;
    return { tour, points, way, preparedOn, kept: { line: line.length >= 2 ? line : null, seconds } };
  }

  /** The tour as it is before the change, as the step keeps it: its line, its points and its measures. */
  private async beforeState(
    tripId: number,
    placeId: number,
    { tour, waypoints }: { tour: TourListItem; waypoints: TourWaypoint[] },
  ): Promise<string> {
    const line = await this.tours.savedLine(tripId, placeId);
    return encodeJson(TOUR_CHANGE_STEP_BEFORE, {
      route_geometry: line.length > 0 ? line : null,
      waypoints,
      distance: tour.distance,
      duration: tour.duration,
      elevation_gain: tour.elevation_gain,
      elevation_loss: tour.elevation_loss,
    });
  }
}
