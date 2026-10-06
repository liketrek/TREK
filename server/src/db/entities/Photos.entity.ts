import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PhotosRepository } from '../repositories/Photos.repository';
import { DbTimestampType } from '../types';
import { Days } from './Days.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';

export class Photos {
  [EntityRepositoryType]?: PhotosRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  day?: Ref<Days> | null;
  day_id?: number | null;
  place?: Ref<Places> | null;
  place_id?: number | null;
  filename!: string;
  original_name!: string;
  file_size?: number | null;
  mime_type?: string | null;
  caption?: string | null;
  taken_at?: string | null;
  created_at?: string | null;
}

export const PhotosSchema = defineEntity({
  class: Photos,
  repository: () => PhotosRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_photos_trip_id'),
    trip_id: p.integer().persist(false).index('idx_photos_trip_id'),
    day: () => p.manyToOne(Days).ref().nullable().hidden().index('idx_photos_day_id'),
    day_id: p.integer().nullable().persist(false).index('idx_photos_day_id'),
    place: () => p.manyToOne(Places).ref().nullable().hidden().index('idx_photos_place_id'),
    place_id: p.integer().nullable().persist(false).index('idx_photos_place_id'),
    filename: p.text(),
    original_name: p.text(),
    file_size: p.integer().nullable(),
    mime_type: p.text().nullable(),
    caption: p.text().nullable(),
    taken_at: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
