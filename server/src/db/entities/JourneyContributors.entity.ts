import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyContributors {
  [PrimaryKeyProp]?: ['journey', 'user'];
  journey!: Ref<Journeys>;
  user!: Ref<Users>;
  role!: string;
  addedAt!: number;
  hideSkeletons: number & Opt = 0;
}

export class JourneyContributorsRepository extends EntityRepository<JourneyContributors> {}

export const JourneyContributorsSchema = defineEntity({
  class: JourneyContributors,
  repository: () => JourneyContributorsRepository,
  properties: {
    journey: () => p.manyToOne(Journeys).primary().ref(),
    user: () => p.manyToOne(Users).primary().ref().index('idx_journey_contributors_user'),
    role: p.text(),
    addedAt: p.integer(),
    hideSkeletons: p.integer(),
  },
});
