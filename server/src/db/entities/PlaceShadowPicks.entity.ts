import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PlaceShadowPicksRepository } from '../repositories/PlaceShadowPicks.repository';

export class PlaceShadowPicks {
  [EntityRepositoryType]?: PlaceShadowPicksRepository;
  id!: number & Opt;
  created_at!: string & Opt;
  query!: string;
  lang?: string | null;
  bias_lat?: number | null;
  bias_lng?: number | null;
  source!: string;
  live_rank!: number;
  live_count!: number;
  picked_name!: string;
  picked_lat!: number;
  picked_lng!: number;
  picked_place_id?: string | null;
}

export const PlaceShadowPicksSchema = defineEntity({
  class: PlaceShadowPicks,
  repository: () => PlaceShadowPicksRepository,
  properties: {
    id: p.integer().primary(),
    created_at: p.text().defaultRaw(`(datetime('now'))`).index('idx_place_shadow_created'),
    query: p.text(),
    lang: p.text().nullable(),
    bias_lat: p.double().nullable(),
    bias_lng: p.double().nullable(),
    source: p.text(),
    live_rank: p.integer(),
    live_count: p.integer(),
    picked_name: p.text(),
    picked_lat: p.double(),
    picked_lng: p.double(),
    picked_place_id: p.text().nullable(),
  },
});
