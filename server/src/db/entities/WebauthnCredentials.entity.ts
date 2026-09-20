import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class WebauthnCredentials {
  id?: number | null;
  user!: Ref<Users>;
  credentialId!: string;
  publicKey!: Buffer;
  counter: number & Opt = 0;
  transports?: string | null;
  deviceType?: string | null;
  backedUp: number & Opt = 0;
  name?: string | null;
  aaguid?: string | null;
  createdAt?: Date | null;
  lastUsedAt?: Date | null;
}

export class WebauthnCredentialsRepository extends EntityRepository<WebauthnCredentials> {}

export const WebauthnCredentialsSchema = defineEntity({
  class: WebauthnCredentials,
  repository: () => WebauthnCredentialsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_webauthn_credentials_user'),
    credentialId: p.text(),
    publicKey: p.blob(),
    counter: p.integer(),
    transports: p.text().nullable(),
    deviceType: p.text().nullable(),
    backedUp: p.integer(),
    name: p.text().nullable(),
    aaguid: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    lastUsedAt: p.datetime().nullable(),
  },
});
