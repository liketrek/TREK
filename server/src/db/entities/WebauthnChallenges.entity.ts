import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { WebauthnChallengesRepository } from '../repositories/WebauthnChallenges.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class WebauthnChallenges {
  [EntityRepositoryType]?: WebauthnChallengesRepository;
  id!: number & Opt;
  challenge!: string;
  user?: Ref<Users> | null;
  user_id?: number | null;
  type!: string;
  expires_at!: number;
  created_at?: string | null;
}

export const WebauthnChallengesSchema = defineEntity({
  class: WebauthnChallenges,
  repository: () => WebauthnChallengesRepository,
  uniques: [{ properties: ['challenge'] }],
  properties: {
    id: p.integer().primary(),
    challenge: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    type: p.text(),
    expires_at: p.integer().index('idx_webauthn_challenges_expires'),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
