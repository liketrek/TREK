import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { JourneyEntryPhotos } from './JourneyEntryPhotos.entity';
import { Journeys } from './Journeys.entity';
import { TrekPhotos } from './TrekPhotos.entity';

export class JourneyPhotos {
  id?: number | null;
  journey!: Ref<Journeys>;
  photo!: Ref<TrekPhotos>;
  caption?: string | null;
  shared?: number | null = 0;
  sortOrder?: number | null = 0;
  provider?: string | null;
  assetId?: string | null;
  ownerId?: number | null;
  createdAt!: number;
  journeyEntryPhotosCollection = new Collection<JourneyEntryPhotos>(this);
}

export class JourneyPhotosRepository extends EntityRepository<JourneyPhotos> {}

export const JourneyPhotosSchema = defineEntity({
  class: JourneyPhotos,
  repository: () => JourneyPhotosRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').index('idx_journey_photos_journey'),
    photo: () => p.manyToOne(TrekPhotos).ref().deleteRule('cascade'),
    caption: p.text().nullable(),
    shared: p.integer().nullable(),
    sortOrder: p.integer().nullable(),
    provider: p.text().nullable(),
    assetId: p.text().nullable(),
    ownerId: p.integer().nullable(),
    createdAt: p.integer(),
    journeyEntryPhotosCollection: () => p.oneToMany(JourneyEntryPhotos).mappedBy('journeyPhoto'),
  },
});
