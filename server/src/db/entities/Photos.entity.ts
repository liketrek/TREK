import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Days } from './Days.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';

export class Photos {
  id?: number | null;
  trip!: Ref<Trips>;
  day?: Ref<Days> | null;
  place?: Ref<Places> | null;
  filename!: string;
  originalName!: string;
  fileSize?: number | null;
  mimeType?: string | null;
  caption?: string | null;
  takenAt?: string | null;
  createdAt?: Date | null;
}

export class PhotosRepository extends EntityRepository<Photos> {}

export const PhotosSchema = defineEntity({
  class: Photos,
  repository: () => PhotosRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_photos_trip_id'),
    day: () => p.manyToOne(Days).ref().nullable().index('idx_photos_day_id'),
    place: () => p.manyToOne(Places).ref().nullable().index('idx_photos_place_id'),
    filename: p.text(),
    originalName: p.text(),
    fileSize: p.integer().nullable(),
    mimeType: p.text().nullable(),
    caption: p.text().nullable(),
    takenAt: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
