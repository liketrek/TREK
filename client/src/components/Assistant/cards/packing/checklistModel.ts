import type {
  PackingCardGroup,
  PackingCardItem,
  PackingListCard,
  TodoCardGroup,
  TodoCardItem,
  TodoListCard,
} from '@trek/shared';
import { Check, Circle, CircleDashed, type LucideIcon, PencilLine, Plus, Trash2, Users } from 'lucide-react';

import { KAT_COLORS as PACKING_COLORS } from '../../../Packing/packingListPanel.constants';
import { katColor as packingHashColor } from '../../../Packing/packingListPanel.helpers';
import { KAT_COLORS as TODO_COLORS, katColor as todoHashColor } from '../../../Todo/todoListModel';
import type { Tone } from '../parts/assistantTones';

/**
 * The pure side of the packing and to-do cards: the colour a group's dot
 * takes (the list's own, by the slot the server read), consecutive answer
 * cards of one list folded into one, and which change cards a run of
 * checklist rows can take. No React here, so the look and the views read the
 * same rules.
 */

/**
 * A category's colour as its list shows it: the list's colour at its slot,
 * or the list's own fallback by name for a category the card had no slot for.
 */
function colorOf(
  slot: number | null,
  name: string,
  palette: readonly string[],
  fallback: (name: string) => string
): string {
  return slot === null ? fallback(name) : (palette[slot % palette.length] ?? fallback(name));
}

/** A packing category's colour, as the packing list draws it. */
export const packingColorOf = (slot: number | null, name: string) =>
  colorOf(slot, name, PACKING_COLORS, (n) => packingHashColor(n));

/** A to-do list's colour, as the to-do panel draws it. */
export const todoColorOf = (slot: number | null, name: string) =>
  colorOf(slot, name, TODO_COLORS, (n) => todoHashColor(n, []));

/** Rows of a card, across its groups. */
export function rowCount(card: PackingListCard | TodoListCard): number {
  return card.groups.reduce((sum, group) => sum + group.items.length, 0);
}

/**
 * Whether a change card can join a run of checklist rows: it holds exactly
 * one row of the trip's list. An import, a template, a bag or a category's
 * people keep their own row with the card under it.
 */
export function isRunnable(card: PackingListCard | TodoListCard): boolean {
  if (card.kind === 'packingList' && card.source.type !== 'trip') return false;
  return card.groups.length === 1 && rowCount(card) === 1;
}

/** A group's identity across cards: its category or its bag. */
function packingGroupKey(group: PackingCardGroup): string {
  return group.key.by === 'bag' ? `bag:${group.key.bagKey ?? ''}` : `category:${group.key.name ?? ''}`;
}

/** Rows joined by id, a later card's row replacing an earlier one; rows without an id are all kept. */
function joinRows<T extends { id?: number | null }>(earlier: readonly T[], later: readonly T[]): T[] {
  const ids = new Set(later.flatMap((row) => (typeof row.id === 'number' ? [row.id] : [])));
  return [...earlier.filter((row) => typeof row.id !== 'number' || !ids.has(row.id)), ...later];
}

/** Whether a card shows every row it counts, so its figures can be counted again from its rows. */
function isComplete(card: PackingListCard): boolean {
  return card.moreGroups === 0 && card.groups.every((group) => group.items.length === group.count);
}

/**
 * Two cards of one source and grouping read as one. Where both show every
 * row, the joined rows are counted again; otherwise only cards that agree on
 * how much is packed join (two reads of the same list), so an "open" read
 * and a "packed" read never show one of their figures for both.
 */
function canMerge(a: PackingListCard, b: PackingListCard): boolean {
  if (a.groupBy !== b.groupBy || JSON.stringify(a.source) !== JSON.stringify(b.source)) return false;
  return (isComplete(a) && isComplete(b)) || JSON.stringify(a.progress) === JSON.stringify(b.progress);
}

function mergeTwoPacking(a: PackingListCard, b: PackingListCard): PackingListCard {
  const recount = isComplete(a) && isComplete(b);
  const groups = new Map<string, PackingCardGroup>();
  for (const group of [...a.groups, ...b.groups]) {
    const key = packingGroupKey(group);
    const before = groups.get(key);
    const items = before ? joinRows<PackingCardItem>(before.items, group.items) : group.items;
    const counts = recount ? { count: items.length, packed: items.filter((row) => row.checked).length } : {};
    groups.set(key, { ...group, ...counts, items });
  }
  const merged = [...groups.values()];
  const counted = {
    packed: merged.reduce((sum, group) => sum + group.packed, 0),
    total: merged.reduce((sum, group) => sum + group.count, 0),
  };
  const bags = new Map([...a.bags, ...b.bags].map((bag) => [bag.key, bag]));
  return {
    ...b,
    progress: recount && (a.progress || b.progress) ? counted : (b.progress ?? a.progress),
    bags: [...bags.values()],
    groups: merged,
    moreGroups: Math.max(a.moreGroups, b.moreGroups),
  };
}

/**
 * Consecutive answer cards of a packing list folded where they read as one
 * list (the same source and grouping); any other card stays a card of its own.
 */
export function mergePackingCards(cards: readonly PackingListCard[]): PackingListCard[] {
  const out: PackingListCard[] = [];
  for (const card of cards) {
    const last = out[out.length - 1];
    if (last && canMerge(last, card)) out[out.length - 1] = mergeTwoPacking(last, card);
    else out.push(card);
  }
  return out;
}

/** Consecutive to-do answer cards folded into one list. */
export function mergeTodoCards(cards: readonly TodoListCard[]): TodoListCard[] {
  const first = cards[0];
  if (!first) return [];
  const groups = new Map<string, TodoCardGroup>();
  for (const group of cards.flatMap((card) => card.groups)) {
    const key = group.category ?? '';
    const before = groups.get(key);
    groups.set(key, before ? { ...group, items: joinRows<TodoCardItem>(before.items, group.items) } : group);
  }
  const last = cards[cards.length - 1] ?? first;
  return [
    {
      ...last,
      progress: last.progress ?? first.progress,
      groups: [...groups.values()],
      moreGroups: Math.max(...cards.map((card) => card.moreGroups)),
    },
  ];
}

/** What a change does to a checklist row: a row of a packing list or of the to-dos. */
export type RowChange = PackingCardItem['change'] | TodoCardItem['change'];

/** The tile in front of a row of a change run: what the change does, in its tone. */
export const ROW_GLYPH: Readonly<Record<RowChange, { Icon: LucideIcon; tone: Tone }>> = {
  none: { Icon: Circle, tone: 'info' },
  add: { Icon: Plus, tone: 'success' },
  update: { Icon: PencilLine, tone: 'info' },
  check: { Icon: Check, tone: 'success' },
  uncheck: { Icon: CircleDashed, tone: 'info' },
  remove: { Icon: Trash2, tone: 'danger' },
  share: { Icon: Users, tone: 'info' },
};
