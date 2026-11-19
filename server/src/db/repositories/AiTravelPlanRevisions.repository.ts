import type { AiTravelPlanRevisions } from '../entities/AiTravelPlanRevisions.entity';
import { TrekRepository } from './_shared/trek-repository';

/** The immutable drafts of an AI travel plan, one row per version. */
export class AiTravelPlanRevisionsRepository extends TrekRepository<AiTravelPlanRevisions> {
  /** Every revision of a plan, oldest first. */
  findByPlan(planId: number): Promise<AiTravelPlanRevisions[]> {
    return this.find({ plan: planId }, { orderBy: { version: 'asc' } });
  }

  /** The newest revision, or null for a plan that never generated one. */
  findLatest(planId: number): Promise<AiTravelPlanRevisions | null> {
    return this.findOne({ plan: planId }, { orderBy: { version: 'desc' } });
  }

  /** One version, for the revision response of a concurrent writer. */
  findByVersion(planId: number, version: number): Promise<AiTravelPlanRevisions | null> {
    return this.findOne({ plan: planId, version });
  }

  /**
   * Rewrites one revision's draft in place. Used by the route recalculation,
   * which refreshes the traffic legs of the proposal the traveller is already
   * looking at instead of appending a version (and a quota charge) for it.
   */
  async updateDraft(planId: number, version: number, draftJson: string): Promise<void> {
    await this.nativeUpdate({ plan: planId, version }, { draft_json: draftJson });
  }
}
