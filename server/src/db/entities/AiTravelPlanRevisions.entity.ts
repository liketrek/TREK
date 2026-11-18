import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AiTravelPlanRevisionsRepository } from '../repositories/AiTravelPlanRevisions.repository';
import { DbTimestampType } from '../types';
import { AiTravelPlans } from './AiTravelPlans.entity';

export class AiTravelPlanRevisions {
  [EntityRepositoryType]?: AiTravelPlanRevisionsRepository;
  id!: number & Opt;
  plan!: Ref<AiTravelPlans>;
  plan_id!: number;
  version!: number;
  reason?: string | null;
  draft_json!: string;
  facts_json!: string;
  warnings_json!: string;
  model_meta_json!: string;
  duration_ms?: number | null;
  created_at!: string & Opt;
}

export const AiTravelPlanRevisionsSchema = defineEntity({
  class: AiTravelPlanRevisions,
  repository: () => AiTravelPlanRevisionsRepository,
  uniques: [{ properties: ['plan', 'version'] }],
  properties: {
    id: p.integer().primary(),
    plan: () => p.manyToOne(AiTravelPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    version: p.integer(),
    reason: p.text().nullable(),
    draft_json: p.text(),
    facts_json: p.text(),
    warnings_json: p.text(),
    model_meta_json: p.text(),
    duration_ms: p.integer().nullable(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
