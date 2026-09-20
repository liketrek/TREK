import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { CollabMessages } from './CollabMessages.entity';
import { CollabNotes } from './CollabNotes.entity';
import { FileLinks } from './FileLinks.entity';
import { Places } from './Places.entity';
import { Reservations } from './Reservations.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TripFiles {
  id?: number | null;
  trip!: Ref<Trips>;
  place?: Ref<Places> | null;
  reservation?: Ref<Reservations> | null;
  filename!: string;
  originalName!: string;
  fileSize?: number | null;
  mimeType?: string | null;
  description?: string | null;
  createdAt?: Date | null;
  note?: Ref<CollabNotes> | null;
  uploadedBy?: Ref<Users> | null;
  starred?: number | null = 0;
  deletedAt?: string | null;
  message?: Ref<CollabMessages> | null;
  fileLinksCollection = new Collection<FileLinks>(this);
}

export class TripFilesRepository extends EntityRepository<TripFiles> {}

export const TripFilesSchema = defineEntity({
  class: TripFiles,
  repository: () => TripFilesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_trip_files_trip_id'),
    place: () => p.manyToOne(Places).ref().nullable(),
    reservation: () => p.manyToOne(Reservations).ref().nullable(),
    filename: p.text(),
    originalName: p.text(),
    fileSize: p.integer().nullable(),
    mimeType: p.text().nullable(),
    description: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    note: () => p.manyToOne(CollabNotes).ref().nullable(),
    uploadedBy: () => p.manyToOne(Users).ref().name('uploaded_by').nullable(),
    starred: p.integer().nullable(),
    deletedAt: p.text().nullable(),
    message: () => p.manyToOne(CollabMessages).ref().deleteRule('cascade').nullable().index('idx_trip_files_message_id'),
    fileLinksCollection: () => p.oneToMany(FileLinks).mappedBy('file'),
  },
});
