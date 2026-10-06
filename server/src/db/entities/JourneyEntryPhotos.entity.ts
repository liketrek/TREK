import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyEntryPhotosRepository } from '../repositories/JourneyEntryPhotos.repository';
import { JourneyEntries } from './JourneyEntries.entity';
import { JourneyPhotos } from './JourneyPhotos.entity';

export class JourneyEntryPhotos {
  [EntityRepositoryType]?: JourneyEntryPhotosRepository;
  [PrimaryKeyProp]?: ['entry', 'journeyPhoto'];
  entry!: Ref<JourneyEntries>;
  entry_id!: number;
  journeyPhoto!: Ref<JourneyPhotos>;
  journey_photo_id!: number;
  sort_order?: number | null = 0;
  created_at!: number;
}

export const JourneyEntryPhotosSchema = defineEntity({
  class: JourneyEntryPhotos,
  repository: () => JourneyEntryPhotosRepository,
  uniques: [{ properties: ['entry', 'journeyPhoto'] }],
  properties: {
    entry: () => p.manyToOne(JourneyEntries).primary().ref().hidden().index('idx_journey_entry_photos_entry'),
    entry_id: p.integer().persist(false).index('idx_journey_entry_photos_entry'),
    journeyPhoto: () => p.manyToOne(JourneyPhotos).primary().ref().hidden().index('idx_journey_entry_photos_photo'),
    journey_photo_id: p.integer().persist(false).index('idx_journey_entry_photos_photo'),
    sort_order: p.integer().nullable(),
    created_at: p.integer(),
  },
});
