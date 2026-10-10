import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../../src/db/entities/DayNotes.entity';
import { inContext, type FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type DayAssignmentRow = EntityDTO<DayAssignments>;
export type DayNoteRow = EntityDTO<DayNotes>;
export type DayAccommodationRow = EntityDTO<DayAccommodations>;

/** The next free `order_index` on the day: one past the highest, 0 on an empty day. */
function nextOrderIndex(orm: FactoryOrm, dayId: number): Promise<number> {
  return inContext(orm, async (em) => {
    const last = await em.findOne(
      DayAssignments,
      { day: dayId },
      { orderBy: { order_index: 'desc' }, disableIdentityMap: true },
    );
    return last?.order_index == null ? 0 : last.order_index + 1;
  });
}

/** Schedules the place on the day, after whatever the day already holds. */
export async function makeDayAssignment(
  orm: FactoryOrm,
  dayId: number,
  placeId: number,
  overrides: EntityData<DayAssignments> = {},
): Promise<DayAssignmentRow> {
  const orderIndex = overrides.order_index ?? (await nextOrderIndex(orm, dayId));
  return createRow(orm, DayAssignments, {
    day: dayId,
    place: placeId,
    notes: null,
    ...overrides,
    order_index: orderIndex,
  });
}

/** A note on the day, sorted last unless `sort_order` says otherwise. */
export function makeDayNote(
  orm: FactoryOrm,
  dayId: number,
  tripId: number,
  overrides: EntityData<DayNotes> = {},
): Promise<DayNoteRow> {
  return createRow(orm, DayNotes, {
    day: dayId,
    trip: tripId,
    text: 'Test note',
    time: null,
    icon: '📝',
    sort_order: 9999,
    ...overrides,
  });
}

/** A stay at `placeId` from the start day to the end day. */
export function makeDayAccommodation(
  orm: FactoryOrm,
  tripId: number,
  placeId: number | null,
  startDayId: number,
  endDayId: number,
  overrides: EntityData<DayAccommodations> = {},
): Promise<DayAccommodationRow> {
  return createRow(orm, DayAccommodations, {
    trip: tripId,
    place: placeId,
    startDay: startDayId,
    endDay: endDayId,
    check_in: null,
    check_out: null,
    confirmation: null,
    ...overrides,
  });
}
