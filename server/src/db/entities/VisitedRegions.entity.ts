import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VisitedRegionsRepository } from '../repositories/VisitedRegions.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class VisitedRegions {
  [EntityRepositoryType]?: VisitedRegionsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  region_code!: string;
  region_name!: string;
  country_code!: string;
  created_at?: string | null;
}

export const VisitedRegionsSchema = defineEntity({
  class: VisitedRegions,
  repository: () => VisitedRegionsRepository,
  uniques: [{ properties: ['user', 'region_code'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    region_code: p.text(),
    region_name: p.text(),
    country_code: p.text().index('idx_visited_regions_country'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
