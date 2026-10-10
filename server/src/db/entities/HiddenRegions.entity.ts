import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { HiddenRegionsRepository } from '../repositories/HiddenRegions.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class HiddenRegions {
  [EntityRepositoryType]?: HiddenRegionsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  region_code!: string;
  country_code!: string;
  created_at?: string | null;
}

export const HiddenRegionsSchema = defineEntity({
  class: HiddenRegions,
  repository: () => HiddenRegionsRepository,
  uniques: [{ properties: ['user', 'region_code'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_hidden_regions_user'),
    user_id: p.integer().persist(false).index('idx_hidden_regions_user'),
    region_code: p.text(),
    country_code: p.text(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
