import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripDocumentLinksRepository } from '../repositories/TripDocumentLinks.repository';
import { DbTimestampType } from '../types';
import { DocumentConnections } from './DocumentConnections.entity';
import { DocumentSyncItems } from './DocumentSyncItems.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripDocumentLinks {
  [EntityRepositoryType]?: TripDocumentLinksRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  connection!: Ref<DocumentConnections>;
  connection_id!: number;
  provider_id!: string;
  remote_scope_key!: string;
  remote_root_id?: string | null;
  remote_root_path?: string | null;
  remote_label: string & Opt = '';
  direction: string & Opt = 'both';
  delete_policy: string & Opt = 'unlink';
  conflict_policy: string & Opt = 'manual';
  sync_enabled: number & Opt = 1;
  webhook_token?: string | null;
  webhook_secret?: string | null;
  webhook_subscription_id?: string | null;
  remote_cursor?: string | null;
  last_sync_at?: string | null;
  last_sync_state: string & Opt = 'never';
  last_sync_error?: string | null;
  failure_count: number & Opt = 0;
  next_attempt_at?: string | null;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  createdByRef?: Ref<Users> | null;
  document_sync_items_collection = new Collection<DocumentSyncItems>(this);
}

export const TripDocumentLinksSchema = defineEntity({
  class: TripDocumentLinks,
  repository: () => TripDocumentLinksRepository,
  indexes: [
    {
      name: 'idx_trip_document_links_due',
      properties: ['sync_enabled', 'next_attempt_at'],
    },
  ],
  uniques: [
    {
      name: 'idx_trip_document_links_token',
      where: 'webhook_token IS NOT NULL',
      properties: ['webhook_token'],
    },
    { properties: ['trip', 'connection', 'remote_scope_key'] },
  ],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_trip_document_links_trip'),
    trip_id: p.integer().persist(false).index('idx_trip_document_links_trip'),
    connection: () => p.manyToOne(DocumentConnections).ref().deleteRule('cascade').hidden(),
    connection_id: p.integer().persist(false),
    provider_id: p.text(),
    remote_scope_key: p.text(),
    remote_root_id: p.text().nullable(),
    remote_root_path: p.text().nullable(),
    remote_label: p.text().default(''),
    direction: p.text().default('both'),
    delete_policy: p.text().default('unlink'),
    conflict_policy: p.text().default('manual'),
    sync_enabled: p.integer().default(1),
    webhook_token: p.text().nullable(),
    webhook_secret: p.text().nullable(),
    webhook_subscription_id: p.text().nullable(),
    remote_cursor: p.text().nullable(),
    last_sync_at: p.text().nullable(),
    last_sync_state: p.text().default('never'),
    last_sync_error: p.text().nullable(),
    failure_count: p.integer().default(0),
    next_attempt_at: p.text().nullable(),
    created_by: p.integer().nullable().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').nullable().hidden(),
    document_sync_items_collection: () => p.oneToMany(DocumentSyncItems).mappedBy('link').hidden(),
  },
});
