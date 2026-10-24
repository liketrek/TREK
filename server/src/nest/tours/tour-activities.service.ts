import { TourActivities } from '../../db/entities/TourActivities.entity';
import { TourStationVisits } from '../../db/entities/TourStationVisits.entity';
import { Tours } from '../../db/entities/Tours.entity';
import type { TourActivitiesRepository } from '../../db/repositories/TourActivities.repository';
import type { TourStationVisitsRepository } from '../../db/repositories/TourStationVisits.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { TourActivityAssignRequest, TourActivityRefusal, TourDetailResponse } from '@trek/shared';

/** A refusal with its code in the body, so the app can say what went wrong in its own words. */
function refused(httpStatus: 400 | 409, code: TourActivityRefusal, message: string): DomainError {
  return new DomainError(httpStatus, message, { code, details: { code } });
}

/**
 * ACT-01: assigning a recorded track to a tour, and taking it off again. The
 * recording is a tour of the same trip that still holds the line it was
 * recorded with; the assignment points at it for one execution of the tour (a
 * day it is on, or none) and changes nothing of either tour's plan, so it does
 * not raise the tour's revision either: an open draft of the plan stays valid.
 * Every check runs inside the write, so a recording assigned or a day removed
 * meanwhile is refused rather than written over, and a refused write leaves
 * everything as it was. Both surfaces (REST and MCP) call these two methods.
 */
@Injectable()
export class TourActivitiesService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tours: ToursService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(TourActivities) private readonly activitiesRepo: TourActivitiesRepository,
    @InjectRepository(TourStationVisits) private readonly visitsRepo: TourStationVisitsRepository,
  ) {}

  /**
   * The recording becomes the track this execution of the tour was done with,
   * in place of the ones it had (one for a day; "no day" can hold several once
   * the days they were on are gone); a recording already on another execution
   * of the same tour moves here. Answers the tour as the detail reads it.
   */
  async assign(
    tripId: string,
    placeId: string,
    input: TourActivityAssignRequest,
    userId: number,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const { tid, pid } = this.ids(tripId, placeId);
    const trackId = input.track_place_id;
    await this.uow.transactional(async () => {
      if (!(await this.toursRepo.findInTrip(tid, pid))) throw new NotFoundException('Tour not found');
      await this.checkTrack(tid, pid, trackId);
      await this.checkAssignment(tid, pid, input.assignment_id);
      await this.activitiesRepo.clearFor(pid, trackId, input.assignment_id);
      await this.activitiesRepo.insertActivity({
        place_id: pid,
        track_place_id: trackId,
        assignment_id: input.assignment_id,
        assigned_by: userId,
      });
    });
    this.tours.broadcastToursChanged(tripId, [pid, trackId], socketId);
    return await this.tours.getTour(tripId, placeId);
  }

  /** The recording is no longer this tour's; it stays in the trip as the import it is. */
  async unassign(tripId: string, placeId: string, activityId: number, socketId?: string): Promise<TourDetailResponse> {
    const { tid, pid } = this.ids(tripId, placeId);
    const activity = (await this.activitiesRepo.listForPlace(tid, pid)).find((row) => row.id === activityId);
    if (!activity || !(await this.activitiesRepo.removeFromPlace(pid, activityId))) {
      throw new NotFoundException('Recorded track not found');
    }
    this.tours.broadcastToursChanged(tripId, [pid, activity.track_place_id], socketId);
    return await this.tours.getTour(tripId, placeId);
  }

  private ids(tripId: string, placeId: string): { tid: number; pid: number } {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');
    return { tid, pid };
  }

  /**
   * What may be assigned: a tour of this trip that came in as a recording and
   * still is one, that is neither this tour nor one with recordings of its own,
   * and that documents no other tour; and this tour must not be the recording
   * of another. A tour of another trip reads as missing, as any id would.
   */
  private async checkTrack(tripId: number, placeId: number, trackId: number): Promise<void> {
    if (trackId === placeId) throw refused(400, 'activity_track_is_tour', 'A tour cannot be its own recorded track');
    const track = await this.toursRepo.findInTrip(tripId, trackId);
    if (!track) throw new NotFoundException('Recorded track not found');
    if (track.origin === 'trek' || track.has_waypoints) {
      throw refused(400, 'activity_track_not_recorded', 'Only an import that was not planned over can be assigned');
    }
    if (await this.activitiesRepo.hasActivities(trackId)) {
      throw refused(400, 'activity_track_is_tour', 'A tour with recorded tracks of its own cannot be one');
    }
    const used = await this.activitiesRepo.findByTrack(trackId);
    if (used && used.place_id !== placeId) {
      throw refused(409, 'activity_track_in_use', 'This recorded track is assigned to another tour');
    }
    if (await this.activitiesRepo.findByTrack(placeId)) {
      throw refused(400, 'activity_tour_is_track', 'A recorded track of another tour cannot have recorded tracks');
    }
  }

  /** The execution, when one is named, is a day assignment of this very tour in this trip. */
  private async checkAssignment(tripId: number, placeId: number, assignmentId: number | null): Promise<void> {
    if (assignmentId === null) return;
    const assignment = await this.visitsRepo.assignmentInTrip(assignmentId, tripId);
    if (assignment?.place_id !== placeId) {
      throw refused(400, 'activity_assignment_not_of_tour', 'The day is not one this tour is on');
    }
  }
}
