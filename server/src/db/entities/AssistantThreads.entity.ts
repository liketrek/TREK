import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AssistantThreadsRepository } from '../repositories/AssistantThreads.repository';
import { DbTimestampType } from '../types';
import { AssistantMessages } from './AssistantMessages.entity';
import { AssistantToolCalls } from './AssistantToolCalls.entity';
import { Journeys } from './Journeys.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class AssistantThreads {
  [EntityRepositoryType]?: AssistantThreadsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  trip?: Ref<Trips> | null;
  trip_id?: number | null;
  journey?: Ref<Journeys> | null;
  journey_id?: number | null;
  title!: string;
  created_at!: string & Opt;
  last_message_at!: string & Opt;
  assistant_messages_collection = new Collection<AssistantMessages>(this);
  assistant_tool_calls_collection = new Collection<AssistantToolCalls>(this);
}

export const AssistantThreadsSchema = defineEntity({
  class: AssistantThreads,
  repository: () => AssistantThreadsRepository,
  indexes: [
    {
      name: 'idx_assistant_threads_user_trip',
      properties: ['user_id', 'trip_id', 'last_message_at'],
    },
    {
      name: 'idx_assistant_threads_user_journey',
      properties: ['user_id', 'journey_id', 'last_message_at'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').nullable().hidden().index('idx_assistant_threads_trip'),
    trip_id: p.integer().nullable().persist(false).index('idx_assistant_threads_trip'),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').nullable().hidden().index('idx_assistant_threads_journey'),
    journey_id: p.integer().nullable().persist(false).index('idx_assistant_threads_journey'),
    title: p.text(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    last_message_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    assistant_messages_collection: () => p.oneToMany(AssistantMessages).mappedBy('thread').hidden(),
    assistant_tool_calls_collection: () => p.oneToMany(AssistantToolCalls).mappedBy('thread').hidden(),
  },
});
