import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollabPollVotes } from './CollabPollVotes.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabPolls {
  id?: number | null;
  trip!: Ref<Trips>;
  user!: Ref<Users>;
  question!: string;
  options!: string;
  multiple?: number | null = 0;
  closed?: number | null = 0;
  deadline?: string | null;
  createdAt?: Date | null;
  collabPollVotesCollection = new Collection<CollabPollVotes>(this);
}

export class CollabPollsRepository extends EntityRepository<CollabPolls> {}

export const CollabPollsSchema = defineEntity({
  class: CollabPolls,
  repository: () => CollabPollsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_collab_polls_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    question: p.text(),
    options: p.text(),
    multiple: p.integer().nullable(),
    closed: p.integer().nullable(),
    deadline: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    collabPollVotesCollection: () => p.oneToMany(CollabPollVotes).mappedBy('poll'),
  },
});
