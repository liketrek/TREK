import { Tours } from '../../db/entities/Tours.entity';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { advanceTourRevision } from './tour-revision';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { TourDetailResponse, TourSkiClassificationRequest } from '@trek/shared';

/**
 * SKI-02: a ski track classified again after its import, when the discipline
 * or the cross-country technique chosen then was not the right one. Only the
 * classification changes: the recorded track, its measures, its days and its
 * provenance stay as they are, and nothing is routed. A tour that is no ski
 * track has no classification to change.
 */
@Injectable()
export class TourSkiService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tours: ToursService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
  ) {}

  async classify(
    tripId: string,
    placeId: string,
    input: TourSkiClassificationRequest,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');

    await this.uow.transactional(async () => {
      const row = await this.toursRepo.findInTrip(tid, pid);
      if (!row) throw new NotFoundException('Tour not found');
      if (row.tour_type !== 'ski') {
        throw new DomainError(400, 'Only a ski track has a ski classification', {
          code: 'not_a_ski_track',
          details: { code: 'not_a_ski_track' },
        });
      }
      await advanceTourRevision(this.toursRepo, pid, input.expected_revision);
      await this.toursRepo.updateSkiInTrip(tid, pid, {
        ski_discipline: input.ski_discipline,
        ski_technique: input.ski_technique ?? null,
      });
    });

    const result = await this.tours.getTour(tripId, placeId);
    this.tours.broadcastToursChanged(tripId, [pid], socketId);
    return result;
  }
}
