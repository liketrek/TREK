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
}
