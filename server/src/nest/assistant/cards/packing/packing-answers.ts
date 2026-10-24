import type { AnswerInput } from '../card-types';
import { clipped, recordOf } from '../card-values';
import {
  assigneesOf,
  bagsNamed,
  bagsOf,
  categoryOf,
  itemRow,
  listItemsOf,
  MAX_CARD_GROUPS,
  packingCard,
  packingGroups,
  positiveId,
  quantityOf,
  rowsOf,
  tripPacking,
  type ListItem,
} from './packing-rows';
import { PACKING_PLACEHOLDER_NAME, type PackingCardGroup, type PackingListCard } from '@trek/shared';

/**
 * The cards a packing read shows beside its answer, built from the read's
 * raw value: the list grouped the way the app groups it, the bags with what
 * they weigh, and the part of the list a tour points at. An empty list, no
 * bags and a tour that points at nothing (or at a category nobody can see an
 * item of any more) show no card; the answer says so in words.
 */

/** `list_packing_items`: the items the user may see, grouped by category or by bag. */
export function listItemsAnswer({ args, value, card }: AnswerInput): PackingListCard | null {
  const root = recordOf(value);
  const items = listItemsOf(root.items).filter((item) => !item.placeholder);
  if (items.length === 0) return null;
  const groupBy = args.group_by === 'bag' ? 'bag' : 'category';
  const bags = bagsOf(card, root);
  const assignees = recordOf(root.category_assignees);
  const { groups, moreGroups } = packingGroups(card, items, {
    groupBy,
    bagIds: bags.flatMap((bag) => bag.id ?? []),
    assigneesOf: (category) => (category === null ? [] : assigneesOf(card, assignees[category])),
    rowOf: (item) => itemRow(card, item),
  });
  const progress = { packed: items.filter((item) => item.checked).length, total: items.length };
  return packingCard({ type: 'trip' }, groupBy, bagsNamed(bags, groups), groups, { moreGroups, progress });
}

/**
 * `list_packing_bags`: one head per bag with what it weighs and who packs it,
 * its items counted from the trip's list, and the pile in no bag when there is
 * one. No rows: a bag overview is its heads.
 */
export function listBagsAnswer({ value, card }: AnswerInput): PackingListCard | null {
  const bags = bagsOf(card, value);
  if (bags.length === 0) return null;
  const items = tripPacking(card).filter((item) => !item.placeholder);
  const group = (bagId: number | null): PackingCardGroup => {
    const inside = items.filter((item) => item.bagId === bagId);
    return {
      key: { by: 'bag', bagKey: bagId === null ? null : `id:${bagId}` },
      assignees: [],
      assigneesRemoved: [],
      items: [],
      count: inside.length,
      packed: inside.filter((item) => item.checked).length,
    };
  };
  const shown = bags.slice(0, MAX_CARD_GROUPS);
  const groups = shown.flatMap((bag) => (bag.id === null ? [] : [group(bag.id)]));
  const loose = group(null);
  if (loose.count > 0 && groups.length < MAX_CARD_GROUPS) groups.push(loose);
  return packingCard({ type: 'trip' }, 'bag', shown, groups, { moreGroups: bags.length - shown.length });
}

/**
 * `get_tour_packing`: the part of the list a tour points at, as the tour
 * shows it. What the trip's list knows of an item (its weight, tier)
 * fills in what the tour's answer leaves out; its bag is not named, since the
 * card reads no bags.
 */
export function tourPackingAnswer({ args, value, card }: AnswerInput): PackingListCard | null {
  const root = recordOf(value);
  const placeId = positiveId(args.placeId);
  if (placeId === null || !root.packing_link || root.state === 'missing') return null;
  const name = clipped(recordOf(root.tour).name, 200) ?? clipped(card.places.get(placeId)?.name, 200);
  if (name === null) return null;
  const known = new Map(tripPacking(card).map((item): [number, ListItem] => [item.id, item]));
  const items = rowsOf(root.items).flatMap((raw): ListItem[] => {
    const id = positiveId(raw.id);
    // The `...` stand-in of an empty category is never a row.
    const rawName = typeof raw.name === 'string' ? raw.name : null;
    if (rawName === null || rawName === PACKING_PLACEHOLDER_NAME) return [];
    const shown = clipped(rawName, 200);
    if (id === null || shown === null) return [];
    const base = known.get(id);
    return [
      {
        id,
        name: shown,
        rawName,
        category: categoryOf(raw.category),
        quantity: quantityOf(raw.quantity),
        packedQuantity: base?.packedQuantity ?? null,
        checked: raw.packed === true,
        unitGrams: base?.unitGrams ?? null,
        bagId: base?.bagId ?? null,
        isPrivate: base?.isPrivate ?? false,
        ownerId: base?.ownerId ?? null,
        recipientIds: base?.recipientIds ?? [],
        placeholder: false,
      },
    ];
  });
  const { groups, moreGroups } = packingGroups(card, items, {
    groupBy: 'category',
    bagIds: [],
    rowOf: (item) => itemRow(card, item),
  });
  const category = clipped(recordOf(root.packing_link).category, 200);
  const progress = { packed: items.filter((item) => item.checked).length, total: items.length };
  return packingCard({ type: 'tour', placeId, name, category }, 'category', [], groups, { moreGroups, progress });
}
