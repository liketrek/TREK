import { type Opt, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class PlaceShadowPicks {
  id?: number | null;
  createdAt!: string & Opt;
  query!: string;
  lang?: string | null;
  biasLat?: unknown | null;
  biasLng?: unknown | null;
  source!: string;
  liveRank!: number;
  liveCount!: number;
  pickedName!: string;
  pickedLat!: unknown;
  pickedLng!: unknown;
  pickedPlaceId?: string | null;
}

export class PlaceShadowPicksRepository extends EntityRepository<PlaceShadowPicks> {}

export const PlaceShadowPicksSchema = defineEntity({
  class: PlaceShadowPicks,
  repository: () => PlaceShadowPicksRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    createdAt: p.text().defaultRaw(`(datetime('now'))`).index('idx_place_shadow_created'),
    query: p.text(),
    lang: p.text().nullable(),
    biasLat: p.double().nullable(),
    biasLng: p.double().nullable(),
    source: p.text(),
    liveRank: p.integer(),
    liveCount: p.integer(),
    pickedName: p.text(),
    pickedLat: p.double(),
    pickedLng: p.double(),
    pickedPlaceId: p.text().nullable(),
  },
});
