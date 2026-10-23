import type { TripCard } from '../../assistant-context';
import { clipped, finite, hexOrNull, personOf, recordOf, type Row } from '../card-values';
import {
  PACKING_PLACEHOLDER_NAME,
  type CardPerson,
  type PackingCardBag,
  type PackingCardGroup,
  type PackingCardItem,
  type PackingListCard,
} from '@trek/shared';

/**
 * The pieces every packing card is built from: an item as the packing tools
 * answer it, its row on a card, its group (a category or a bag) and the bags.
 * Text from a tool's answer is masked like a provider answer (`clipped`), text
 * from a call's arguments only cut (`argText`), since it is what will be
 * stored. The `...` stand-in of an empty category is never a row and never
 * counted, but it still holds its category's place in the list's order.
 */

/** Rows one packing card shows, and at most per group. */
export const MAX_PACKING_ROWS = 24;
const ROWS_PER_GROUP = 8;
export const MAX_CARD_GROUPS = 12;
const MAX_CARD_BAGS = 20;
const MAX_GRAMS = 1_000_000;

export type PackingTier = PackingCardItem['tier'];
type Source = PackingListCard['source'];
type GroupBy = PackingListCard['groupBy'];

/** A packing item as `get_trip_summary`, `list_packing_items` and the writes answer it. */
export interface ListItem {
  id: number;
  /** As shown: masked when it comes from a tool's answer. */
  name: string;
  /** As stored, to tell whether a write really renames it; never shown. */
  rawName: string;
  category: string | null;
  quantity: number;
  packedQuantity: number | null;
  checked: boolean;
  /** The weight of one piece. */
  unitGrams: number | null;
  bagId: number | null;
  isPrivate: boolean;
  ownerId: number | null;
  recipientIds: number[];
  /** The `...` stand-in of an empty category. */
  placeholder: boolean;
}

export function rowsOf(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

export function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function cut(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** A text from a call's arguments as it will be stored: on one line and cut to `max`, never masked. */
export function argText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = value.replace(/\s+/g, ' ').trim();
  return line === '' ? null : cut(line, max);
}

/** How many of an item: what the server keeps, 1 to 999. */
export function quantityOf(value: unknown): number {
  const n = finite(value);
  return n === null ? 1 : Math.min(999, Math.max(1, Math.floor(n)));
}

export function gramsOf(value: unknown): number | null {
  const n = finite(value);
  return n === null || n < 0 ? null : Math.min(MAX_GRAMS, Math.round(n));
}

/** A category as stored: an empty one is none. */
export function categoryOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** One packing item from a tool's answer; null for a row without an id or a name. */
function listItemOf(raw: unknown): ListItem | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const name = typeof row.name === 'string' ? row.name : null;
  if (id === null || name === null) return null;
  const placeholder = name === PACKING_PLACEHOLDER_NAME;
  const shown = placeholder ? name : clipped(name, 200);
  if (shown === null) return null;
  return {
    id,
    name: shown,
    rawName: name,
    category: categoryOf(row.category),
    quantity: quantityOf(row.quantity),
    packedQuantity: finite(row.packed_quantity),
    checked: !!row.checked,
    unitGrams: gramsOf(row.weight_grams),
    bagId: positiveId(row.bag_id),
    isPrivate: !!row.is_private,
    ownerId: positiveId(row.owner_id),
    recipientIds: rowsOf(row.recipients).flatMap((r) => positiveId(r.user_id) ?? []),
    placeholder,
  };
}

export function listItemsOf(value: unknown): ListItem[] {
  return rowsOf(value).flatMap((row) => listItemOf(row) ?? []);
}

const TRIP_PACKING = new WeakMap<TripCard, ListItem[]>();

/** The trip's packing list as the turn read it, the stand-ins included; read once per card. */
export function tripPacking(card: TripCard): ListItem[] {
  let items = TRIP_PACKING.get(card);
  if (!items) {
    items = listItemsOf(recordOf(recordOf(card.sources.summary).packing).items);
    TRIP_PACKING.set(card, items);
  }
  return items;
}

/** The trip's item `id` as the turn read it. */
export function tripItem(card: TripCard, id: number | null): ListItem | null {
  return id === null ? null : (tripPacking(card).find((item) => item.id === id && !item.placeholder) ?? null);
}

/** The tier an item sits in (#858): the common list, the owner's own, or shared with named people. */
export function tierOf(item: Pick<ListItem, 'isPrivate' | 'recipientIds'>): PackingTier {
  if (!item.isPrivate) return 'common';
  return item.recipientIds.length > 0 ? 'shared' : 'personal';
}

/** The trip members among `ids`, in order, at most `max`; anyone outside the trip is left out. */
export function peopleOf(card: TripCard, ids: readonly number[], max: number): CardPerson[] {
  return [...new Set(ids)].flatMap((id) => personOf(card, id) ?? []).slice(0, max);
}

