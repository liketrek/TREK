/**
 * advanceTourRevision (P2C-03): the one revision contract every tour write runs
 * inside its transaction. The SQL is covered by Tours.repository.test.ts and
 * the routes by tours-planned.e2e.test.ts; this pins the three answers.
 */
import type { ToursRepository } from '../../../src/db/repositories/Tours.repository';
import { DomainError } from '../../../src/nest/common/domain-error';
import { advanceTourRevision } from '../../../src/nest/tours/tour-revision';
import { NotFoundException } from '@nestjs/common';

import { describe, expect, it, vi } from 'vitest';

function repo(next: number | null, current: number | undefined) {
  return {
    advanceRevision: vi.fn(async () => next),
    revisionOf: vi.fn(async () => current),
  } as unknown as ToursRepository & {
    advanceRevision: ReturnType<typeof vi.fn>;
    revisionOf: ReturnType<typeof vi.fn>;
  };
}

describe('advanceTourRevision', () => {
  it('answers the raised revision and passes the expected one on', async () => {
    const tours = repo(4, 4);
    expect(await advanceTourRevision(tours, 7, 3)).toBe(4);
    expect(tours.advanceRevision).toHaveBeenCalledWith(7, 3);
    expect(tours.revisionOf).not.toHaveBeenCalled();
  });

  it('refuses a stale base with a 409 that names the revision the tour has now', async () => {
    const refusal = await advanceTourRevision(repo(null, 5), 7, 3).catch((err: unknown) => err);
    expect(refusal).toBeInstanceOf(DomainError);
    expect((refusal as DomainError).getStatus()).toBe(409);
    expect((refusal as DomainError).toBody()).toEqual({
      error: 'This tour was changed in the meantime',
      code: 'tour_revision_conflict',
      revision: 5,
    });
  });

  it('is a 404 when the tour went away meanwhile', async () => {
    await expect(advanceTourRevision(repo(null, undefined), 7)).rejects.toBeInstanceOf(NotFoundException);
  });
});
