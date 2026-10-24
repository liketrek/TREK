import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyRecordedDaysRepository } from '../repositories/JourneyRecordedDays.repository';
import { DbTimestampType } from '../types';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyRecordedDays {
  [EntityRepositoryType]?: JourneyRecordedDaysRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  local_date!: string;
  source: string & Opt = 'dawarich';
  source_kind!: string;
  utc_offset_minutes!: number;
  window_from!: string;
  window_to!: string;
  segments!: string;
  point_count!: number;
  distance_m?: number | null;
  content_hash!: string;
  truncated: number & Opt = 0;
  fetched_at!: string;
  imported_by?: number | null;
  created_at!: string & Opt;
  updated_at!: string & Opt;
  importedByRef?: Ref<Users> | null;
}

export const JourneyRecordedDaysSchema = defineEntity({
  class: JourneyRecordedDays,
  repository: () => JourneyRecordedDaysRepository,
  uniques: [
    {
      name: 'idx_journey_recorded_days_day',
      properties: ['journey_id', 'local_date', 'source'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden(),
    journey_id: p.integer().persist(false),
    local_date: p.text(),
    source: p.text().default('dawarich'),
    source_kind: p.text(),
    utc_offset_minutes: p.integer(),
    window_from: p.text(),
    window_to: p.text(),
    segments: p.text(),
    point_count: p.integer(),
    distance_m: p.double().nullable(),
    content_hash: p.text(),
    truncated: p.integer().default(0),
    fetched_at: p.text(),
    imported_by: p.integer().nullable().persist(false).index('idx_journey_recorded_days_imported_by'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    importedByRef: () => p.manyToOne(Users).ref().joinColumn('imported_by').nullable().hidden().index('idx_journey_recorded_days_imported_by'),
  },
});
