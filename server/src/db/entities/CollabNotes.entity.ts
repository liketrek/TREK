import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { CollabNotesRepository } from '../repositories/CollabNotes.repository';
import { DbTimestampType } from '../types';
import { TripFiles } from './TripFiles.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class CollabNotes {
  [EntityRepositoryType]?: CollabNotesRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  category?: string | null = 'General';
  title!: string;
  content?: string | null;
  color?: string | null = '#6366f1';
  pinned?: number | null = 0;
  created_at?: string | null;
  updated_at?: string | null;
  website?: string | null;
  trip_files_collection = new Collection<TripFiles>(this);
}

export const CollabNotesSchema = defineEntity({
  class: CollabNotes,
  repository: () => CollabNotesRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_collab_notes_trip'),
    trip_id: p.integer().persist(false).index('idx_collab_notes_trip'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    category: p.text().nullable(),
    title: p.text(),
    content: p.text().nullable(),
    color: p.text().nullable(),
    pinned: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    website: p.text().nullable(),
    trip_files_collection: () => p.oneToMany(TripFiles).mappedBy('note').hidden(),
  },
});
