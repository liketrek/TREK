import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TripAddonOverridesRepository } from '../repositories/TripAddonOverrides.repository';
import { DbTimestampType } from '../types';
import { Addons } from './Addons.entity';
import { Trips } from './Trips.entity';

export class TripAddonOverrides {
  [EntityRepositoryType]?: TripAddonOverridesRepository;
  [PrimaryKeyProp]?: ['trip', 'addon'];
  trip!: Ref<Trips>;
  trip_id!: number;
  addon!: Ref<Addons>;
  addon_id!: string;
  enabled!: number;
  updated_at?: string | null;
}

export const TripAddonOverridesSchema = defineEntity({
  class: TripAddonOverrides,
  repository: () => TripAddonOverridesRepository,
  uniques: [{ properties: ['trip', 'addon'] }],
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().hidden(),
    trip_id: p.integer().persist(false),
    addon: () => p.manyToOne(Addons).primary().ref().hidden().index('idx_trip_addon_overrides_addon_id'),
    addon_id: p.text().persist(false).index('idx_trip_addon_overrides_addon_id'),
    enabled: p.integer(),
    updated_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
