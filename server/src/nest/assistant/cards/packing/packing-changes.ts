import type { TripCard } from '../../assistant-context';
import type { CardReader, PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, hexOrNull, recordOf, type Row } from '../card-values';
import {
  argText,
  bagOf,
  bagsOf,
  categoryCard,
  categoryOf,
  gramsOf,
  idsOf,
  itemRow,
  MAX_PACKING_ROWS,
  packingCard,
  packingGroups,
  peopleOf,
  positiveId,
  quantityOf,
  rowsOf,
  slotOf,
  tierOf,
  tripItem,
  tripPacking,
  type ListItem,
  type PackingTier,
} from './packing-rows';
import { resolvePackedState, type PackingCardBag, type PackingCardItem, type PackingListCard } from '@trek/shared';

/**
 * The card each packing change shows inside its change card, from the call's
 * arguments, the trip's list as the turn read it, and what the change's
 * lookup found (the bags, the templates, who looks after a category). The
 * defaults are the server's own: a new item goes under "General", an imported
 * one under "Other", a quantity is 1 to 999, a new bag is indigo. A change to
 * an item, bag or template the turn cannot find shows no card; the server
 * refuses it anyway.
 */

/** The colour `create_packing_bag` gives a bag without one. */
const DEFAULT_BAG_COLOR = '#6366f1';
/** New bags one import card names. */
const MAX_NEW_BAGS = 20;

type Changed = PackingCardItem['changed'];

/** The bags as the lookup read them, raw. */
function rawBags(loaded: unknown): Row[] {
  return rowsOf(recordOf(loaded).bags);
}

/** Reads the trip's bags, for a change that names one. */
export function loadBags(_args: ToolArgs, read: CardReader): Promise<unknown> {
  return read('list_packing_bags');
}

/**
 * Reads the bags only when the call names one (`bag_id`), also to take an
 * item out of its bag (`null`), so the card can name the bag it leaves.
 */
export function loadBagsWhenNamed(args: ToolArgs, read: CardReader): Promise<unknown> {
  return args.bag_id === undefined ? Promise.resolve(null) : read('list_packing_bags');
}

/** Reads the bags only when an imported item names one by its name. */
export function loadBagsForImport(args: ToolArgs, read: CardReader): Promise<unknown> {
  const named = rowsOf(args.items).some((item) => typeof item.bag === 'string' && item.bag.trim() !== '');
  return named ? read('list_packing_bags') : Promise.resolve(null);
}

export function loadTemplates(_args: ToolArgs, read: CardReader): Promise<unknown> {
  return read('list_packing_templates');
}

export function loadPackingAssignees(_args: ToolArgs, read: CardReader): Promise<unknown> {
  return read('get_packing_category_assignees');
}

/** The tier a write's arguments put an item in, the server's way (`visibility` before `is_private`). */
function visibilityOf(args: ToolArgs): PackingTier {
  const visibility = args.visibility;
  if (visibility === 'common' || visibility === 'personal' || visibility === 'shared') return visibility;
  return args.is_private === true ? 'personal' : 'common';
}

/** The people a shared item covers: trip members, never its owner (the server drops both). */
function recipientsOf(card: TripCard, value: unknown): number[] {
  return idsOf(value).filter((id) => id !== card.viewerId && card.members.has(id));
}

/**
 * One item in its category, with the bag it goes into. The category's name is
 * masked when it comes from the trip, kept as written from arguments.
 */
function oneItemCard(
  card: TripCard,
  item: ListItem,
  row: PackingCardItem,
  bags: PackingCardBag[],
  mask = true,
): PackingListCard {
  const bag = bags.find((b) => b.id !== null && b.id === item.bagId);
  const name = mask ? clipped(item.category, 100) : argText(item.category, 100);
  return categoryCard(card, { name, raw: item.category, personal: item.isPrivate }, [row], bag ? [bag] : []);
}

/** `create_packing_item`: the new row under its category. */
export function createItemCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const name = argText(args.name, 200);
  if (name === null) return null;
  const tier = visibilityOf(args);
  const bags = bagsOf(ctx.card, loaded);
  const bagId = positiveId(args.bag_id);
  const item: ListItem = {
    id: 0,
    name,
    rawName: name,
    category: argText(args.category, 100) ?? 'General',
    quantity: quantityOf(args.quantity),
    packedQuantity: null,
    checked: !!args.checked,
    unitGrams: gramsOf(args.weight_grams),
    bagId: bags.some((bag) => bag.id === bagId) ? bagId : null,
    isPrivate: tier !== 'common',
    ownerId: ctx.card.viewerId,
    recipientIds: tier === 'shared' ? recipientsOf(ctx.card, args.recipient_ids) : [],
    placeholder: false,
  };
  return oneItemCard(ctx.card, item, itemRow(ctx.card, item, 'add'), bags, false);
}

