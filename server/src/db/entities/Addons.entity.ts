import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export interface AddonConfig {
  [key: string]: unknown;
}

export class Addons {
  id?: string | null;
  name!: string;
  description?: string | null;
  type: string & Opt = 'global';
  icon: string & Opt = 'Puzzle';
  enabled?: boolean & Opt = false;
  config: AddonConfig & Opt | null = {};
  sortOrder?: number | null = 0;
}

export class AddonsRepository extends EntityRepository<Addons>{}

export const AddonsSchema = defineEntity({
  class: Addons,
  repository: () => AddonsRepository,
  properties: {
    id: p.text().primary(),
    name: p.text(),
    description: p.text().nullable(),
    type: p.text(),
    icon: p.text().nullable(),
    enabled: p.boolean().default(false),
    config: p.json<AddonConfig>().nullable(),
    sortOrder: p.integer().nullable(),
  },
});
