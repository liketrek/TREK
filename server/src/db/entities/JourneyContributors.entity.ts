import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyContributorsRepository } from '../repositories/JourneyContributors.repository';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyContributors {
  [EntityRepositoryType]?: JourneyContributorsRepository;
  [PrimaryKeyProp]?: ['journey', 'user'];
  journey!: Ref<Journeys>;
  journey_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  role!: string;
  added_at!: number;
  hide_skeletons: number & Opt = 0;
}

export const JourneyContributorsSchema = defineEntity({
  class: JourneyContributors,
  repository: () => JourneyContributorsRepository,
  uniques: [{ properties: ['journey', 'user'] }],
  properties: {
    journey: () => p.manyToOne(Journeys).primary().ref().hidden(),
    journey_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).primary().ref().deleteRule('no action').hidden().index('idx_journey_contributors_user'),
    user_id: p.integer().persist(false).index('idx_journey_contributors_user'),
    role: p.text(),
    added_at: p.integer(),
    hide_skeletons: p.integer().default(0),
  },
});
