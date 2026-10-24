import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PaddleRegionsRepository } from '../repositories/PaddleRegions.repository';
import { DbTimestampType } from '../types';
import { PaddleFeatures } from './PaddleFeatures.entity';
import { PaddleWaterGraphs } from './PaddleWaterGraphs.entity';

export class PaddleRegions {
  [EntityRepositoryType]?: PaddleRegionsRepository;
  id!: string;
  name!: string;
  boundary?: string | null;
  min_lat?: number | null;
  min_lng?: number | null;
  max_lat?: number | null;
  max_lng?: number | null;
  status: TPaddleRegionsStatus & Opt = PaddleRegionsStatus.QUEUED;
  source_timestamp?: string | null;
  imported_at?: string | null;
  feature_count: number & Opt = 0;
  error?: string | null;
  created_at?: string | null;
  origin: TPaddleRegionsOrigin & Opt = PaddleRegionsOrigin.ADMIN;
  paddle_features_collection = new Collection<PaddleFeatures>(this);
  paddle_water_graphs: Ref<PaddleWaterGraphs> | null = null;
}

export const PaddleRegionsStatus = {
  QUEUED: 'queued',
  IMPORTING: 'importing',
  READY: 'ready',
  FAILED: 'failed',
} as const;

export type TPaddleRegionsStatus = (typeof PaddleRegionsStatus)[keyof typeof PaddleRegionsStatus];

export const PaddleRegionsOrigin = {
  ADMIN: 'admin',
  AUTO: 'auto',
} as const;

export type TPaddleRegionsOrigin = (typeof PaddleRegionsOrigin)[keyof typeof PaddleRegionsOrigin];

export const PaddleRegionsSchema = defineEntity({
  class: PaddleRegions,
  repository: () => PaddleRegionsRepository,
  properties: {
    id: p.text().primary(),
    name: p.text(),
    boundary: p.text().nullable(),
    min_lat: p.double().nullable(),
    min_lng: p.double().nullable(),
    max_lat: p.double().nullable(),
    max_lng: p.double().nullable(),
    status: p.enum(() => PaddleRegionsStatus).default('queued'),
    source_timestamp: p.text().nullable(),
    imported_at: p.type(DbTimestampType).nullable(),
    feature_count: p.integer().default(0),
    error: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    origin: p.enum(() => PaddleRegionsOrigin).default('admin'),
    paddle_features_collection: () => p.oneToMany(PaddleFeatures).mappedBy('region').hidden(),
    paddle_water_graphs: () => p.oneToOne(PaddleWaterGraphs).ref().mappedBy('region').hidden(),
  },
});
