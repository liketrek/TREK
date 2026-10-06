import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyTripsRepository } from '../repositories/JourneyTrips.repository';
import { Journeys } from './Journeys.entity';
import { Trips } from './Trips.entity';

export class JourneyTrips {
  [EntityRepositoryType]?: JourneyTripsRepository;
  [PrimaryKeyProp]?: ['journey', 'trip'];
  journey!: Ref<Journeys>;
  journey_id!: number;
  trip!: Ref<Trips>;
  trip_id!: number;
  added_at!: number;
}

export const JourneyTripsSchema = defineEntity({
  class: JourneyTrips,
  repository: () => JourneyTripsRepository,
  uniques: [{ properties: ['journey', 'trip'] }],
  properties: {
    journey: () => p.manyToOne(Journeys).primary().ref().hidden().index('idx_journey_trips_journey'),
    journey_id: p.integer().persist(false).index('idx_journey_trips_journey'),
    trip: () => p.manyToOne(Trips).primary().ref().hidden(),
    trip_id: p.integer().persist(false),
    added_at: p.integer(),
  },
});
