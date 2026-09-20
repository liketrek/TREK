import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { JourneyBooks } from './JourneyBooks.entity';
import { JourneyContributors } from './JourneyContributors.entity';
import { JourneyEntries } from './JourneyEntries.entity';
import { JourneyPhotos } from './JourneyPhotos.entity';
import { JourneyShareTokens } from './JourneyShareTokens.entity';
import { JourneyTrips } from './JourneyTrips.entity';
import { Users } from './Users.entity';

export class Journeys {
  id?: number | null;
  user!: Ref<Users>;
  title!: string;
  subtitle?: string | null;
  coverGradient?: string | null;
  status?: string | null = 'draft';
  createdAt!: number;
  updatedAt!: number;
  coverImage?: string | null;
  showTripTracks: number & Opt = 0;
  showVerdict: number & Opt = 1;
  showMood: number & Opt = 1;
  showWeather: number & Opt = 1;
  journeyBooksCollection = new Collection<JourneyBooks>(this);
  journeyContributorsCollection = new Collection<JourneyContributors>(this);
  journeyEntriesCollection = new Collection<JourneyEntries>(this);
  journeyPhotosCollection = new Collection<JourneyPhotos>(this);
  journeyShareTokens: Ref<JourneyShareTokens> | null = null;
  journeyTripsCollection = new Collection<JourneyTrips>(this);
}

export class JourneysRepository extends EntityRepository<Journeys> {}

export const JourneysSchema = defineEntity({
  class: Journeys,
  repository: () => JourneysRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().index('idx_journeys_user'),
    title: p.text(),
    subtitle: p.text().nullable(),
    coverGradient: p.text().nullable(),
    status: p.text().nullable(),
    createdAt: p.integer(),
    updatedAt: p.integer(),
    coverImage: p.text().nullable(),
    showTripTracks: p.integer(),
    showVerdict: p.integer(),
    showMood: p.integer(),
    showWeather: p.integer(),
    journeyBooksCollection: () => p.oneToMany(JourneyBooks).mappedBy('journey'),
    journeyContributorsCollection: () => p.oneToMany(JourneyContributors).mappedBy('journey'),
    journeyEntriesCollection: () => p.oneToMany(JourneyEntries).mappedBy('journey'),
    journeyPhotosCollection: () => p.oneToMany(JourneyPhotos).mappedBy('journey'),
    journeyShareTokens: () => p.oneToOne(JourneyShareTokens).ref().mappedBy('journey'),
    journeyTripsCollection: () => p.oneToMany(JourneyTrips).mappedBy('journey'),
  },
});