/** The ids of an id list argument. */
export function idsOf(value: unknown): number[] {
  return Array.isArray(value) ? value.flatMap((v: unknown) => positiveId(v) ?? []) : [];
}

/** How many of an item are packed: all of it once ticked, the partial count before (#2296). */
function packedOf(item: Pick<ListItem, 'checked' | 'quantity' | 'packedQuantity'>): number {
  return item.checked ? item.quantity : Math.max(0, Math.min(item.packedQuantity ?? 0, item.quantity));
}

const bagKeyOf = (bagId: number | null): string | null => (bagId === null ? null : `id:${bagId}`);

/** An item's row on a card; without the trip card (an applied change) nobody it is shared with is named. */
export function itemRow(
  card: TripCard | null,
  item: ListItem,
  change: PackingCardItem['change'] = 'none',
  changed: PackingCardItem['changed'] = [],
): PackingCardItem {
  const tier = tierOf(item);
  return {
    id: item.id > 0 ? item.id : null,
    name: item.name,
    quantity: item.quantity,
    packed: packedOf(item),
    checked: item.checked,
    weightGrams: item.unitGrams === null ? null : Math.min(MAX_GRAMS, item.unitGrams * item.quantity),
    bagKey: bagKeyOf(item.bagId),
    tier,
    sharedWith: card && tier === 'shared' ? peopleOf(card, item.recipientIds, 4) : [],
    change,
    changed,
  };
}

/**
 * The categories of a view of the list in the order it first shows them,
 * the way the packing panel colours them (`packingCategoryOrder`): the common
 * list, or the personal one.
 */
function categoryOrder(items: readonly ListItem[], personal: boolean): Array<string | null> {
  const order: Array<string | null> = [];
  for (const item of items) {
    if (item.isPrivate === personal && !order.includes(item.category)) order.push(item.category);
  }
  return order;
}

/**
 * The colour slot of a category: its place in the order of the view its items
 * sit in (the personal one when every one of them is restricted), null for a
 * category the trip's list does not hold yet, and for every one without the trip card.
 */
export function slotOf(card: TripCard | null, category: string | null, personal: boolean): number | null {
  if (!card) return null;
  const index = categoryOrder(tripPacking(card), personal).indexOf(category);
  return index < 0 ? null : index;
}

/** The people of an assignee list (`[{ user_id }]`), as trip members. */
export function assigneesOf(card: TripCard, raw: unknown): CardPerson[] {
  return peopleOf(
    card,
    rowsOf(raw).flatMap((row) => positiveId(row.user_id) ?? []),
    6,
  );
}

/** One bag as `list_packing_bags` answers it. */
export function bagOf(card: TripCard, raw: unknown): PackingCardBag | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const name = clipped(row.name, 100);
  if (id === null || name === null) return null;
  const ownerId = positiveId(row.user_id);
  return {
    key: `id:${id}`,
    id,
    name,
    color: hexOrNull(row.color),
    weightGrams: gramsOf(row.total_weight_grams),
    limitGrams: gramsOf(row.weight_limit_grams),
    owner: ownerId === null ? null : personOf(card, ownerId),
    members: assigneesOf(card, row.members),
    membersRemoved: [],
    change: 'none',
    changed: [],
    movesOut: 0,
  };
}

/** The bags of a `list_packing_bags` answer, in its order. */
export function bagsOf(card: TripCard, value: unknown): PackingCardBag[] {
  return rowsOf(recordOf(value).bags).flatMap((row) => bagOf(card, row) ?? []);
}

/** A group of items on its way to the card. */
interface Bucket {
  key: PackingCardGroup['key'];
  items: ListItem[];
  assignees: CardPerson[];
}

interface GroupOptions {
  groupBy: GroupBy;
  /** The bags in the list's order; a bag group follows it, the pile in no bag comes last. */
  bagIds: readonly number[];
  /** Who looks after a category. */
  assigneesOf?: (category: string | null) => CardPerson[];
  /** How a category from the answer is shown. */
  categoryName?: (category: string) => string | null;
  rowOf: (item: ListItem) => PackingCardItem;
  maxRows?: number;
  /** A card of one group shows up to `maxRows` of it, not eight (a change that adds many rows to one category). */
  fillSingleGroup?: boolean;
}

