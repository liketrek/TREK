import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VisitedCountriesRepository } from '../repositories/VisitedCountries.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class VisitedCountries {
  [EntityRepositoryType]?: VisitedCountriesRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  country_code!: string;
  created_at?: string | null;
  source: string & Opt = 'manual';
}

export const VisitedCountriesSchema = defineEntity({
  class: VisitedCountries,
  repository: () => VisitedCountriesRepository,
  uniques: [{ properties: ['user', 'country_code'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    country_code: p.text(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    source: p.text().default('manual'),
  },
});
