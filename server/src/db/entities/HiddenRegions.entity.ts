import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class HiddenRegions {
  id?: number | null;
  user!: Ref<Users>;
  regionCode!: string;
  countryCode!: string;
  createdAt?: Date | null;
}

export class HiddenRegionsRepository extends EntityRepository<HiddenRegions> {}

export const HiddenRegionsSchema = defineEntity({
  class: HiddenRegions,
  repository: () => HiddenRegionsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_hidden_regions_user'),
    regionCode: p.text(),
    countryCode: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
