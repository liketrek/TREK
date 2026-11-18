import type { AiTravelPlans } from '../entities/AiTravelPlans.entity';
import { TrekRepository } from './_shared/trek-repository';

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
}
