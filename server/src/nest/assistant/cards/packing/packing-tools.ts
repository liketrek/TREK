import type { Described, PreviewContext, ToolArgs, ToolCards } from '../card-types';
import { argId, idIn, readKey, recordOf } from '../card-values';
import { memberNames, Rows, text } from '../preview-format';
import { byId, same, STABLE_FIELDS } from '../undo-snapshot';
import { listBagsAnswer, listItemsAnswer, tourPackingAnswer } from './packing-answers';
import {
  applyTemplateCard,
  bagMembersCard,
  bulkImportCard,
  createBagCard,
  createItemCard,
  deleteBagCard,
  deleteItemCard,
  linkTourCard,
  loadBags,
  loadBagsForImport,
  loadBagsWhenNamed,
  loadPackingAssignees,
  loadTemplates,
  packingAssigneesCard,
  sharingCard,
  toggleItemCard,
  updateBagCard,
  updateItemCard,
} from './packing-changes';
import { idsOf, itemRow, listItemsOf, packingCard, packingGroups, positiveId, rowsOf, tripItem } from './packing-rows';
import type { AssistantChangePreview, PackingListCard, TrekCard } from '@trek/shared';

/**
 * Every packing tool's entry: the cards of the reads, the change card of
 * every write, the words of the writes the core has no card for (named by
 * their own label, so the receipt says the bag or the list it touched), the
 * ways back from a tick and a new bag, and the ids a receipt names.
 */

/** Ids one receipt names at most. */
const MAX_APPLIED_IDS = 50;

/** The words of a change with its tool's own label. */
function words(tool: string, subject: string, rows: Rows = new Rows()): Described {
  return { subject, rows, dayId: null, placeIds: [], tool };
}

/** The item a call works on, named from the trip's list. */
function itemName(ctx: PreviewContext, args: ToolArgs): string {
  const itemId = argId(args, 'itemId');
  return tripItem(ctx.card, itemId)?.name ?? (itemId === null ? '' : `#${itemId}`);
}

/** A row the lookup read, by its id argument (`bagId` in `bags`, `templateId` in `templates`). */
function lookedUp(loaded: unknown, list: string, args: ToolArgs, key: string): Record<string, unknown> | null {
  const wanted = argId(args, key);
  return wanted === null ? null : (rowsOf(recordOf(loaded)[list]).find((row) => row.id === wanted) ?? null);
}

function lookedUpName(loaded: unknown, list: string, args: ToolArgs, key: string): string {
  const row = lookedUp(loaded, list, args, key);
  const wanted = argId(args, key);
  return row ? text(row.name) : wanted === null ? '' : `#${wanted}`;
}

const grams = (value: unknown) => (typeof value === 'number' ? `${value} g` : '');

/** The ids a receipt names from an answer's `items` (an import, a template). */
function itemIds(_args: ToolArgs, result: unknown): number[] {
  return rowsOf(recordOf(result).items)
    .flatMap((row) => positiveId(row.id) ?? [])
    .slice(0, MAX_APPLIED_IDS);
}

const bagIdArg = (args: ToolArgs): number[] => {
  const bagId = argId(args, 'bagId');
  return bagId === null ? [] : [bagId];
};

/** The applied card of a single new row: the preview's, with the id the server gave it. */
function withCreatedId(result: unknown, preview: AssistantChangePreview | null): TrekCard | null {
  const id = positiveId(recordOf(recordOf(result).item).id);
  const card = preview?.card;
  if (id === null || card?.kind !== 'packingList') return null;
  const groups = card.groups.map((group) => ({
    ...group,
    items: group.items.map((row) => (row.id === null ? { ...row, id } : row)),
  }));
  return { ...card, groups };
}

/** The applied card of a template: the items it added, by category, under the template's name. */
function templateApplied(result: unknown, preview: AssistantChangePreview | null): PackingListCard | null {
  const items = listItemsOf(recordOf(result).items).filter((item) => !item.placeholder);
  const card = preview?.card;
  if (items.length === 0 || card?.kind !== 'packingList') return null;
  const { groups, moreGroups } = packingGroups(null, items, {
    groupBy: 'category',
    bagIds: [],
    rowOf: (item) => ({ ...itemRow(null, item, 'add'), bagKey: null }),
  });
  return packingCard(card.source, 'category', [], groups, { moreGroups });
}

