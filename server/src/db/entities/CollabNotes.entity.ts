import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabNotes {
  id?: number | null;
  trip!: Ref<Trips>;
  user!: Ref<Users>;
  category?: string | null = 'General';
  title!: string;
  content?: string | null;
  color?: string | null = '#6366f1';
  pinned?: number | null = 0;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  website?: string | null;
  tripFilesCollection = new Collection<TripFiles>(this);
}

export class CollabNotesRepository extends EntityRepository<CollabNotes> {}

export const CollabNotesSchema = defineEntity({
  class: CollabNotes,
  repository: () => CollabNotesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_collab_notes_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    category: p.text().nullable(),
    title: p.text(),
    content: p.text().nullable(),
    color: p.text().nullable(),
    pinned: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    updatedAt: p.datetime().nullable().onCreate(() => new Date()),
    website: p.text().nullable(),
    tripFilesCollection: () => p.oneToMany(TripFiles).mappedBy('note'),
  },
});
