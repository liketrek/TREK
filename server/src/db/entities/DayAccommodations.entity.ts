import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { DayAccommodationsRepository } from '../repositories/DayAccommodations.repository';
import { DbTimestampType } from '../types';
import { Days } from './Days.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';

export class DayAccommodations {
  [EntityRepositoryType]?: DayAccommodationsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  place?: Ref<Places> | null;
  place_id?: number | null;
  startDay!: Ref<Days>;
  start_day_id!: number;
  endDay!: Ref<Days>;
  end_day_id!: number;
  check_in?: string | null;
  check_in_end?: string | null;
  check_out?: string | null;
  confirmation?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

export const DayAccommodationsSchema = defineEntity({
  class: DayAccommodations,
  repository: () => DayAccommodationsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_day_accommodations_trip_id'),
    trip_id: p.integer().persist(false).index('idx_day_accommodations_trip_id'),
    place: () => p.manyToOne(Places).ref().nullable().hidden(),
    place_id: p.integer().nullable().persist(false),
    startDay: () => p.manyToOne(Days).ref().deleteRule('cascade').hidden().index('idx_day_accommodations_start_day_id'),
    start_day_id: p.integer().persist(false).index('idx_day_accommodations_start_day_id'),
    endDay: () => p.manyToOne(Days).ref().deleteRule('cascade').hidden().index('idx_day_accommodations_end_day_id'),
    end_day_id: p.integer().persist(false).index('idx_day_accommodations_end_day_id'),
    check_in: p.text().nullable(),
    check_in_end: p.text().nullable(),
    check_out: p.text().nullable(),
    confirmation: p.text().nullable(),
    notes: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
