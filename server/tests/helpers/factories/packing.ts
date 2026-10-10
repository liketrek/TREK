import { PackingBags } from '../../../src/db/entities/PackingBags.entity';
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { inContext, nextSeq, type FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type PackingItemRow = EntityDTO<PackingItems>;
export type PackingBagRow = EntityDTO<PackingBags>;

/** An unchecked item on the trip's packing list, under Clothing. */
export function makePackingItem(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<PackingItems> = {},
): Promise<PackingItemRow> {
  return createRow(orm, PackingItems, {
    trip: tripId,
    name: 'Test Item',
    category: 'Clothing',
    checked: 0,
    ...overrides,
  });
}

/** A bag on the trip. */
export function makePackingBag(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<PackingBags> = {},
): Promise<PackingBagRow> {
  return createRow(orm, PackingBags, {
    trip: tripId,
    name: `Bag ${nextSeq('packing-bag')}`,
    ...overrides,
  });
}

/** Shares the bag with the users; pairs that already exist are skipped. */
export async function addPackingBagMembers(orm: FactoryOrm, bagId: number, userIds: number[]): Promise<void> {
  await inContext(orm, (em) => em.getRepository(PackingBags).insertMembersIgnore(bagId, userIds));
}

/** Marks the users as recipients of the item; pairs that already exist are skipped. */
export async function addPackingItemRecipients(orm: FactoryOrm, itemId: number, userIds: number[]): Promise<void> {
  await inContext(orm, (em) => em.getRepository(PackingItems).insertRecipientsIgnore(itemId, userIds));
}
