import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class VisitedCountries {
  id?: number | null;
  user!: Ref<Users>;
  countryCode!: string;
  createdAt?: Date | null;
  source: string & Opt = 'manual';
}

export class VisitedCountriesRepository extends EntityRepository<VisitedCountries> {}

export const VisitedCountriesSchema = defineEntity({
  class: VisitedCountries,
  repository: () => VisitedCountriesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    countryCode: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    source: p.text(),
  },
});
