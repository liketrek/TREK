import { PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';

export class RoadtripPreferences {
  [PrimaryKeyProp]?: ['trip', 'key'];
  trip!: Ref<Trips>;
  key!: string;
  value!: string;
}

export class RoadtripPreferencesRepository extends EntityRepository<RoadtripPreferences> {}

export const RoadtripPreferencesSchema = defineEntity({
  class: RoadtripPreferences,
  repository: () => RoadtripPreferencesRepository,
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().deleteRule('cascade'),
    key: p.text().primary(),
    value: p.text(),
  },
});
