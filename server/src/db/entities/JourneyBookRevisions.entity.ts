import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyBookRevisionsRepository } from '../repositories/JourneyBookRevisions.repository';
import { DbTimestampType } from '../types';
import { Journeys } from './Journeys.entity';

export class JourneyBookRevisions {
  [EntityRepositoryType]?: JourneyBookRevisionsRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  version!: number;
  document!: string;
  created_at!: string & Opt;
}

export const JourneyBookRevisionsSchema = defineEntity({
  class: JourneyBookRevisions,
  repository: () => JourneyBookRevisionsRepository,
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden().index('idx_journey_book_revisions_journey'),
    journey_id: p.integer().persist(false).index('idx_journey_book_revisions_journey'),
    version: p.integer(),
    document: p.text(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
