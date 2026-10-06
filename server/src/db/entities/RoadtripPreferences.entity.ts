import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { RoadtripPreferencesRepository } from '../repositories/RoadtripPreferences.repository';
import { Trips } from './Trips.entity';

export class RoadtripPreferences {
  [EntityRepositoryType]?: RoadtripPreferencesRepository;
  [PrimaryKeyProp]?: ['trip', 'key'];
  trip!: Ref<Trips>;
  trip_id!: number;
  key!: string;
  value!: string;
}

export const RoadtripPreferencesSchema = defineEntity({
  class: RoadtripPreferences,
  repository: () => RoadtripPreferencesRepository,
  uniques: [{ properties: ['trip', 'key'] }],
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    key: p.text().primary(),
    value: p.text(),
  },
});
