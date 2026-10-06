import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollabPollVotesRepository } from '../repositories/CollabPollVotes.repository';
import { DbTimestampType } from '../types';
import { CollabPolls } from './CollabPolls.entity';
import { Users } from './Users.entity';

export class CollabPollVotes {
  [EntityRepositoryType]?: CollabPollVotesRepository;
  id!: number & Opt;
  poll!: Ref<CollabPolls>;
  poll_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  option_index!: number;
  created_at?: string | null;
}

export const CollabPollVotesSchema = defineEntity({
  class: CollabPollVotes,
  repository: () => CollabPollVotesRepository,
  uniques: [{ properties: ['poll', 'user', 'option_index'] }],
  properties: {
    id: p.integer().primary(),
    poll: () => p.manyToOne(CollabPolls).ref().deleteRule('cascade').hidden(),
    poll_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    option_index: p.integer(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