/** An imported weight as the server keeps it: whole grams cut (`parseInt`), none for 0. */
function importGrams(value: unknown): number | null {
  return gramsOf(typeof value === 'number' ? Math.trunc(value) : value) || null;
}

/**
 * `bulk_import_packing`: every imported item under its category ("Other"
 * without one), a bag named by an existing bag's exact name going into that
 * bag and any other name making a new one, as the server does.
 */
export function bulkImportCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const existing = rawBags(loaded);
  const known = bagsOf(ctx.card, loaded);
  const created: PackingCardBag[] = [];
  const keys = new Map<number, string>();
  const keyOf = (bagName: string): string | null => {
    const found = positiveId(existing.find((bag) => bag.name === bagName)?.id);
    if (found !== null) return `id:${found}`;
    const shown = argText(bagName, 100);
    const already = created.find((bag) => bag.name === shown);
    if (already) return already.key;
    if (shown === null || created.length >= MAX_NEW_BAGS) return null;
    const bag = newBag(`new:${created.length}`, shown, null, null);
    created.push(bag);
    return bag.key;
  };
  const items = rowsOf(args.items).flatMap((raw, index): ListItem[] => {
    const name = argText(raw.name, 200);
    if (name === null) return [];
    const bagName = typeof raw.bag === 'string' ? raw.bag.trim() : '';
    const key = bagName === '' ? null : keyOf(bagName);
    if (key) keys.set(-1 - index, key);
    return [
      {
        id: -1 - index,
        name,
        rawName: name,
        category: argText(raw.category, 100) ?? 'Other',
        quantity: quantityOf(raw.quantity),
        packedQuantity: null,
        checked: raw.checked === true,
        unitGrams: importGrams(raw.weight_grams),
        bagId: null,
        isPrivate: false,
        ownerId: ctx.card.viewerId,
        recipientIds: [],
        placeholder: false,
      },
    ];
  });
  if (items.length === 0) return null;
  const { groups, moreGroups } = packingGroups(ctx.card, items, {
    groupBy: 'category',
    bagIds: [],
    categoryName: (category) => argText(category, 100),
    rowOf: (item) => ({ ...itemRow(ctx.card, item, 'add'), bagKey: keys.get(item.id) ?? null }),
    maxRows: MAX_PACKING_ROWS,
    fillSingleGroup: true,
  });
  const named = new Set(groups.flatMap((group) => group.items.flatMap((row) => row.bagKey ?? [])));
  const bags = [...known, ...created].filter((bag) => named.has(bag.key));
  return packingCard({ type: 'trip' }, 'category', bags, groups, { moreGroups });
}

/** A bag a change creates, before the server has given it an id. */
function newBag(key: string, name: string, color: string | null, limitGrams: number | null): PackingCardBag {
  return {
    key,
    id: null,
    name,
    color,
    weightGrams: null,
    limitGrams,
    owner: null,
    members: [],
    membersRemoved: [],
    change: 'add',
    changed: [],
    movesOut: 0,
  };
}

/** `apply_packing_template`: the template and how many items it adds; its items cannot be read. */
export function applyTemplateCard(_ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const templateId = argId(args, 'templateId');
  const template = rowsOf(recordOf(loaded).templates).find((row) => row.id === templateId);
  const name = clipped(template?.name, 100);
  if (templateId === null || !template || name === null) return null;
  const itemCount = Math.max(0, Math.min(5_000, Math.floor(Number(template.item_count) || 0)));
  return packingCard({ type: 'template', templateId, name, itemCount }, 'category', [], []);
}

/**
 * `toggle_packing_item`: the row ticked off or not, its packed count with it.
 * The row keeps how many were packed before, so the tick is only taken back
 * when that brings the item back to where it was.
 */
export function toggleItemCard(ctx: PreviewContext, args: ToolArgs): PackingListCard | null {
  const before = tripItem(ctx.card, argId(args, 'itemId'));
  if (!before) return null;
  const checked = args.checked === true;
  const after = { ...before, checked, packedQuantity: null };
  const changed: Changed = [{ field: 'packed', before: String(itemRow(ctx.card, before).packed) }];
  return oneItemCard(ctx.card, after, itemRow(ctx.card, after, checked ? 'check' : 'uncheck', changed), []);
}

/** `delete_packing_item`: the row as it is, about to go. */
export function deleteItemCard(ctx: PreviewContext, args: ToolArgs): PackingListCard | null {
  const before = tripItem(ctx.card, argId(args, 'itemId'));
  return before ? oneItemCard(ctx.card, before, itemRow(ctx.card, before, 'remove'), []) : null;
}

