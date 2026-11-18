import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AiTravelPlansRepository } from '../repositories/AiTravelPlans.repository';
import { DbTimestampType } from '../types';
import { AiTravelPlanRevisions } from './AiTravelPlanRevisions.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class AiTravelPlans {
  [EntityRepositoryType]?: AiTravelPlansRepository;
  id!: number & Opt;
  owner!: Ref<Users>;
  owner_id!: number;
  status!: string;
  request_json!: string;
  current_revision: number & Opt = 0;
  targetTrip?: Ref<Trips> | null;
  target_trip_id?: number | null;
  appliedTrip?: Ref<Trips> | null;
  applied_trip_id?: number | null;
  expires_at?: string | null;
  created_at!: string & Opt;
  updated_at!: string & Opt;
  apply_result_json?: string | null;
  ai_travel_plan_revisions_collection = new Collection<AiTravelPlanRevisions>(this);
}

export const AiTravelPlansSchema = defineEntity({
  class: AiTravelPlans,
  repository: () => AiTravelPlansRepository,
  properties: {
    id: p.integer().primary(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_ai_travel_plans_owner'),
    owner_id: p.integer().persist(false).index('idx_ai_travel_plans_owner'),
    status: p.text(),
    request_json: p.text(),
    current_revision: p.integer().default(0),
    targetTrip: () => p.manyToOne(Trips).ref().nullable().hidden().index('idx_ai_travel_plans_target_trip'),
    target_trip_id: p.integer().nullable().persist(false).index('idx_ai_travel_plans_target_trip'),
    appliedTrip: () => p.manyToOne(Trips).ref().nullable().hidden().index('idx_ai_travel_plans_applied_trip'),
    applied_trip_id: p.integer().nullable().persist(false).index('idx_ai_travel_plans_applied_trip'),
    expires_at: p.type(DbTimestampType).nullable(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    apply_result_json: p.text().nullable(),
    ai_travel_plan_revisions_collection: () => p.oneToMany(AiTravelPlanRevisions).mappedBy('plan').hidden(),
  },
});
