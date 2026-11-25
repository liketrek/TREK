import type { AiTravelPlanRevisions } from '../entities/AiTravelPlanRevisions.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type AiTravelPlanRevisionsKyselyDB = Pick<DB, 'ai_travel_plan_revisions'>;

/** The immutable drafts of an AI travel plan, one row per version. */
export class AiTravelPlanRevisionsRepository extends TrekRepository<AiTravelPlanRevisions> {
  /** Every revision of a plan, oldest first. */
  findByPlan(planId: number): Promise<AiTravelPlanRevisions[]> {
    return this.find({ plan: planId }, { orderBy: { version: 'asc' } });
  }

  /** Keeps one revision of a plan; answers its id. */
  async insertRevision(revision: {
    planId: number;
    version: number;
    reason: string | null;
    draftJson: string;
    factsJson: string;
    warningsJson: string;
    modelMetaJson: string;
    durationMs: number | null;
    createdAt: string;
  }): Promise<number> {
    const db = this.kysely<AiTravelPlanRevisionsKyselyDB>();
    const row = await db
      .insertInto('ai_travel_plan_revisions')
      .values({
        plan_id: revision.planId,
        version: revision.version,
        reason: revision.reason,
        draft_json: revision.draftJson,
        facts_json: revision.factsJson,
        warnings_json: revision.warningsJson,
        model_meta_json: revision.modelMetaJson,
        duration_ms: revision.durationMs,
        created_at: revision.createdAt,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return Number(row.id);
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
