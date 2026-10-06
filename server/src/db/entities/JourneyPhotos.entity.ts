import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyPhotosRepository } from '../repositories/JourneyPhotos.repository';
import { JourneyEntryPhotos } from './JourneyEntryPhotos.entity';
import { Journeys } from './Journeys.entity';
import { TrekPhotos } from './TrekPhotos.entity';

export class JourneyPhotos {
  [EntityRepositoryType]?: JourneyPhotosRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  photo!: Ref<TrekPhotos>;
  photo_id!: number;
  caption?: string | null;
  shared?: number | null = 0;
  sort_order?: number | null = 0;
  provider?: string | null;
  asset_id?: string | null;
  owner_id?: number | null;
  created_at!: number;
  journey_entry_photos_collection = new Collection<JourneyEntryPhotos>(this);
}

export const JourneyPhotosSchema = defineEntity({
  class: JourneyPhotos,
  repository: () => JourneyPhotosRepository,
  uniques: [{ properties: ['journey', 'photo'] }],
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden().index('idx_journey_photos_journey'),
    journey_id: p.integer().persist(false).index('idx_journey_photos_journey'),
    photo: () => p.manyToOne(TrekPhotos).ref().deleteRule('cascade').hidden(),
    photo_id: p.integer().persist(false),
    caption: p.text().nullable(),
    shared: p.integer().nullable(),
    sort_order: p.integer().nullable(),
    provider: p.text().nullable(),
    asset_id: p.text().nullable(),
    owner_id: p.integer().nullable(),
    created_at: p.integer(),
    journey_entry_photos_collection: () => p.oneToMany(JourneyEntryPhotos).mappedBy('journeyPhoto').hidden(),
  },
});
