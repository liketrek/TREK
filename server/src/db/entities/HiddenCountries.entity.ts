import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class HiddenCountries {
  id?: number | null;
  user!: Ref<Users>;
  countryCode!: string;
  createdAt?: Date | null;
}

export class HiddenCountriesRepository extends EntityRepository<HiddenCountries> {}

export const HiddenCountriesSchema = defineEntity({
  class: HiddenCountries,
  repository: () => HiddenCountriesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_hidden_countries_user'),
    countryCode: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