function bagName(bags: readonly PackingCardBag[], bagId: number | null): string | null {
  return bagId === null ? null : (bags.find((bag) => bag.id === bagId)?.name ?? null);
}

/** What a field read before a change, as stored. */
function grams(value: number | null): string | null {
  return value === null ? null : String(value);
}

/**
 * `update_packing_item`: the row with the arguments merged in, under its new
 * category. Taking it out of its bag is `bag_id: null`; a packed count that
 * reaches the quantity ticks it off, 0 or null clears the count, as the
 * server settles them (`resolvePackedState`). Every field that changes keeps
 * what it held before.
 */
export function updateItemCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const before = tripItem(ctx.card, argId(args, 'itemId'));
  if (!before) return null;
  const bags = bagsOf(ctx.card, loaded);
  const quantity = args.quantity === undefined ? before.quantity : quantityOf(args.quantity);
  const bodyKeys = args.packed_quantity === undefined ? [] : ['packed_quantity'];
  const packed = resolvePackedState(
    { checked: before.checked ? 1 : 0, packed_quantity: before.packedQuantity },
    { bodyKeys, packed_quantity: typeof args.packed_quantity === 'number' ? args.packed_quantity : null, quantity },
  );
  // A name sent again as it is stays the one shown, masked as the trip read it.
  const named = argText(args.name, 200);
  const after: ListItem = {
    ...before,
    name: named === null || named === argText(before.rawName, 200) ? before.name : named,
    rawName: named ?? before.rawName,
    category: args.category === undefined ? before.category : (argText(args.category, 100) ?? before.category),
    quantity,
    checked: packed.checked === 1,
    packedQuantity: packed.packed_quantity,
    unitGrams: args.weight_grams === undefined ? before.unitGrams : gramsOf(args.weight_grams),
    bagId: args.bag_id === undefined ? before.bagId : positiveId(args.bag_id),
    isPrivate: typeof args.is_private === 'boolean' ? args.is_private : before.isPrivate,
  };
  const changed: Changed = [];
  const note = (field: Changed[number]['field'], old: string | null, now: string | null) => {
    if (old !== now) changed.push({ field, before: old === null ? null : old.slice(0, 120) });
  };
  note('name', before.name, after.name);
  if (before.category !== after.category) changed.push({ field: 'category', before: clipped(before.category, 100) });
  note('quantity', String(before.quantity), String(after.quantity));
  note('packed', String(itemRow(ctx.card, before).packed), String(itemRow(ctx.card, after).packed));
  // Weights compare as the row shows them, every piece together.
  if (before.unitGrams !== after.unitGrams) {
    const total = (item: ListItem) => itemRow(ctx.card, item).weightGrams;
    changed.push({ field: 'weight', before: grams(total(before)) });
  }
  note('bag', bagName(bags, before.bagId), bagName(bags, after.bagId));
  note('tier', tierOf(before), tierOf(after));
  // A bag the lookup does not know stays unnamed: the row shows no swatch rather than a wrong one.
  return oneItemCard(ctx.card, after, itemRow(ctx.card, after, 'update', changed), bags, args.category === undefined);
}

/** `set_packing_item_sharing`: the row in the tier it moves to, with the people it covers. */
export function sharingCard(ctx: PreviewContext, args: ToolArgs): PackingListCard | null {
  const before = tripItem(ctx.card, argId(args, 'itemId'));
  if (!before) return null;
  const tier = visibilityOf(args);
  const after: ListItem = {
    ...before,
    isPrivate: tier !== 'common',
    recipientIds: tier === 'shared' ? recipientsOf(ctx.card, args.recipient_ids) : [],
  };
  const row = itemRow(ctx.card, after, 'share', [{ field: 'tier', before: tierOf(before) }]);
  return oneItemCard(ctx.card, after, row, []);
}

/**
 * `set_packing_category_assignees`: the category's head with the people it
 * will have, new ones marked, and the ones it drops; its items are counted.
 */
export function packingAssigneesCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const raw = typeof args.categoryName === 'string' ? args.categoryName : null;
  const name = argText(raw, 100);
  if (raw === null || name === null) return null;
  const chosen = idsOf(args.userIds);
  const before = rowsOf(recordOf(recordOf(loaded).assignees)[raw]).flatMap((row) => positiveId(row.user_id) ?? []);
  const inside = tripPacking(ctx.card).filter((item) => !item.placeholder && item.category === raw);
  const personal = inside.length > 0 && inside.every((item) => item.isPrivate);
  return packingCard(
    { type: 'trip' },
    'category',
    [],
    [
      {
        key: { by: 'category', name, slot: slotOf(ctx.card, raw, personal) },
        assignees: peopleOf(ctx.card, chosen, 6),
        assigneesRemoved: peopleOf(
          ctx.card,
          before.filter((id) => !chosen.includes(id)),
          6,
        ),
        items: [],
        count: inside.length,
        packed: inside.filter((item) => item.checked).length,
      },
    ],
  );
}

