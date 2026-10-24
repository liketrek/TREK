import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { DomainError } from '../common/domain-error';
import { NotFoundException } from '@nestjs/common';
import { TOUR_REVISION_CONFLICT } from '@trek/shared';

/**
 * P2C-03: the one revision contract of a saved tour. Every write that changes
 * a tour (its route and controls, the plan laid onto a recorded track, going
 * back to that track) raises the revision inside its own transaction through
 * here, before anything else of it is written. A write naming the revision it
 * was based on is refused with a 409 while the tour has moved on, so a stale
 * draft never overwrites a newer tour unseen; a write naming none writes as
 * before. A copy starts at 1, and the version of an imported source is its
 * provenance, never this.
 */
export async function advanceTourRevision(
  toursRepo: ToursRepository,
  placeId: number,
  expected?: number | null,
): Promise<number> {
  const next = await toursRepo.advanceRevision(placeId, expected);
  if (next !== null) return next;
  const current = await toursRepo.revisionOf(placeId);
  if (current === undefined) throw new NotFoundException('Tour not found');
  throw tourRevisionConflict(current);
}

/**
 * The 409 of a write based on a revision the tour has moved past, naming the
 * revision it is at now. A caller with its own words for it (a confirmed
 * change saved over MCP, MCP-T03) passes them; the code and details stay.
 */
export function tourRevisionConflict(
  current: number | null,
  message = 'This tour was changed in the meantime',
): DomainError {
  return new DomainError(409, message, {
    code: TOUR_REVISION_CONFLICT,
    details: { code: TOUR_REVISION_CONFLICT, revision: current },
  });
}
