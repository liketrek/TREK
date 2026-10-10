import { TodoItems } from '../../../src/db/entities/TodoItems.entity';
import { inContext, type FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type TodoItemRow = EntityDTO<TodoItems>;

/** An open to-do on the trip, appended after the trip's last one. */
export async function makeTodoItem(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<TodoItems> = {},
): Promise<TodoItemRow> {
  const sortOrder =
    overrides.sort_order ??
    (await inContext(orm, async (em) => {
      const last = await em.findOne(
        TodoItems,
        { trip: tripId },
        { orderBy: { sort_order: 'desc' }, disableIdentityMap: true },
      );
      return last?.sort_order == null ? 0 : last.sort_order + 1;
    }));
  return createRow(orm, TodoItems, {
    trip: tripId,
    name: 'Test Todo',
    checked: 0,
    category: null,
    ...overrides,
    sort_order: sortOrder,
  });
}
