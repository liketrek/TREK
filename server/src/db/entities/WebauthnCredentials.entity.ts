import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { WebauthnCredentialsRepository } from '../repositories/WebauthnCredentials.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class WebauthnCredentials {
  [EntityRepositoryType]?: WebauthnCredentialsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  credential_id!: string;
  public_key!: Buffer;
  counter: number & Opt = 0;
  transports?: string | null;
  device_type?: string | null;
  backed_up: number & Opt = 0;
  name?: string | null;
  aaguid?: string | null;
  created_at?: string | null;
  last_used_at?: string | null;
}

export const WebauthnCredentialsSchema = defineEntity({
  class: WebauthnCredentials,
  repository: () => WebauthnCredentialsRepository,
  uniques: [{ properties: ['credential_id'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_webauthn_credentials_user'),
    user_id: p.integer().persist(false).index('idx_webauthn_credentials_user'),
    credential_id: p.text(),
    public_key: p.blob(),
    counter: p.integer().default(0),
    transports: p.text().nullable(),
    device_type: p.text().nullable(),
    backed_up: p.integer().default(0),
    name: p.text().nullable(),
    aaguid: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    last_used_at: p.type(DbTimestampType).nullable(),
  },
});
