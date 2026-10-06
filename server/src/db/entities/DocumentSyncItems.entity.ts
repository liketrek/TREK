import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DocumentSyncItemsRepository } from '../repositories/DocumentSyncItems.repository';
import { TripDocumentLinks } from './TripDocumentLinks.entity';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';

export class DocumentSyncItems {
  [EntityRepositoryType]?: DocumentSyncItemsRepository;
  id!: number & Opt;
  link!: Ref<TripDocumentLinks>;
  link_id!: number;
  trip!: Ref<Trips>;
  trip_id!: number;
  file?: Ref<TripFiles> | null;
  file_id?: number | null;
  trek_doc_uid!: string;
  remote_id?: string | null;
  remote_name?: string | null;
  remote_version?: string | null;
  remote_size?: number | null;
  remote_modified_at?: string | null;
  content_sha256?: string | null;
  pushed_sha256?: string | null;
  state: string & Opt = 'pending';
  error_code?: string | null;
  attempts: number & Opt = 0;
  next_attempt_at?: string | null;
  remote_missing_at?: string | null;
  first_seen_at!: string & Opt;
  last_seen_at!: string & Opt;
  synced_at?: string | null;
  remote_trashed_at?: string | null;
}

export const DocumentSyncItemsSchema = defineEntity({
  class: DocumentSyncItems,
  repository: () => DocumentSyncItemsRepository,
  indexes: [
    {
      name: 'idx_document_sync_items_due',
      properties: ['link_id', 'next_attempt_at'],
    },
    {
      name: 'idx_document_sync_items_hash',
      properties: ['link_id', 'content_sha256'],
    },
    {
      name: 'idx_document_sync_items_trip_state',
      properties: ['trip_id', 'state'],
    },
  ],
  uniques: [
    {
      name: 'idx_document_sync_items_uid',
      properties: ['link_id', 'trek_doc_uid'],
    },
    {
      name: 'idx_document_sync_items_file',
      where: 'file_id IS NOT NULL',
      properties: ['link_id', 'file_id'],
    },
    {
      name: 'idx_document_sync_items_remote',
      where: 'remote_id IS NOT NULL',
      properties: ['link_id', 'remote_id'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    link: () => p.manyToOne(TripDocumentLinks).ref().deleteRule('cascade').hidden(),
    link_id: p.integer().persist(false),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    file: () => p.manyToOne(TripFiles).ref().nullable().hidden(),
    file_id: p.integer().nullable().persist(false),
    trek_doc_uid: p.text(),
    remote_id: p.text().nullable(),
    remote_name: p.text().nullable(),
    remote_version: p.text().nullable(),
    remote_size: p.integer().nullable(),
    remote_modified_at: p.text().nullable(),
    content_sha256: p.text().nullable(),
    pushed_sha256: p.text().nullable(),
    state: p.text().default('pending'),
    error_code: p.text().nullable(),
    attempts: p.integer().default(0),
    next_attempt_at: p.text().nullable(),
    remote_missing_at: p.text().nullable(),
    first_seen_at: p.text().defaultRaw(`CURRENT_TIMESTAMP`),
    last_seen_at: p.text().defaultRaw(`CURRENT_TIMESTAMP`),
    synced_at: p.text().nullable(),
    remote_trashed_at: p.text().nullable(),
  },
});
