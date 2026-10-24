import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PaddleFeaturesRepository } from '../repositories/PaddleFeatures.repository';
import { PaddleRegions } from './PaddleRegions.entity';

export class PaddleFeatures {
  [EntityRepositoryType]?: PaddleFeaturesRepository;
  id!: number & Opt;
  region!: Ref<PaddleRegions>;
  region_id!: string;
  osm_ref!: string;
  kind!: string;
  group_key?: string | null;
  name?: string | null;
  geometry!: string;
  tags!: string;
  tag_hash!: string;
  min_lat!: number;
  min_lng!: number;
  max_lat!: number;
  max_lng!: number;
}

export const PaddleFeaturesSchema = defineEntity({
  class: PaddleFeatures,
  repository: () => PaddleFeaturesRepository,
  indexes: [
    {
      name: 'idx_paddle_features_box',
      properties: ['min_lat', 'max_lat', 'min_lng', 'max_lng'],
    },
  ],
  uniques: [
    {
      name: 'idx_paddle_features_region_ref',
      properties: ['region_id', 'osm_ref'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    region: () => p.manyToOne(PaddleRegions).ref().deleteRule('cascade').hidden(),
    region_id: p.text().persist(false),
    osm_ref: p.text(),
    kind: p.text(),
    group_key: p.text().nullable(),
    name: p.text().nullable(),
    geometry: p.text(),
    tags: p.text(),
    tag_hash: p.text(),
    min_lat: p.double(),
    min_lng: p.double(),
    max_lat: p.double(),
    max_lng: p.double(),
  },
});
