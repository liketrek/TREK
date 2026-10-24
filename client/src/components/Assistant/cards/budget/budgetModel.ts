import type {
  CardExpense,
  CardMoney,
  CostPerPersonCard,
  ExpensesCard,
  ExpenseSplit,
  PaymentsCard,
  SettlementCard,
  TrekCardKind,
  TrekCardOf,
} from '@trek/shared';

import type { ChangeItem } from '../../assistantParts';
import type { CardEntry, EntityTarget } from '../cardTypes';

/**
 * The pure side of the costs' cards: how the cards of one answer come
 * together (pages of the expense list read as one list where they meet, the
 * last settle up wins), how a split is drawn (a badge per person, or a stack and the
 * share per person for an even split of many), what a run of new expenses
 * adds up to, and where each card opens.
 */

/** The Costs tab, on one expense when there is one. */
export function costsTarget(expenseId: number | null = null): EntityTarget {
  return expenseId === null
    ? { kind: 'tab', tab: 'finanzplan' }
    : { kind: 'tab', tab: 'finanzplan', params: { expense: String(expenseId) } };
}

function cardsOf<K extends TrekCardKind>(entries: readonly CardEntry[], kind: K): TrekCardOf<K>[] {
  return entries.flatMap((entry) => (entry.card.kind === kind ? [entry.card as TrekCardOf<K>] : []));
}

/**
 * The expense cards of one answer as one list: the pages in the list's order,
 * each expense once, and only as far as they follow on from each other. A
 * page past a gap would read as if its expenses came next, so it and the
 * ones after it are counted with the rest instead.
 */
export function mergeExpenses(entries: readonly CardEntry[]): ExpensesCard | null {
  const cards = cardsOf(entries, 'expenses').sort((a, b) => a.offset - b.offset);
  const first = cards[0];
  if (!first) return null;
  const seen = new Set<number>();
  const rows: CardExpense[] = [];
  let reach = first.offset;
  for (const card of cards) {
    if (card.offset > reach) break;
    for (const row of card.rows) {
      if (row.id !== null && seen.has(row.id)) continue;
      if (row.id !== null) seen.add(row.id);
      rows.push(row);
    }
    reach = Math.max(reach, card.offset + card.rows.length);
  }
  // Each page counts the whole list: what is left out is that, less what the pages show.
  const all = Math.max(...cards.map((card) => card.rows.length + card.more));
  return { ...first, rows, more: Math.max(0, all - rows.length) };
}

/** The payment cards of one answer as one list, each payment once. */
export function mergePayments(entries: readonly CardEntry[]): PaymentsCard | null {
  const cards = cardsOf(entries, 'payments');
  const first = cards[0];
  if (!first) return null;
  const seen = new Set<number>();
  const rows = cards
    .flatMap((card) => card.rows)
    .filter((row) => {
      if (row.id === null) return true;
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
  return { ...first, rows, more: Math.max(...cards.map((card) => card.more)) };
}

/** Settle up and the share per traveller answer once: the latest card of the answer is the one shown. */
export function latestOf(entries: readonly CardEntry[], kind: 'settlement'): SettlementCard | null;
export function latestOf(entries: readonly CardEntry[], kind: 'costPerPerson'): CostPerPersonCard | null;
export function latestOf(
  entries: readonly CardEntry[],
  kind: 'settlement' | 'costPerPerson'
): SettlementCard | CostPerPersonCard | null {
  const cards = cardsOf(entries, kind);
  return cards[cards.length - 1] ?? null;
}

/** How many people of a split get a badge of their own before an even one reads as a stack. */
export function chipLimit(density: 'compact' | 'roomy' | undefined): number {
  return density === 'roomy' ? 6 : 4;
}

/** How many faces a stack shows. */
export function stackLimit(density: 'compact' | 'roomy' | undefined): number {
  return density === 'roomy' ? 5 : 3;
}

/**
 * Whether a split is drawn as a badge per person: an uneven one always, one
 * a change is about someone in (a paid tick, someone joining) too, so that
 * person stands out, and an even one while it is small.
 */
export function sharesAsChips(
  row: Pick<CardExpense, 'split' | 'shares' | 'moreShares' | 'highlight'>,
  limit: number
): boolean {
  return row.split === 'custom' || row.highlight.length > 0 || row.shares.length + row.moreShares <= limit;
}

/** The words of each way a split can go. A table, so each key is named where it is read. */
export const SPLIT_LABEL: Readonly<Record<ExpenseSplit, { labelKey: string }>> = {
  equal: { labelKey: 'assistant.card.budget.split.equal' },
  custom: { labelKey: 'assistant.card.budget.split.custom' },
  none: { labelKey: 'assistant.card.budget.split.none' },
};

/**
 * What the new expenses of a run add up to, the ones still waiting that the
 * user includes: two or more, all in one currency. A change to an expense
 * already there (an update, a paid tick, who shares it) adds no money, nor
 * does one going away, so neither counts.
 */
export function togetherOf(items: readonly ChangeItem[], excluded: ReadonlySet<string>): CardMoney | null {
  const amounts = items.flatMap((item) => {
    const card = item.card;
    if (item.state !== 'pending' || excluded.has(item.toolCallId) || card?.kind !== 'expenses') return [];
    return card.rows.filter((row) => row.change === 'new').map((row) => row.amount);
  });
  const currency = amounts[0]?.currency;
  if (amounts.length < 2 || !currency || amounts.some((amount) => amount.currency !== currency)) return null;
  const cents = amounts.reduce((sum, amount) => sum + Math.round(amount.amount * 100), 0);
  return { amount: cents / 100, currency };
}

/** How far a balance reaches on its bar, against the largest one; half the bar is the most. */
export function balanceShare(balance: number, largest: number): number {
  return largest <= 0 ? 0 : Math.min(50, (Math.abs(balance) / largest) * 50);
}
