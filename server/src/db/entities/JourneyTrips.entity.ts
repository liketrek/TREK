import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Journeys } from './Journeys.entity';
import { Trips } from './Trips.entity';

export class JourneyTrips {
  [PrimaryKeyProp]?: ['journey', 'trip'];
  journey!: Ref<Journeys>;
  trip!: Ref<Trips>;
  addedAt!: number;
}

export class JourneyTripsRepository extends EntityRepository<JourneyTrips> {}

export const JourneyTripsSchema = defineEntity({
  class: JourneyTrips,
  repository: () => JourneyTripsRepository,
  properties: {
    journey: () => p.manyToOne(Journeys).primary().ref().index('idx_journey_trips_journey'),
    trip: () => p.manyToOne(Trips).primary().ref(),
    addedAt: p.integer(),
  },
});
