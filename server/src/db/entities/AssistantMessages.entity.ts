import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AssistantMessagesRepository } from '../repositories/AssistantMessages.repository';
import { DbTimestampType } from '../types';
import { AssistantThreads } from './AssistantThreads.entity';
import { AssistantToolCalls } from './AssistantToolCalls.entity';

export class AssistantMessages {
  [EntityRepositoryType]?: AssistantMessagesRepository;
  id!: number & Opt;
  thread!: Ref<AssistantThreads>;
  thread_id!: number;
  role!: string;
  parts!: string;
  provider_state?: string | null;
  status: string & Opt = 'complete';
  model?: string | null;
  created_at!: string & Opt;
  assistant_tool_calls_collection = new Collection<AssistantToolCalls>(this);
}

export const AssistantMessagesSchema = defineEntity({
  class: AssistantMessages,
  repository: () => AssistantMessagesRepository,
  indexes: [
    { name: 'idx_assistant_messages_thread', properties: ['thread_id', 'id'] },
  ],
  properties: {
    id: p.integer().primary(),
    thread: () => p.manyToOne(AssistantThreads).ref().deleteRule('cascade').hidden(),
    thread_id: p.integer().persist(false),
    role: p.text(),
    parts: p.text(),
    provider_state: p.text().nullable(),
    status: p.text().default('complete'),
    model: p.text().nullable(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    assistant_tool_calls_collection: () => p.oneToMany(AssistantToolCalls).mappedBy('message').hidden(),
  },
});
