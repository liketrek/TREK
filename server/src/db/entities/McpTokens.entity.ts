import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { McpTokensRepository } from '../repositories/McpTokens.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class McpTokens {
  [EntityRepositoryType]?: McpTokensRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  name!: string;
  token_hash!: string;
  token_prefix!: string;
  created_at?: string | null;
  last_used_at?: string | null;
  kind: string & Opt = 'mcp';
  scope_mode: string & Opt = 'all';
  api_scopes?: string | null;
}

export const McpTokensSchema = defineEntity({
  class: McpTokens,
  repository: () => McpTokensRepository,
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    name: p.text(),
    token_hash: p.text().unique('idx_mcp_tokens_hash'),
    token_prefix: p.text(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    last_used_at: p.type(DbTimestampType).nullable(),
    kind: p.text().default('mcp'),
    scope_mode: p.text().default('all'),
    api_scopes: p.text().nullable(),
  },
});
