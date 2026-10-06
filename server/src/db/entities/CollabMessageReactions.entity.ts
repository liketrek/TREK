import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollabMessageReactionsRepository } from '../repositories/CollabMessageReactions.repository';
import { DbTimestampType } from '../types';
import { CollabMessages } from './CollabMessages.entity';
import { Users } from './Users.entity';

export class CollabMessageReactions {
  [EntityRepositoryType]?: CollabMessageReactionsRepository;
  id!: number & Opt;
  message!: Ref<CollabMessages>;
  message_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  emoji!: string;
  created_at?: string | null;
}

export const CollabMessageReactionsSchema = defineEntity({
  class: CollabMessageReactions,
  repository: () => CollabMessageReactionsRepository,
  uniques: [{ properties: ['message', 'user', 'emoji'] }],
  properties: {
    id: p.integer().primary(),
    message: () => p.manyToOne(CollabMessages).ref().deleteRule('cascade').hidden().index('idx_collab_reactions_msg'),
    message_id: p.integer().persist(false).index('idx_collab_reactions_msg'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    emoji: p.text(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
