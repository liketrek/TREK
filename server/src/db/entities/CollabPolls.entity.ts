import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollabPollsRepository } from '../repositories/CollabPolls.repository';
import { DbTimestampType } from '../types';
import { CollabPollVotes } from './CollabPollVotes.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabPolls {
  [EntityRepositoryType]?: CollabPollsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  question!: string;
  options!: string;
  multiple?: number | null = 0;
  closed?: number | null = 0;
  deadline?: string | null;
  created_at?: string | null;
  collab_poll_votes_collection = new Collection<CollabPollVotes>(this);
}

export const CollabPollsSchema = defineEntity({
  class: CollabPolls,
  repository: () => CollabPollsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_collab_polls_trip'),
    trip_id: p.integer().persist(false).index('idx_collab_polls_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    question: p.text(),
    options: p.text(),
    multiple: p.integer().nullable(),
    closed: p.integer().nullable(),
    deadline: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    collab_poll_votes_collection: () => p.oneToMany(CollabPollVotes).mappedBy('poll').hidden(),
  },
});
