import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { AddonsRepository } from '../repositories/Addons.repository';

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
  enabled?: boolean | null = false;
  config?: AddonConfig | null;
  sort_order?: number | null = 0;
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
    enabled: p.boolean().nullable(),
    config: p.json<AddonConfig>().nullable().default('{}'),
    sort_order: p.integer().nullable(),
  },
});
