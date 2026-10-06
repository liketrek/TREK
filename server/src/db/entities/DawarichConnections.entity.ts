import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DawarichConnectionsRepository } from '../repositories/DawarichConnections.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class DawarichConnections {
  [EntityRepositoryType]?: DawarichConnectionsRepository;
  [PrimaryKeyProp]?: 'user';
  user?: Ref<Users> | null;
  user_id?: number | null;
  url?: string | null;
  api_key?: string | null;
  allow_insecure_tls: number & Opt = 0;
  sync_enabled: number & Opt = 1;
  last_sync_at?: string | null;
  last_sync_state: string & Opt = 'never';
  last_sync_error?: string | null;
  capabilities?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const DawarichConnectionsSchema = defineEntity({
  class: DawarichConnections,
  repository: () => DawarichConnectionsRepository,
  properties: {
    user: () => p.oneToOne(Users).primary().ref().deleteRule('cascade').nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    url: p.text().nullable(),
    api_key: p.text().nullable(),
    allow_insecure_tls: p.integer().default(0),
    sync_enabled: p.integer().default(1),
    last_sync_at: p.text().nullable(),
    last_sync_state: p.text().default('never'),
    last_sync_error: p.text().nullable(),
    capabilities: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
