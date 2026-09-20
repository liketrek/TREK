import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class McpTokens {
  id?: number | null;
  user!: Ref<Users>;
  name!: string;
  tokenHash!: string;
  tokenPrefix!: string;
  createdAt?: Date | null;
  lastUsedAt?: Date | null;
  kind: string & Opt = 'mcp';
  scopeMode: string & Opt = 'all';
  apiScopes?: string | null;
}

export class McpTokensRepository extends EntityRepository<McpTokens> {}

export const McpTokensSchema = defineEntity({
  class: McpTokens,
  repository: () => McpTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    name: p.text(),
    tokenHash: p.text().unique('idx_mcp_tokens_hash'),
    tokenPrefix: p.text(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    lastUsedAt: p.datetime().nullable(),
    kind: p.text(),
    scopeMode: p.text(),
    apiScopes: p.text().nullable(),
  },
});
