import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyEntryStaysRepository } from '../repositories/JourneyEntryStays.repository';
import { DbTimestampType } from '../types';
import { JourneyEntries } from './JourneyEntries.entity';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyEntryStays {
  [EntityRepositoryType]?: JourneyEntryStaysRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  entry!: Ref<JourneyEntries>;
  entry_id!: number;
  source: string & Opt = 'dawarich';
  source_visit_id!: string;
  name!: string;
  lat?: number | null;
  lng?: number | null;
  started_at!: string;
  ended_at!: string;
  duration_minutes: number & Opt = 0;
  sort_order: number & Opt = 0;
  user?: Ref<Users> | null;
  user_id?: number | null;
  created_at!: string & Opt;
}

export const JourneyEntryStaysSchema = defineEntity({
  class: JourneyEntryStays,
  repository: () => JourneyEntryStaysRepository,
  uniques: [
    {
      name: 'idx_journey_entry_stays_stay',
      properties: ['journey_id', 'source', 'user_id', 'source_visit_id'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden(),
    journey_id: p.integer().persist(false),
    entry: () => p.manyToOne(JourneyEntries).ref().deleteRule('cascade').hidden().index('idx_journey_entry_stays_entry'),
    entry_id: p.integer().persist(false).index('idx_journey_entry_stays_entry'),
    source: p.text().default('dawarich'),
    source_visit_id: p.text(),
    name: p.text(),
    lat: p.double().nullable(),
    lng: p.double().nullable(),
    started_at: p.text(),
    ended_at: p.text(),
    duration_minutes: p.integer().default(0),
    sort_order: p.integer().default(0),
    user: () => p.manyToOne(Users).ref().nullable().hidden().index('idx_journey_entry_stays_user'),
    user_id: p.integer().nullable().persist(false).index('idx_journey_entry_stays_user'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
