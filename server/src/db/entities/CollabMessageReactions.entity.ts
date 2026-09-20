import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollabMessages } from './CollabMessages.entity';
import { Users } from './Users.entity';

export class CollabMessageReactions {
  id?: number | null;
  message!: Ref<CollabMessages>;
  user!: Ref<Users>;
  emoji!: string;
  createdAt?: Date | null;
}

export class CollabMessageReactionsRepository extends EntityRepository<CollabMessageReactions> {}

export const CollabMessageReactionsSchema = defineEntity({
  class: CollabMessageReactions,
  repository: () => CollabMessageReactionsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    message: () => p.manyToOne(CollabMessages).ref().deleteRule('cascade').index('idx_collab_reactions_msg'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    emoji: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
