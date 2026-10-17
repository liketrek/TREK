import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PaddleWaterGraphsRepository } from '../repositories/PaddleWaterGraphs.repository';
import { DbTimestampType } from '../types';
import { PaddleRegions } from './PaddleRegions.entity';

export class PaddleWaterGraphs {
  [EntityRepositoryType]?: PaddleWaterGraphsRepository;
  [PrimaryKeyProp]?: 'region';
  region?: Ref<PaddleRegions> | null;
  region_id?: string | null;
  file!: string;
  rev!: string;
  bytes!: number;
  built_at!: string;
  stats!: string;
  min_lat!: number;
  min_lng!: number;
  max_lat!: number;
  max_lng!: number;
}

export const PaddleWaterGraphsSchema = defineEntity({
  class: PaddleWaterGraphs,
  repository: () => PaddleWaterGraphsRepository,
  indexes: [
    {
      name: 'idx_paddle_water_graphs_box',
      properties: ['min_lat', 'max_lat', 'min_lng', 'max_lng'],
    },
  ],
  uniques: [{ properties: ['region'] }],
  properties: {
    region: () => p.oneToOne(PaddleRegions).primary().ref().deleteRule('cascade').nullable().hidden(),
    region_id: p.text().nullable().persist(false),
    file: p.text(),
    rev: p.text(),
    bytes: p.integer(),
    built_at: p.type(DbTimestampType),
    stats: p.text(),
    min_lat: p.double(),
    min_lng: p.double(),
    max_lat: p.double(),
    max_lng: p.double(),
  },
});
