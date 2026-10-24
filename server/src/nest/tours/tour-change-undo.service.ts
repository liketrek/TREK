import { TourChangeSteps } from '../../db/entities/TourChangeSteps.entity';
import { TourStationVisits } from '../../db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { TOUR_CHANGE_STEP_BEFORE, TOUR_CHANGE_STEP_CHANGES, type TourChangeStepBefore } from '../../db/json-columns';
import type { TourChangeStepRow, TourChangeStepsRepository } from '../../db/repositories/TourChangeSteps.repository';
import type { TourStationVisitsRepository } from '../../db/repositories/TourStationVisits.repository';
import type { TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import { decodeJson } from '../../utils/json-column';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { doneByKey } from './tour-change-preview.service';
import { describeUndo, standingOf, undoRefusals, undoRefusalText, type StepStanding } from './tour-change-undo';
import { tourWriteOf, writtenStations, writtenTour } from './tour-change-write';
import { tourRevisionConflict } from './tour-revision';
import { ToursService, type TourRouteWrite } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { TourChangeUndoRequest, TourWaypoint } from '@trek/shared';

/** A step this tour does not have. */
export const TOUR_CHANGE_STEP_NOT_FOUND = 'tour_change_step_not_found';
/** A step taken back already. */
export const TOUR_CHANGE_STEP_UNDONE = 'tour_change_step_undone';
/** A step whose record of the tour before it cannot be read. */
export const TOUR_CHANGE_STEP_WITHOUT_EARLIER_STATE = 'tour_change_step_without_earlier_state';
/** Taking a step back would lose what the travellers did since; its text names every reason. */
export const TOUR_CHANGE_UNDO_REFUSED = 'tour_change_undo_refused';

/** The most steps a listing gives, the latest first: only the latest one can be taken back. */
export const TOUR_CHANGE_STEPS_LISTED = 20;

/** The record of the tour before a step, as kept; null when it cannot be read. */
function beforeOf(step: TourChangeStepRow): TourChangeStepBefore | null {
  return decodeJson(TOUR_CHANGE_STEP_BEFORE, step.before_state, `tour_change_steps ${step.id}`);
}

/** A step as an answer names it: when it was saved, the revisions it went from and to, and its changes. */
function stepAnswer(step: TourChangeStepRow) {
  return {
    id: step.id,
    saved_at: step.saved_at,
    base_revision: step.base_revision,
    revision: step.revision,
    changes: decodeJson(TOUR_CHANGE_STEP_CHANGES, step.changes, `tour_change_steps ${step.id}`),
  };
}

/** Why a step that is not the tour's latest change cannot be taken back, as the refusal says it. */
function standingRefusal(
  standing: Exclude<StepStanding, 'latest'>,
  step: TourChangeStepRow,
  now: number | null,
): DomainError {
  if (standing === 'undone') {
    return new DomainError(
      409,
      `This step was taken back already, which raised the tour to revision ${step.undone_revision}. Nothing changed.`,
      { code: TOUR_CHANGE_STEP_UNDONE },
    );
  }
  if (standing === 'later_change') {
    return tourRevisionConflict(
      now,
      `The tour was changed after this step was saved (revision ${step.revision} then, ${now ?? 'unknown'} now). Nothing changed: only the latest change of a tour can be taken back, so no later edit is lost. Read the tour with get_tour_plan and prepare a change instead.`,
    );
  }
  return new DomainError(
    409,
    'This step keeps no readable record of the tour before it, so there is nothing to restore. Nothing changed.',
    { code: TOUR_CHANGE_STEP_WITHOUT_EARLIER_STATE },
  );
}

/**
 * The write that restores the tour as the step kept it: its line and points
 * with their keys, through the write the planner's save uses, and the
 * measures stored then put back as they were rather than worked out anew.
 */
function restoringWrite(write: TourRouteWrite, before: TourChangeStepBefore): TourRouteWrite {
  return {
    ...write,
    fields: {
      ...write.fields,
      distance: before.distance,
      duration: before.duration,
      elevation_gain: before.elevation_gain,
      elevation_loss: before.elevation_loss,
    },
  };
}

/** The places of the trip the points of the tour before stand for. */
function linkedIds(points: readonly TourWaypoint[]): number[] {
  return points.flatMap((point) => (point.linked_place_id ? [point.linked_place_id] : []));
}

/**
 * MCP-T04: a step saved from a confirmed proposal (MCP-T03) taken back, which
 * restores the tour exactly as the step kept it before. Only the tour's latest
 * change is taken back: the step's revision has to be the tour's, so anything
 * saved on top of it since, in the planner or by another step, is a conflict
 * on the tour's one revision (LIB-01) instead of being lost. Nothing the
 * travellers did since is thrown away either: a station visited or skipped
 * that would go, or a place of the trip gone that a station stood for,
 * refuses it with every reason.
 *
 * The preview reads only. Taking back checks everything again inside the
 * write, restores the line, the points with their keys and the measures in
 * one transaction with the mark on the step, and tells the trip only after
 * the commit; a failure leaves the tour as it is. A step is taken back once,
 * and no second step or revision is kept for it: the tour's revision counts
 * it like any other write. This is not the planner's undo: a draft in a
 * browser is never seen here, and discarding one never changes a saved tour.
 */
@Injectable()
export class TourChangeUndoService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tours: ToursService,
    @InjectRepository(TourChangeSteps) private readonly stepsRepo: TourChangeStepsRepository,
    @InjectRepository(TourStationVisits) private readonly visitsRepo: TourStationVisitsRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
  ) {}

  /** The saved steps of a tour, the latest first, each with where it stands. */
  async steps(tripId: number, placeId: number) {
    const { tour } = await this.tours.getTour(String(tripId), String(placeId));
    const rows = await this.stepsRepo.listForPlace(placeId, TOUR_CHANGE_STEPS_LISTED);
    const revision = tour.revision ?? null;
    return {
      tour: { place_id: tour.place_id, name: tour.name, tour_type: tour.tour_type, revision },
      steps: rows.map((step) => ({
        ...stepAnswer(step),
        standing: standingOf(step, beforeOf(step), revision).kind,
        undone: step.undone_revision === null ? null : { revision: step.undone_revision, at: step.undone_at },
      })),
      listed_at_most: TOUR_CHANGE_STEPS_LISTED,
    };
  }

  /** What taking the step back does, set against the tour now; writes nothing. */
  async prepare(tripId: number, placeId: number, stepId: number) {
    const { tour, step, basis } = await this.checked(tripId, placeId, stepId);
    const measures = {
      distance_km: tour.distance,
      walking_minutes: tour.duration,
      route_pending: tour.route_pending === true,
    };
    return {
      prepared_only: true as const,
      step: stepAnswer(step),
      ...describeUndo(basis, measures),
      undo: { step_id: step.id, expected_revision: step.revision },
    };
  }

  /** The step taken back as the traveller confirmed it, whole or not at all. */
  async undo(tripId: number, placeId: number, userId: number, { step_id, expected_revision }: TourChangeUndoRequest) {
    const restored = await this.uow.transactional(async () => {
      const { tour, step, basis } = await this.checked(tripId, placeId, step_id, expected_revision);
      const { before } = basis;
      const write = await this.tours.routeWrite(
        tourWriteOf(tour, {
          route_geometry: before.route_geometry,
          duration_seconds: before.duration === null ? null : before.duration * 60,
          waypoints: before.waypoints,
          expected_revision,
        }),
      );
      const written = await this.tours.replaceRoute(tripId, placeId, restoringWrite(write, before));
      const marked = await this.stepsRepo.markUndone(step.id, { undone_revision: written.revision, undone_by: userId });
      // Only a step taken back between the check and the mark gets here; the throw rolls the restore back.
      if (!marked) {
        throw new DomainError(409, 'This step was taken back meanwhile. Nothing changed.', {
          code: TOUR_CHANGE_STEP_UNDONE,
        });
      }
      return { step, ...written };
    });
    const detail = await this.tours.announceRouteUpdate(String(tripId), placeId, restored);
    return {
      undone: true as const,
      step: { id: restored.step.id, revision: restored.step.revision, undone_revision: restored.revision },
      tour: writtenTour(detail, restored.revision),
      stations: writtenStations(detail),
    };
  }

  /**
   * The tour, the step and what taking it back works on, once everything is
   * checked: the step is this tour's latest change and keeps the tour before
   * it, the tour is at the revision the preview was read at, and nothing done
   * since would be lost. Anything else is a refusal, and nothing is written.
   */
  private async checked(tripId: number, placeId: number, stepId: number, expected?: number) {
    const { tour, waypoints } = await this.tours.getTour(String(tripId), String(placeId));
    const step = await this.stepsRepo.findForPlace(placeId, stepId);
    if (!step) {
      throw new DomainError(404, `This tour has no saved step ${stepId}. Nothing changed.`, {
        code: TOUR_CHANGE_STEP_NOT_FOUND,
      });
    }
    const now = tour.revision ?? null;
    const standing = standingOf(step, beforeOf(step), now);
    if (standing.kind !== 'latest') throw standingRefusal(standing.kind, step, now);
    if (expected !== undefined && expected !== now) {
      throw tourRevisionConflict(
        now,
        `The tour is at revision ${now} now, not ${expected} as the preview was read. Nothing changed: prepare taking the step back again with prepare_tour_undo.`,
      );
    }
    const { before } = standing;
    const [visits, linkable] = await Promise.all([
      this.visitsRepo.listForPlace(tripId, placeId),
      this.waypointsRepo.linkablePlaceIds(tripId, linkedIds(before.waypoints)),
    ]);
    const basis = { now: waypoints, before, done: doneByKey(visits), linkable };
    const refused = undoRefusals(basis);
    if (refused.length > 0) {
      throw new DomainError(409, undoRefusalText(refused), { code: TOUR_CHANGE_UNDO_REFUSED, details: { refused } });
    }
    return { tour, step, basis };
  }
}
