import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollabPolls } from './CollabPolls.entity';
import { Users } from './Users.entity';

export class CollabPollVotes {
  id?: number | null;
  poll!: Ref<CollabPolls>;
  user!: Ref<Users>;
  optionIndex!: number;
  createdAt?: Date | null;
}

export class CollabPollVotesRepository extends EntityRepository<CollabPollVotes> {}

export const CollabPollVotesSchema = defineEntity({
  class: CollabPollVotes,
  repository: () => CollabPollVotesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    poll: () => p.manyToOne(CollabPolls).ref().deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    optionIndex: p.integer(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
