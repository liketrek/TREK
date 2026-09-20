import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Days } from './Days.entity';
import { Places } from './Places.entity';
import { Trips } from './Trips.entity';

export class DayAccommodations {
  id?: number | null;
  trip!: Ref<Trips>;
  place?: Ref<Places> | null;
  startDay!: Ref<Days>;
  endDay!: Ref<Days>;
  checkIn?: string | null;
  checkInEnd?: string | null;
  checkOut?: string | null;
  confirmation?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
}

export class DayAccommodationsRepository extends EntityRepository<DayAccommodations> {}

export const DayAccommodationsSchema = defineEntity({
  class: DayAccommodations,
  repository: () => DayAccommodationsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_day_accommodations_trip_id'),
    place: () => p.manyToOne(Places).ref().nullable(),
    startDay: () => p.manyToOne(Days).ref().deleteRule('cascade').index('idx_day_accommodations_start_day_id'),
    endDay: () => p.manyToOne(Days).ref().deleteRule('cascade').index('idx_day_accommodations_end_day_id'),
    checkIn: p.text().nullable(),
    checkInEnd: p.text().nullable(),
    checkOut: p.text().nullable(),
    confirmation: p.text().nullable(),
    notes: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
