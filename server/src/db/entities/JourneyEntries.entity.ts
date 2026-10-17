import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyEntriesRepository } from '../repositories/JourneyEntries.repository';
import { JourneyEntryPhotos } from './JourneyEntryPhotos.entity';
import { Journeys } from './Journeys.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class JourneyEntries {
  [EntityRepositoryType]?: JourneyEntriesRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  sourceTrip?: Ref<Trips> | null;
  source_trip_id?: number | null;
  sourcePlace?: Ref<Places> | null;
  source_place_id?: number | null;
  author!: Ref<Users>;
  author_id!: number;
  type!: string;
  title?: string | null;
  story?: string | null;
  entry_date!: string;
  entry_time?: string | null;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  mood?: string | null;
  weather?: string | null;
  tags?: string | null;
  visibility?: string | null = 'private';
  sort_order?: number | null = 0;
  created_at!: number;
  updated_at!: number;
  pros_cons?: string | null;
  stats_excluded: number & Opt = 0;
  dismissed: number & Opt = 0;
  country_code?: string | null;
  source_assignment_id?: number | null;
  is_draft: number & Opt = 0;
  journey_entry_photos_collection = new Collection<JourneyEntryPhotos>(this);
}

export const JourneyEntriesSchema = defineEntity({
  class: JourneyEntries,
  repository: () => JourneyEntriesRepository,
  indexes: [
    {
      name: 'idx_journey_entries_source_assignment',
      properties: ['source_place_id', 'source_assignment_id'],
    },
    {
      name: 'idx_journey_entries_order',
      properties: ['journey_id', 'entry_date', 'sort_order'],
    },
    {
      name: 'idx_journey_entries_journey',
      properties: ['journey_id', 'entry_date'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden(),
    journey_id: p.integer().persist(false),
    sourceTrip: () => p.manyToOne(Trips).ref().nullable().hidden().index('idx_journey_entries_source_trip_id'),
    source_trip_id: p.integer().nullable().persist(false).index('idx_journey_entries_source_trip_id'),
    sourcePlace: () => p.manyToOne(Places).ref().nullable().hidden().index('idx_journey_entries_source'),
    source_place_id: p.integer().nullable().persist(false).index('idx_journey_entries_source'),
    author: () => p.manyToOne(Users).ref().hidden().index('idx_journey_entries_author_id'),
    author_id: p.integer().persist(false).index('idx_journey_entries_author_id'),
    type: p.text(),
    title: p.text().nullable(),
    story: p.text().nullable(),
    entry_date: p.text(),
    entry_time: p.text().nullable(),
    location_name: p.text().nullable(),
    location_lat: p.double().nullable(),
    location_lng: p.double().nullable(),
    mood: p.text().nullable(),
    weather: p.text().nullable(),
    tags: p.text().nullable(),
    visibility: p.text().nullable(),
    sort_order: p.integer().nullable(),
    created_at: p.integer(),
    updated_at: p.integer(),
    pros_cons: p.text().nullable(),
    stats_excluded: p.integer().default(0),
    dismissed: p.integer().default(0),
    country_code: p.text().nullable(),
    source_assignment_id: p.integer().nullable(),
    is_draft: p.integer().default(0),
    journey_entry_photos_collection: () => p.oneToMany(JourneyEntryPhotos).mappedBy('entry').hidden(),
  },
});
