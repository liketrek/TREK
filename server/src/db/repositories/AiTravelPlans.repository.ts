import type { AiTravelPlans } from '../entities/AiTravelPlans.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type AiTravelPlansKyselyDB = Pick<DB, 'ai_travel_plans' | 'ai_travel_plan_revisions'>;

/** One traveller's AI travel plan. A plan is personal: only its owner reads it. */
export class AiTravelPlansRepository extends TrekRepository<AiTravelPlans> {
  /** The plan, only when `ownerId` owns it; another owner's plan is "not found". */
  findOwned(id: number, ownerId: number): Promise<AiTravelPlans | null> {
    return this.findOne({ id, owner: ownerId });
  }

  /** The owner's plans, newest edit first. */
  listOwned(ownerId: number, limit: number): Promise<AiTravelPlans[]> {
    return this.find({ owner: ownerId }, { orderBy: { updated_at: 'desc' }, limit });
  }

  /**
   * Generation attempts the owner started since `since`: every stored revision
   * (a create's first draft and each revise) plus a plan that never got one
   * (a streaming create that is still running or failed). Counting the
   * revision, not the plan, keeps a create followed by a revise at two.
   */
  async countGenerationsSince(ownerId: number, since: string): Promise<number> {
    const db = this.kysely<AiTravelPlansKyselyDB>();
    const [revisions, unfinished] = await Promise.all([
      db
        .selectFrom('ai_travel_plan_revisions as revisions')
        .innerJoin('ai_travel_plans as plans', 'plans.id', 'revisions.plan_id')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('plans.owner_id', '=', ownerId)
        .where('revisions.created_at', '>=', since)
        .executeTakeFirst(),
      db
        .selectFrom('ai_travel_plans')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('owner_id', '=', ownerId)
        .where('created_at', '>=', since)
        .where('current_revision', '=', 0)
        .executeTakeFirst(),
    ]);
    return Number(revisions?.count ?? 0) + Number(unfinished?.count ?? 0);
  }
}
