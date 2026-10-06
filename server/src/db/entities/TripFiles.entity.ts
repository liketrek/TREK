import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripFilesRepository } from '../repositories/TripFiles.repository';
import { DbTimestampType } from '../types';
import { CollabMessages } from './CollabMessages.entity';
import { CollabNotes } from './CollabNotes.entity';
import { DocumentSyncItems } from './DocumentSyncItems.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripFiles {
  [EntityRepositoryType]?: TripFilesRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  place?: Ref<Places> | null;
  place_id?: number | null;
  reservation?: Ref<Reservations> | null;
  reservation_id?: number | null;
  filename!: string;
  original_name!: string;
  file_size?: number | null;
  mime_type?: string | null;
  description?: string | null;
  created_at?: string | null;
  note?: Ref<CollabNotes> | null;
  note_id?: number | null;
  uploaded_by?: number | null;
  starred?: number | null = 0;
  deleted_at?: string | null;
  message?: Ref<CollabMessages> | null;
  message_id?: number | null;
  uploadedByRef?: Ref<Users> | null;
  document_sync_items_collection = new Collection<DocumentSyncItems>(this);
  file_links_collection = new Collection<FileLinks>(this);
}

export const TripFilesSchema = defineEntity({
  class: TripFiles,
  repository: () => TripFilesRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_trip_files_trip_id'),
    trip_id: p.integer().persist(false).index('idx_trip_files_trip_id'),
    place: () => p.manyToOne(Places).ref().nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    reservation: () => p.manyToOne(Reservations).ref().nullable().hidden(),
    reservation_id: p.integer().nullable().persist(false),
    filename: p.text(),
    original_name: p.text(),
    file_size: p.integer().nullable(),
    mime_type: p.text().nullable(),
    description: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    note: () => p.manyToOne(CollabNotes).ref().nullable().hidden(),
    note_id: p.integer().nullable().persist(false),
    uploaded_by: p.integer().nullable().persist(false),
    starred: p.integer().nullable(),
    deleted_at: p.text().nullable(),
    message: () => p.manyToOne(CollabMessages).ref().deleteRule('cascade').nullable().hidden().index('idx_trip_files_message_id'),
    message_id: p.integer().nullable().persist(false).index('idx_trip_files_message_id'),
    uploadedByRef: () => p.manyToOne(Users).ref().joinColumn('uploaded_by').nullable().hidden(),
    document_sync_items_collection: () => p.oneToMany(DocumentSyncItems).mappedBy('file').hidden(),
    file_links_collection: () => p.oneToMany(FileLinks).mappedBy('file').hidden(),
  },
});