/** How many of a ticked row were packed before the tick, as its change card kept it, and of how many. */
function packedBefore(preview: AssistantChangePreview | null): { packed: number; quantity: number } | null {
  const card = preview?.card;
  const row = card?.kind === 'packingList' ? card.groups[0]?.items[0] : undefined;
  const kept = row?.changed.find((entry) => entry.field === 'packed')?.before;
  return row && typeof kept === 'string' ? { packed: Number(kept), quantity: row.quantity } : null;
}

/**
 * A ticked item taken back with the opposite tick, while it is still as the
 * tick left it, and only where that is where it was: a tick of an item with
 * nothing packed, an untick of one packed in full. A tick that changed
 * nothing, or one that wiped a partial count, has no way back.
 */
const UNTOGGLE_ITEM: NonNullable<ToolCards['undo']> = {
  tool: 'toggle_packing_item',
  args: (args, result, preview) => {
    const itemId = idIn(result, 'item') ?? argId(args, 'itemId');
    if (itemId === null || typeof args.checked !== 'boolean') return null;
    const was = packedBefore(preview);
    if (!was || was.packed !== (args.checked ? 0 : was.quantity)) return null;
    return { itemId, checked: !args.checked };
  },
  unchanged: (result, snapshot) => {
    const item = recordOf(recordOf(result).item);
    const items = rowsOf(recordOf(recordOf(snapshot.summary).packing).items);
    return same(item, byId(items, item.id), STABLE_FIELDS.packing);
  },
};

const BAG_READ = { tool: 'list_packing_bags', args: {} };

/**
 * A new bag taken back while nobody has used it: it still has the name,
 * colour, limit and owner it was made with, nobody packs it, no item the user
 * can see sits in it and it weighs nothing (its weight counts every member's
 * items, so a hidden item with a weight shows there). Deleting a bag only
 * unpacks its items, so an item another member keeps to themselves would only
 * land in "Unassigned".
 */
const DELETE_CREATED_BAG: NonNullable<ToolCards['undo']> = {
  tool: 'delete_packing_bag',
  args: (_args, result) => {
    const bagId = idIn(result, 'bag');
    return bagId ? { bagId } : null;
  },
  reads: () => [BAG_READ],
  unchanged: (result, snapshot) => {
    const bag = recordOf(recordOf(result).bag);
    const bags = rowsOf(recordOf(snapshot.reads.get(readKey(BAG_READ.tool, BAG_READ.args))).bags);
    const current = byId(bags, bag.id);
    if (!current || !same(bag, current, ['name', 'color', 'weight_limit_grams', 'user_id'])) return false;
    const items = rowsOf(recordOf(recordOf(snapshot.summary).packing).items);
    const empty = !Number(current.total_weight_grams ?? 0);
    return empty && rowsOf(current.members).length === 0 && !items.some((item) => item.bag_id === bag.id);
  },
};

const ITEM_UPDATE = { verbKey: 'genericUpdate', entity: 'packing' } as const;
const BAG_UPDATE = { verbKey: 'genericUpdate', entity: 'packing_bag' } as const;

