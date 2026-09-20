import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class VisitedRegions {
  id?: number | null;
  user!: Ref<Users>;
  regionCode!: string;
  regionName!: string;
  countryCode!: string;
  createdAt?: Date | null;
}

export class VisitedRegionsRepository extends EntityRepository<VisitedRegions> {}

export const VisitedRegionsSchema = defineEntity({
  class: VisitedRegions,
  repository: () => VisitedRegionsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    regionCode: p.text(),
    regionName: p.text(),
    countryCode: p.text().index('idx_visited_regions_country'),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
