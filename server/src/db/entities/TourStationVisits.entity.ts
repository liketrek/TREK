import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TourStationVisitsRepository } from '../repositories/TourStationVisits.repository';
import { DbTimestampType } from '../types';
import { DayAssignments } from './DayAssignments.entity';

export class TourStationVisits {
  [EntityRepositoryType]?: TourStationVisitsRepository;
  [PrimaryKeyProp]?: ['assignment', 'station_key'];
  assignment!: Ref<DayAssignments>;
  assignment_id!: number;
  station_key!: string;
  status!: TTourStationVisitsStatus;
  updated_at!: string & Opt;
}

export const TourStationVisitsStatus = {
  VISITED: 'visited',
  SKIPPED: 'skipped',
} as const;

export type TTourStationVisitsStatus = (typeof TourStationVisitsStatus)[keyof typeof TourStationVisitsStatus];

export const TourStationVisitsSchema = defineEntity({
  class: TourStationVisits,
  repository: () => TourStationVisitsRepository,
  uniques: [{ properties: ['assignment', 'station_key'] }],
  properties: {
    assignment: () => p.manyToOne(DayAssignments).primary().ref().deleteRule('cascade').hidden(),
    assignment_id: p.integer().persist(false),
    station_key: p.text().primary(),
    status: p.enum(() => TourStationVisitsStatus),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
