import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourActivityExclusionsRepository } from '../repositories/TourActivityExclusions.repository';
import { DbTimestampType } from '../types';
import { Tours } from './Tours.entity';
import { Users } from './Users.entity';

export class TourActivityExclusions {
  [EntityRepositoryType]?: TourActivityExclusionsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  place!: Ref<Tours>;
  place_id!: number;
  excluded_at!: string & Opt;
}

export const TourActivityExclusionsSchema = defineEntity({
  class: TourActivityExclusions,
  repository: () => TourActivityExclusionsRepository,
  uniques: [{ properties: ['user', 'place'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    place: () => p.manyToOne(Tours).ref().name('place_id').deleteRule('cascade').hidden().index('idx_tour_activity_exclusions_place'),
    place_id: p.integer().persist(false).index('idx_tour_activity_exclusions_place'),
    excluded_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
