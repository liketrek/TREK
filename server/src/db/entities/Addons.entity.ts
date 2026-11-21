import { Collection, EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { AddonsRepository } from '../repositories/Addons.repository';
import { IntegerFlagType } from '../types';
import { TripAddonOverrides } from './TripAddonOverrides.entity';

export interface AddonConfig {
  [key: string]: unknown;
}

export class Addons {
  [EntityRepositoryType]?: AddonsRepository;
  id?: string | null;
  name!: string;
  description?: string | null;
  type: string & Opt = 'global';
  icon?: string | null = 'Puzzle';
  enabled?: boolean | null;
  config?: AddonConfig | null;
  sort_order?: number | null = 0;
  trip_addon_overrides_collection = new Collection<TripAddonOverrides>(this);
}

export const AddonsSchema = defineEntity({
  class: Addons,
  repository: () => AddonsRepository,
  properties: {
    id: p.text().primary().nullable(),
    name: p.text(),
    description: p.text().nullable(),
    type: p.text().default('global'),
    icon: p.text().nullable(),
    enabled: p.type(IntegerFlagType).nullable().default(false),
    config: p.json<AddonConfig>().nullable().default('{}'),
    sort_order: p.integer().nullable(),
    trip_addon_overrides_collection: () => p.oneToMany(TripAddonOverrides).mappedBy('addon').hidden(),
  },
});