function bucketsOf(card: TripCard | null, items: readonly ListItem[], options: GroupOptions): Bucket[] {
  const buckets = new Map<string, Bucket>();
  const name = options.categoryName ?? ((category: string) => clipped(category, 100));
  for (const item of items) {
    const key = options.groupBy === 'bag' ? `b${item.bagId ?? ''}` : `c${item.category ?? ''}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key:
          options.groupBy === 'bag'
            ? { by: 'bag', bagKey: bagKeyOf(item.bagId) }
            : { by: 'category', name: item.category === null ? null : name(item.category), slot: null },
        items: [],
        assignees: options.groupBy === 'category' ? (options.assigneesOf?.(item.category) ?? []) : [],
      };
      buckets.set(key, bucket);
    }
    bucket.items.push(item);
  }
  const list = [...buckets.values()];
  for (const bucket of list) {
    if (bucket.key.by !== 'category') continue;
    const personal = bucket.items.every((item) => item.isPrivate);
    bucket.key = { ...bucket.key, slot: slotOf(card, bucket.items[0]?.category ?? null, personal) };
  }
  if (options.groupBy !== 'bag') return list;
  const rank = (bucket: Bucket) => {
    const bagKey = bucket.key.by === 'bag' ? bucket.key.bagKey : null;
    if (bagKey === null) return Number.MAX_SAFE_INTEGER;
    const index = options.bagIds.indexOf(Number(bagKey.slice(3)));
    return index < 0 ? options.bagIds.length : index;
  };
  return list.sort((a, b) => rank(a) - rank(b));
}

/**
 * The groups of a card: by category in the order the items first show them,
 * or by bag in the bags' order with the pile in no bag last. At most twelve
 * groups and 24 rows (eight per group); every group still counts all of its
 * items, and the groups left out are counted on the card.
 */
export function packingGroups(
  card: TripCard | null,
  items: readonly ListItem[],
  options: GroupOptions,
): { groups: PackingCardGroup[]; moreGroups: number } {
  const buckets = bucketsOf(
    card,
    items.filter((item) => !item.placeholder),
    options,
  );
  let left = options.maxRows ?? MAX_PACKING_ROWS;
  const perGroup = options.fillSingleGroup && buckets.length === 1 ? left : ROWS_PER_GROUP;
  const groups = buckets.slice(0, MAX_CARD_GROUPS).map((bucket): PackingCardGroup => {
    const shown = bucket.items.slice(0, Math.min(perGroup, left));
    left -= shown.length;
    return {
      key: bucket.key,
      assignees: bucket.assignees,
      assigneesRemoved: [],
      items: shown.map(options.rowOf),
      count: bucket.items.length,
      packed: bucket.items.filter((item) => item.checked).length,
    };
  });
  return { groups, moreGroups: Math.max(0, buckets.length - MAX_CARD_GROUPS) };
}

/** The bags a card names: those its groups or rows point at, in the list's order. */
export function bagsNamed(bags: readonly PackingCardBag[], groups: readonly PackingCardGroup[]): PackingCardBag[] {
  const keys = new Set<string>();
  for (const group of groups) {
    if (group.key.by === 'bag' && group.key.bagKey) keys.add(group.key.bagKey);
    for (const item of group.items) if (item.bagKey) keys.add(item.bagKey);
  }
  return bags.filter((bag) => keys.has(bag.key)).slice(0, MAX_CARD_BAGS);
}

/**
 * The rows with a bag the card does not carry, taken out of it: a card that
 * read no bags (a tick, a tour) cannot name or colour the bag, and a row
 * pointing at a bag the reader cannot see would read as "Unassigned".
 */
function withKnownBags(groups: PackingCardGroup[], bags: readonly PackingCardBag[]): PackingCardGroup[] {
  const keys = new Set(bags.map((bag) => bag.key));
  const unknown = (row: PackingCardItem) => row.bagKey !== null && !keys.has(row.bagKey);
  return groups.map((group) =>
    group.items.some(unknown)
      ? { ...group, items: group.items.map((row) => (unknown(row) ? { ...row, bagKey: null } : row)) }
      : group,
  );
}

/** A packing card; a row's bag is always one of the card's bags. */
export function packingCard(
  source: Source,
  groupBy: GroupBy,
  bags: PackingCardBag[],
  groups: PackingCardGroup[],
  extra: { moreGroups?: number; progress?: PackingListCard['progress'] } = {},
): PackingListCard {
  const shown = bags.slice(0, MAX_CARD_BAGS);
  return {
    kind: 'packingList',
    source,
    groupBy,
    progress: extra.progress ?? null,
    bags: shown,
    groups: withKnownBags(groups, shown),
    moreGroups: extra.moreGroups ?? 0,
  };
}

/** A card of one category group holding `rows`: what a change to one item shows. */
export function categoryCard(
  card: TripCard,
  category: { name: string | null; raw: string | null; personal: boolean },
  rows: PackingCardItem[],
  bags: PackingCardBag[] = [],
): PackingListCard {
  const group: PackingCardGroup = {
    key: { by: 'category', name: category.name, slot: slotOf(card, category.raw, category.personal) },
    assignees: [],
    assigneesRemoved: [],
    items: rows,
    count: rows.length,
    packed: rows.filter((row) => row.checked).length,
  };
  return packingCard({ type: 'trip' }, 'category', bags, [group]);
}
