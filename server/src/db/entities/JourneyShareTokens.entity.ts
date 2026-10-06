import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyShareTokensRepository } from '../repositories/JourneyShareTokens.repository';
import { DbTimestampType } from '../types';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyShareTokens {
  [EntityRepositoryType]?: JourneyShareTokensRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  token!: string;
  created_by!: number;
  share_timeline?: number | null = 1;
  share_gallery?: number | null = 1;
  share_map?: number | null = 1;
  created_at?: string | null;
  newest_first: number & Opt = 0;
  createdByRef!: Ref<Users>;
}

export const JourneyShareTokensSchema = defineEntity({
  class: JourneyShareTokens,
  repository: () => JourneyShareTokensRepository,
  uniques: [{ properties: ['token'] }],
  properties: {
    id: p.integer().primary(),
    journey: () => p.oneToOne(Journeys).ref().deleteRule('cascade').hidden().unique('idx_journey_share_journey'),
    journey_id: p.integer().persist(false).unique('idx_journey_share_journey'),
    token: p.text(),
    created_by: p.integer().persist(false),
    share_timeline: p.integer().nullable(),
    share_gallery: p.integer().nullable(),
    share_map: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    newest_first: p.integer().default(0),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').hidden(),
  },
});