/** A bag head on a card of its own: what a change to one bag shows. */
function bagCard(card: TripCard, bag: PackingCardBag): PackingListCard {
  const inside = tripPacking(card).filter((item) => !item.placeholder && bag.id !== null && item.bagId === bag.id);
  return packingCard(
    { type: 'trip' },
    'bag',
    [bag],
    [
      {
        key: { by: 'bag', bagKey: bag.key },
        assignees: [],
        assigneesRemoved: [],
        items: [],
        count: inside.length,
        packed: inside.filter((item) => item.checked).length,
      },
    ],
  );
}

/** The bag a call names (`bagId`), as the lookup read it. */
function namedBag(card: TripCard, args: ToolArgs, loaded: unknown): PackingCardBag | null {
  const bagId = argId(args, 'bagId');
  return bagId === null
    ? null
    : bagOf(
        card,
        rawBags(loaded).find((bag) => bag.id === bagId),
      );
}

/** `create_packing_bag`: the new bag's head, in its colour (indigo without one) and with its limit. */
export function createBagCard(ctx: PreviewContext, args: ToolArgs): PackingListCard | null {
  const name = argText(args.name, 100);
  if (name === null) return null;
  const bag = newBag('new:0', name, hexOrNull(args.color) ?? DEFAULT_BAG_COLOR, gramsOf(args.weight_limit_grams));
  return bagCard(ctx.card, bag);
}

/** `update_packing_bag`: the bag with the arguments merged in, each changed field with its old value. */
export function updateBagCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const before = namedBag(ctx.card, args, loaded);
  if (!before) return null;
  const ownerId = args.user_id === undefined ? (before.owner?.id ?? null) : positiveId(args.user_id);
  const after: PackingCardBag = {
    ...before,
    name: argText(args.name, 100) ?? before.name,
    color: args.color === undefined ? before.color : (hexOrNull(args.color) ?? before.color),
    limitGrams: args.weight_limit_grams === undefined ? before.limitGrams : gramsOf(args.weight_limit_grams),
    owner: ownerId === null ? null : (peopleOf(ctx.card, [ownerId], 1)[0] ?? null),
    change: 'update',
  };
  const changed: PackingCardBag['changed'] = [];
  if (after.name !== before.name) changed.push({ field: 'name', before: before.name.slice(0, 120) });
  if (after.color !== before.color) changed.push({ field: 'color', before: before.color });
  if (after.limitGrams !== before.limitGrams) changed.push({ field: 'limit', before: grams(before.limitGrams) });
  if (after.owner?.id !== before.owner?.id) changed.push({ field: 'owner', before: before.owner?.name ?? null });
  return bagCard(ctx.card, { ...after, changed });
}

/** `set_bag_members`: the bag with the people who will pack it, and the ones it drops. */
export function bagMembersCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const before = namedBag(ctx.card, args, loaded);
  if (!before) return null;
  const chosen = idsOf(args.userIds);
  const members = peopleOf(ctx.card, chosen, 6);
  const membersRemoved = before.members.filter((person) => !chosen.includes(person.id));
  return bagCard(ctx.card, { ...before, members, membersRemoved, change: 'members' });
}

/** `delete_packing_bag`: the bag about to go, and how many items land in "Unassigned". */
export function deleteBagCard(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PackingListCard | null {
  const before = namedBag(ctx.card, args, loaded);
  if (!before) return null;
  const movesOut = tripPacking(ctx.card).filter((item) => !item.placeholder && item.bagId === before.id).length;
  return bagCard(ctx.card, { ...before, change: 'remove', movesOut: Math.min(movesOut, 5_000) });
}

/**
 * `link_tour_packing`: the part of the list the tour will point at, as the
 * tour will show it (the whole list, or one category of it).
 */
export function linkTourCard(ctx: PreviewContext, args: ToolArgs): PackingListCard | null {
  const placeId = argId(args, 'placeId');
  const name = clipped(placeId === null ? null : ctx.card.places.get(placeId)?.name, 200);
  if (placeId === null || name === null) return null;
  const category = categoryOf(args.category);
  const items = tripPacking(ctx.card).filter((item) => category === null || item.category === category);
  const { groups, moreGroups } = packingGroups(ctx.card, items, {
    groupBy: 'category',
    bagIds: [],
    rowOf: (item) => itemRow(ctx.card, item),
  });
  const shown = category === null ? null : argText(category, 200);
  return packingCard({ type: 'tour', placeId, name, category: shown }, 'category', [], groups, { moreGroups });
}
