import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { RoadtripDayBoundaries } from '../../db/entities/RoadtripDayBoundaries.entity';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import type { RoadtripDayBoundariesRepository } from '../../db/repositories/RoadtripDayBoundaries.repository';
import { DomainError } from '../common/domain-error';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { RoadtripDayBoundary } from '@trek/shared';

@Injectable()
export class DayBoundariesService {
  constructor(
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(RoadtripDayBoundaries) private readonly boundariesRepo: RoadtripDayBoundariesRepository,
  ) {}

  /** RB1 — `RoadtripDayBoundariesRepository.listForTrip`. */
  async list(tripId: string | number): Promise<RoadtripDayBoundary[]> {
    return await this.boundariesRepo.listForTrip(Number(tripId));
  }

  async save(tripId: string | number, boundary: RoadtripDayBoundary): Promise<RoadtripDayBoundary[]> {
    const tripIdNum = Number(tripId);
    // RB2 — `belongs`, a synchronous closure over `this.db.get` in the legacy code
    // (inventory §18.4: converted naively, `!belongs(x)` on a Promise is always
    // `false`, accepting a foreign assignment id). Every call site below is
    // `await`ed — the async-closure-truthiness-guards ratchet
    // (`tests/integration/async-closure-truthiness-guards.test.ts`, RB2-001,
    // Task 0) stays green with the `await`, and goes red the moment one is
    // dropped (proven for this task's report by hand-dropping one and reverting).
    // `DayAssignmentsRepository.findInTrip` (AS12) is the trip-scoped read.
    const belongs = async (id: number) => !!(await this.dayAssignmentsRepo.findInTrip(id, tripIdNum));
    if (
      !(await belongs(boundary.from_assignment_id)) ||
      (boundary.to_assignment_id !== null && !(await belongs(boundary.to_assignment_id)))
    ) {
      throw new DomainError(404, 'Stop not found');
    }
    // RB2 → RB3, un-transacted (R7 — pin, don't fix): the ownership check above and
    // the upsert below are two statements, not one.
    // RB3 — `RoadtripDayBoundariesRepository.upsertBoundary`. `to_assignment_id ===
    // null ? 1 : fraction` stays the service's own coercion, unchanged.
    await this.boundariesRepo.upsertBoundary(tripIdNum, {
      ...boundary,
      fraction: boundary.to_assignment_id === null ? 1 : boundary.fraction,
    });
    return await this.list(tripIdNum);
  }

  /** RB4 — `RoadtripDayBoundariesRepository.deleteForDay`, silent on a miss. */
  async remove(tripId: string | number, dayNumber: number): Promise<RoadtripDayBoundary[]> {
    await this.boundariesRepo.deleteForDay(Number(tripId), dayNumber);
    return await this.list(tripId);
  }
}
