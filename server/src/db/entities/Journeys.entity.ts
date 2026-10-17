import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneysRepository } from '../repositories/Journeys.repository';
import { JourneyBooks } from './JourneyBooks.entity';
import { JourneyContributors } from './JourneyContributors.entity';
import { JourneyEntries } from './JourneyEntries.entity';
import { JourneyPhotos } from './JourneyPhotos.entity';
import { JourneyShareTokens } from './JourneyShareTokens.entity';
import { JourneyTrips } from './JourneyTrips.entity';
import { Users } from './Users.entity';

export class Journeys {
  [EntityRepositoryType]?: JourneysRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  title!: string;
  subtitle?: string | null;
  cover_gradient?: string | null;
  status?: string | null = 'draft';
  created_at!: number;
  updated_at!: number;
  cover_image?: string | null;
  show_trip_tracks: number & Opt = 0;
  show_verdict: number & Opt = 1;
  show_mood: number & Opt = 1;
  show_weather: number & Opt = 1;
  status_override?: string | null;
  photo_location: number & Opt = 0;
  journey_books_collection = new Collection<JourneyBooks>(this);
  journey_contributors_collection = new Collection<JourneyContributors>(this);
  journey_entries_collection = new Collection<JourneyEntries>(this);
  journey_photos_collection = new Collection<JourneyPhotos>(this);
  journey_share_tokens: Ref<JourneyShareTokens> | null = null;
  journey_trips_collection = new Collection<JourneyTrips>(this);
}

export const JourneysSchema = defineEntity({
  class: Journeys,
  repository: () => JourneysRepository,
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().hidden().index('idx_journeys_user'),
    user_id: p.integer().persist(false).index('idx_journeys_user'),
    title: p.text(),
    subtitle: p.text().nullable(),
    cover_gradient: p.text().nullable(),
    status: p.text().nullable(),
    created_at: p.integer(),
    updated_at: p.integer(),
    cover_image: p.text().nullable(),
    show_trip_tracks: p.integer().default(0),
    show_verdict: p.integer().default(1),
    show_mood: p.integer().default(1),
    show_weather: p.integer().default(1),
    status_override: p.text().nullable(),
    photo_location: p.integer().default(0),
    journey_books_collection: () => p.oneToMany(JourneyBooks).mappedBy('journey').hidden(),
    journey_contributors_collection: () => p.oneToMany(JourneyContributors).mappedBy('journey').hidden(),
    journey_entries_collection: () => p.oneToMany(JourneyEntries).mappedBy('journey').hidden(),
    journey_photos_collection: () => p.oneToMany(JourneyPhotos).mappedBy('journey').hidden(),
    journey_share_tokens: () => p.oneToOne(JourneyShareTokens).ref().mappedBy('journey').hidden(),
    journey_trips_collection: () => p.oneToMany(JourneyTrips).mappedBy('journey').hidden(),
  },
});
