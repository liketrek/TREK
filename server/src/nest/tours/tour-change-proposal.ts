import type { DomainError } from '../common/domain-error';
import { tourRevisionConflict } from './tour-revision';
import type { TourChange } from '@trek/shared';

import { createHash } from 'node:crypto';

/** What a proposal is: these changes, to this tour of this trip, at this revision. */
export interface ProposalBasis {
  tripId: number;
  placeId: number;
  /** Null only for a tour read before revisions were counted, which no save can name. */
  revision: number | null;
  changes: readonly TourChange[];
}

/**
 * MCP-T03: the id of a prepared proposal, the same for the same tour,
 * revision and changes and different for any other. A preparation answers
 * it, and a save has to name it, so what is saved is the very proposal the
 * traveller was shown and nothing an assistant changed on the way. It binds a
 * save to its review, it is no secret: the revision guards against a tour
 * that moved on.
 */
export function proposalIdOf({ tripId, placeId, revision, changes }: ProposalBasis): string {
  return createHash('sha256')
    .update(JSON.stringify([tripId, placeId, revision, changes]))
    .digest('hex')
    .slice(0, 32);
}

/**
 * The conflict of a save whose proposal was prepared on a revision the tour
 * has moved past: nothing is saved, and the assistant is told to read the
 * tour again and prepare the change anew rather than retry the old one.
 */
export function staleProposal(prepared: number, current: number | null): DomainError {
  return tourRevisionConflict(
    current,
    `The tour was changed after this proposal was prepared (revision ${prepared} then, ${current ?? 'unknown'} now). Nothing was saved: read it again with get_tour_plan and prepare the change anew.`,
  );
}
