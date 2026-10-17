import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { UserSessionsRepository } from '../repositories/UserSessions.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class UserSessions {
  [EntityRepositoryType]?: UserSessionsRepository;
  id!: string;
  user!: Ref<Users>;
  user_id!: number;
  created_at!: string & Opt;
  last_seen_at!: string & Opt;
  expires_at!: string;
  revoked_at?: string | null;
  user_agent?: string | null;
}

export const UserSessionsSchema = defineEntity({
  class: UserSessions,
  repository: () => UserSessionsRepository,
  properties: {
    id: p.text().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_user_sessions_user'),
    user_id: p.integer().persist(false).index('idx_user_sessions_user'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    last_seen_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    expires_at: p.type(DbTimestampType).index('idx_user_sessions_expires'),
    revoked_at: p.type(DbTimestampType).nullable(),
    user_agent: p.text().nullable(),
  },
});
