import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { JourneyEntryPhotos } from './JourneyEntryPhotos.entity';
import { Journeys } from './Journeys.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class JourneyEntries {
  id?: number | null;
  journey!: Ref<Journeys>;
  sourceTrip?: Ref<Trips> | null;
  sourcePlace?: Ref<Places> | null;
  author!: Ref<Users>;
  type!: string;
  title?: string | null;
  story?: string | null;
  entryDate!: string;
  entryTime?: string | null;
  locationName?: string | null;
  locationLat?: unknown | null;
  locationLng?: unknown | null;
  mood?: string | null;
  weather?: string | null;
  tags?: string | null;
  visibility?: string | null = 'private';
  sortOrder?: number | null = 0;
  createdAt!: number;
  updatedAt!: number;
  prosCons?: string | null;
  statsExcluded: number & Opt = 0;
  dismissed: number & Opt = 0;
  countryCode?: string | null;
  sourceAssignmentId?: number | null;
  journeyEntryPhotosCollection = new Collection<JourneyEntryPhotos>(this);
}

export class JourneyEntriesRepository extends EntityRepository<JourneyEntries> {}

export const JourneyEntriesSchema = defineEntity({
  class: JourneyEntries,
  repository: () => JourneyEntriesRepository,
  indexes: [
    {
      name: 'idx_journey_entries_source_assignment',
      properties: ['sourcePlace', 'sourceAssignmentId'],
    },
    {
      name: 'idx_journey_entries_order',
      properties: ['journey', 'entryDate', 'sortOrder'],
    },
    { name: 'idx_journey_entries_journey', properties: ['journey', 'entryDate'] },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade'),
    sourceTrip: () => p.manyToOne(Trips).ref().nullable(),
    sourcePlace: () => p.manyToOne(Places).ref().nullable().index('idx_journey_entries_source'),
    author: () => p.manyToOne(Users).ref(),
    type: p.text(),
    title: p.text().nullable(),
    story: p.text().nullable(),
    entryDate: p.text(),
    entryTime: p.text().nullable(),
    locationName: p.text().nullable(),
    locationLat: p.double().nullable(),
    locationLng: p.double().nullable(),
    mood: p.text().nullable(),
    weather: p.text().nullable(),
    tags: p.text().nullable(),
    visibility: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    createdAt: p.integer(),
    updatedAt: p.integer(),
    prosCons: p.text().nullable(),
    statsExcluded: p.integer(),
    dismissed: p.integer(),
    countryCode: p.text().nullable(),
    sourceAssignmentId: p.integer().nullable(),
    journeyEntryPhotosCollection: () => p.oneToMany(JourneyEntryPhotos).mappedBy('entry'),
  },
});
