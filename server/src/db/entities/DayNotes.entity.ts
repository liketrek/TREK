import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Days } from './Days.entity';
import { Trips } from './Trips.entity';

export class DayNotes {
  id?: number | null;
  day!: Ref<Days>;
  trip!: Ref<Trips>;
  text!: string;
  time?: string | null;
  icon?: string | null = '📝';
  sortOrder?: unknown | null;
  createdAt?: Date | null;
  color?: string | null;
}

export class DayNotesRepository extends EntityRepository<DayNotes> {}

export const DayNotesSchema = defineEntity({
  class: DayNotes,
  repository: () => DayNotesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    day: () => p.manyToOne(Days).ref().deleteRule('cascade').index('idx_day_notes_day_id'),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade'),
    text: p.text(),
    time: p.text().nullable(),
    icon: p.text().nullable(),
    sortOrder: p.double().nullable().default(0),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    color: p.text().nullable(),
  },
});