export const PACKING_TOOLS: Readonly<Record<string, ToolCards>> = {
  list_packing_items: { answer: listItemsAnswer },
  list_packing_bags: { answer: listBagsAnswer },
  get_tour_packing: { answer: tourPackingAnswer },
  link_tour_packing: { change: linkTourCard },
  create_packing_item: {
    load: loadBagsWhenNamed,
    change: createItemCard,
    applied: ({ result, preview }) => withCreatedId(result, preview),
  },
  update_packing_item: { load: loadBagsWhenNamed, change: updateItemCard },
  toggle_packing_item: {
    write: ITEM_UPDATE,
    describe: (ctx, args) => {
      const before = tripItem(ctx.card, argId(args, 'itemId'));
      const rows = new Rows();
      if (typeof args.checked === 'boolean') {
        rows.change('packed', before ? text(before.checked) : null, text(args.checked));
      }
      return words('toggle_packing_item', itemName(ctx, args), rows);
    },
    change: toggleItemCard,
    undo: UNTOGGLE_ITEM,
  },
  delete_packing_item: {
    write: { verbKey: 'genericRemove', entity: 'packing' },
    describe: (ctx, args) => words('delete_packing_item', itemName(ctx, args)),
    change: deleteItemCard,
  },
  set_packing_item_sharing: {
    write: ITEM_UPDATE,
    describe: (ctx, args) =>
      words(
        'set_packing_item_sharing',
        itemName(ctx, args),
        new Rows().add('type', text(args.visibility)).add('members', memberNames(ctx, args.recipient_ids)),
      ),
    change: sharingCard,
  },
  bulk_import_packing: {
    write: { verbKey: 'genericCreate', entity: 'packing' },
    load: loadBagsForImport,
    describe: (_ctx, args) => {
      const names = rowsOf(args.items).flatMap((row) => (typeof row.name === 'string' ? row.name : []));
      return words('bulk_import_packing', text(names.join(', ')), new Rows().add('quantity', text(names.length || '')));
    },
    change: bulkImportCard,
    appliedIds: itemIds,
  },
  apply_packing_template: {
    write: { verbKey: 'genericCreate', entity: 'packing' },
    load: loadTemplates,
    describe: (_ctx, args, loaded) =>
      words(
        'apply_packing_template',
        lookedUpName(loaded, 'templates', args, 'templateId'),
        new Rows().add('type', text(args.visibility)),
      ),
    change: applyTemplateCard,
    applied: ({ result, preview }) => templateApplied(result, preview),
    appliedIds: itemIds,
  },
  reorder_packing_items: {
    write: ITEM_UPDATE,
    describe: (ctx, args) => {
      const names = idsOf(args.orderedIds).map((id) => tripItem(ctx.card, id)?.name ?? `#${id}`);
      return words('reorder_packing_items', text(names.join(', ')));
    },
  },
  set_packing_category_assignees: {
    write: ITEM_UPDATE,
    load: loadPackingAssignees,
    describe: (ctx, args) =>
      words(
        'set_packing_category_assignees',
        text(args.categoryName),
        new Rows().add('members', memberNames(ctx, args.userIds)),
      ),
    change: packingAssigneesCard,
  },
  create_packing_bag: {
    write: { verbKey: 'genericCreate', entity: 'packing_bag' },
    describe: (_ctx, args) =>
      words(
        'create_packing_bag',
        text(args.name),
        new Rows().add('color', text(args.color)).add('weight', grams(args.weight_limit_grams)),
      ),
    change: createBagCard,
    appliedIds: (_args, result) => {
      const bagId = idIn(result, 'bag');
      return bagId === null ? [] : [bagId];
    },
    undo: DELETE_CREATED_BAG,
  },
  update_packing_bag: {
    write: BAG_UPDATE,
    load: loadBags,
    describe: (ctx, args, loaded) => {
      const bag = lookedUp(loaded, 'bags', args, 'bagId');
      const rows = new Rows();
      if (args.name !== undefined) rows.change('name', bag ? text(bag.name) : null, text(args.name));
      if (args.color !== undefined) rows.change('color', bag ? text(bag.color) : null, text(args.color));
      if (args.weight_limit_grams !== undefined) {
        rows.change('weight', bag ? grams(bag.weight_limit_grams) : null, grams(args.weight_limit_grams));
      }
      if (args.user_id !== undefined) {
        const owner = (id: unknown) => memberNames(ctx, typeof id === 'number' ? [id] : null);
        rows.change('assignee', bag ? owner(bag.user_id) : null, owner(args.user_id));
      }
      return words('update_packing_bag', lookedUpName(loaded, 'bags', args, 'bagId'), rows);
    },
    change: updateBagCard,
    appliedIds: bagIdArg,
  },
  delete_packing_bag: {
    write: { verbKey: 'genericRemove', entity: 'packing_bag' },
    load: loadBags,
    describe: (_ctx, args, loaded) => words('delete_packing_bag', lookedUpName(loaded, 'bags', args, 'bagId')),
    change: deleteBagCard,
    appliedIds: bagIdArg,
  },
  set_bag_members: {
    write: BAG_UPDATE,
    load: loadBags,
    describe: (ctx, args, loaded) =>
      words(
        'set_bag_members',
        lookedUpName(loaded, 'bags', args, 'bagId'),
        new Rows().add('members', memberNames(ctx, args.userIds)),
      ),
    change: bagMembersCard,
    appliedIds: bagIdArg,
  },
  save_packing_template: {
    // Templates are global, not part of the trip, like the one `delete_packing_template` drops.
    write: { verbKey: 'genericCreate', entity: 'other' },
    describe: (_ctx, args) => words('save_packing_template', text(args.templateName)),
  },
  delete_packing_template: {
    write: { verbKey: 'genericRemove', entity: 'other' },
    load: loadTemplates,
    describe: (_ctx, args, loaded) =>
      words('delete_packing_template', lookedUpName(loaded, 'templates', args, 'templateId')),
  },
};
