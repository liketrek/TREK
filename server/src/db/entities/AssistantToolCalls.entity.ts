import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AssistantToolCallsRepository } from '../repositories/AssistantToolCalls.repository';
import { DbTimestampType } from '../types';
import { AssistantMessages } from './AssistantMessages.entity';
import { AssistantThreads } from './AssistantThreads.entity';

export class AssistantToolCalls {
  [EntityRepositoryType]?: AssistantToolCallsRepository;
  id!: string;
  thread!: Ref<AssistantThreads>;
  thread_id!: number;
  message!: Ref<AssistantMessages>;
  message_id!: number;
  provider_call_id!: string;
  tool_name!: string;
  args!: string;
  preview!: string;
  state: string & Opt = 'approval_requested';
  result?: string | null;
  undo_until?: string | null;
  created_at!: string & Opt;
  decided_at?: string | null;
}

export const AssistantToolCallsSchema = defineEntity({
  class: AssistantToolCalls,
  repository: () => AssistantToolCallsRepository,
  uniques: [{ properties: ['thread', 'provider_call_id'] }],
  properties: {
    id: p.text().primary(),
    thread: () => p.manyToOne(AssistantThreads).ref().deleteRule('cascade').hidden(),
    thread_id: p.integer().persist(false),
    message: () => p.manyToOne(AssistantMessages).ref().deleteRule('cascade').hidden().index('idx_assistant_tool_calls_message'),
    message_id: p.integer().persist(false).index('idx_assistant_tool_calls_message'),
    provider_call_id: p.text(),
    tool_name: p.text(),
    args: p.text(),
    preview: p.text(),
    state: p.text().default('approval_requested'),
    result: p.text().nullable(),
    undo_until: p.type(DbTimestampType).nullable(),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    decided_at: p.type(DbTimestampType).nullable(),
  },
});
