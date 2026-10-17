import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { WandererConnectionsRepository } from '../repositories/WandererConnections.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class WandererConnections {
  [EntityRepositoryType]?: WandererConnectionsRepository;
  [PrimaryKeyProp]?: 'user';
  user?: Ref<Users> | null;
  user_id?: number | null;
  url!: string;
  token?: string | null;
  allow_insecure_tls: number & Opt = 0;
  last_checked_at?: string | null;
  last_check_ok?: number | null;
  last_check_error?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const WandererConnectionsSchema = defineEntity({
  class: WandererConnections,
  repository: () => WandererConnectionsRepository,
  properties: {
    user: () => p.oneToOne(Users).primary().ref().deleteRule('cascade').nullable().hidden(),
    user_id: p.integer().nullable().persist(false),
    url: p.text(),
    token: p.text().nullable(),
    allow_insecure_tls: p.integer().default(0),
    last_checked_at: p.text().nullable(),
    last_check_ok: p.integer().nullable(),
    last_check_error: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
