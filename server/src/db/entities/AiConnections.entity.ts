import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AiConnectionsRepository } from '../repositories/AiConnections.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class AiConnections {
  [EntityRepositoryType]?: AiConnectionsRepository;
  id!: number & Opt;
  scope!: string;
  user?: Ref<Users> | null;
  user_id?: number | null;
  kind!: string;
  model!: string;
  base_url?: string | null;
  secrets?: string | null;
  secrets_version: number & Opt = 0;
  hint?: string | null;
  account?: string | null;
  status: string & Opt = 'ok';
  created_at!: string & Opt;
  updated_at!: string & Opt;
}

export const AiConnectionsSchema = defineEntity({
  class: AiConnections,
  repository: () => AiConnectionsRepository,
  uniques: [
    {
      name: 'idx_ai_connections_instance',
      where: 'user_id IS NULL',
      properties: ['scope'],
    },
    {
      name: 'idx_ai_connections_user',
      where: 'user_id IS NOT NULL',
      properties: ['user_id'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    scope: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    kind: p.text(),
    model: p.text(),
    base_url: p.text().nullable(),
    secrets: p.text().nullable(),
    secrets_version: p.integer().default(0),
    hint: p.text().nullable(),
    account: p.text().nullable(),
    status: p.text().default('ok'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
