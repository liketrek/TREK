import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class DawarichConnections {
  [PrimaryKeyProp]?: 'user';
  user?: Ref<Users> | null;
  url?: string | null;
  apiKey?: string | null;
  allowInsecureTls: number & Opt = 0;
  syncEnabled: number & Opt = 1;
  lastSyncAt?: string | null;
  lastSyncState: string & Opt = 'never';
  lastSyncError?: string | null;
  capabilities?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export class DawarichConnectionsRepository extends EntityRepository<DawarichConnections> {}

export const DawarichConnectionsSchema = defineEntity({
  class: DawarichConnections,
  repository: () => DawarichConnectionsRepository,
  properties: {
    user: () => p.oneToOne(Users).primary().ref().nullable(),
    url: p.text().nullable(),
    apiKey: p.text().nullable(),
    allowInsecureTls: p.integer(),
    syncEnabled: p.integer(),
    lastSyncAt: p.text().nullable(),
    lastSyncState: p.text(),
    lastSyncError: p.text().nullable(),
    capabilities: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
