import { EntityRepositoryType, type Opt, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { PaddleRegionRequestsRepository } from '../repositories/PaddleRegionRequests.repository';
import { DbTimestampType } from '../types';

export class PaddleRegionRequests {
  [EntityRepositoryType]?: PaddleRegionRequestsRepository;
  [PrimaryKeyProp]?: 'region_id';
  region_id!: string;
  name!: string;
  reason!: TPaddleRegionRequestsReason;
  bytes?: number | null;
  requested_by?: string | null;
  requested_at!: string & Opt;
  declined_at?: string | null;
}

export const PaddleRegionRequestsReason = {
  ASK: 'ask',
  TOO_LARGE: 'too_large',
  LIMIT: 'limit',
} as const;

export type TPaddleRegionRequestsReason = (typeof PaddleRegionRequestsReason)[keyof typeof PaddleRegionRequestsReason];

export const PaddleRegionRequestsSchema = defineEntity({
  class: PaddleRegionRequests,
  repository: () => PaddleRegionRequestsRepository,
  properties: {
    region_id: p.text().primary(),
    name: p.text(),
    reason: p.enum(() => PaddleRegionRequestsReason),
    bytes: p.integer().nullable(),
    requested_by: p.text().nullable(),
    requested_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    declined_at: p.type(DbTimestampType).nullable(),
  },
});
