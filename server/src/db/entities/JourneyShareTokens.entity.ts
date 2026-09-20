import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyShareTokens {
  id?: number | null;
  journey!: Ref<Journeys>;
  token!: string;
  createdBy!: Ref<Users>;
  shareTimeline?: number | null = 1;
  shareGallery?: number | null = 1;
  shareMap?: number | null = 1;
  createdAt?: Date | null;
  newestFirst: number & Opt = 0;
}

export class JourneyShareTokensRepository extends EntityRepository<JourneyShareTokens> {}

export const JourneyShareTokensSchema = defineEntity({
  class: JourneyShareTokens,
  repository: () => JourneyShareTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    journey: () => p.oneToOne(Journeys).ref().deleteRule('cascade').unique('idx_journey_share_journey'),
    token: p.text(),
    createdBy: () => p.manyToOne(Users).ref().name('created_by'),
    shareTimeline: p.integer().nullable(),
    shareGallery: p.integer().nullable(),
    shareMap: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    newestFirst: p.integer(),
  },
});
