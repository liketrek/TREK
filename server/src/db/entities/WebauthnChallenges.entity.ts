import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class WebauthnChallenges {
  id?: number | null;
  challenge!: string;
  user?: Ref<Users> | null;
  type!: string;
  expiresAt!: number;
  createdAt?: Date | null;
}

export class WebauthnChallengesRepository extends EntityRepository<WebauthnChallenges> {}

export const WebauthnChallengesSchema = defineEntity({
  class: WebauthnChallenges,
  repository: () => WebauthnChallengesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    challenge: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').nullable(),
    type: p.text(),
    expiresAt: p.integer().index('idx_webauthn_challenges_expires'),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
