import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { JourneyEntries } from './JourneyEntries.entity';
import { JourneyPhotos } from './JourneyPhotos.entity';

export class JourneyEntryPhotos {
  [PrimaryKeyProp]?: ['entry', 'journeyPhoto'];
  entry!: Ref<JourneyEntries>;
  journeyPhoto!: Ref<JourneyPhotos>;
  sortOrder?: number | null = 0;
  createdAt!: number;
}

export class JourneyEntryPhotosRepository extends EntityRepository<JourneyEntryPhotos> {}

export const JourneyEntryPhotosSchema = defineEntity({
  class: JourneyEntryPhotos,
  repository: () => JourneyEntryPhotosRepository,
  properties: {
    entry: () => p.manyToOne(JourneyEntries).primary().ref().index('idx_journey_entry_photos_entry'),
    journeyPhoto: () => p.manyToOne(JourneyPhotos).primary().ref().index('idx_journey_entry_photos_photo'),
    sortOrder: p.integer().nullable(),
    createdAt: p.integer(),
  },
});
