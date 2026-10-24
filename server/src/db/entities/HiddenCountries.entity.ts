import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { HiddenCountriesRepository } from '../repositories/HiddenCountries.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class HiddenCountries {
  [EntityRepositoryType]?: HiddenCountriesRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  country_code!: string;
  created_at?: string | null;
}

export const HiddenCountriesSchema = defineEntity({
  class: HiddenCountries,
  repository: () => HiddenCountriesRepository,
  uniques: [{ properties: ['user', 'country_code'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_hidden_countries_user'),
    user_id: p.integer().persist(false).index('idx_hidden_countries_user'),
    country_code: p.text(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
