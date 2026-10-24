import type {
  VacayCard,
  VacayCardBalance,
  VacayCardDay,
  VacayCardHoliday,
  VacayCardPerson,
  VacayCardProposal,
} from '@trek/shared';

import { localDateStr, monthLead } from '../../../../vacay/monthGrid';
import type { ChangeItem } from '../../assistantParts';

/**
 * The pure side of the vacation cards: several cards of one answer or one
 * change card read as one calendar, where each held day stands and in which
 * state, the days left before and after the chosen changes, and the cells of
 * a month. The views only draw what this works out.
 */

export type CardMonth = VacayCard['months'][number];

/** How large the cells are: the narrow window, the wide one, and the phone, where a cell takes a finger. */
export type CellSize = 'compact' | 'roomy' | 'phone';

/** Where a held day stands: waiting (taken in or left out), being applied, applied, failed, or off the table. */
type ProposalState = 'pending' | 'excluded' | 'applying' | 'applied' | 'failed' | 'off';

export interface PlacedProposal {
  toolCallId: string;
  proposal: VacayCardProposal;
  state: ProposalState;
  /** The same day of the same person is held twice in this card, so the two cancel out. */
  twice: boolean;
}

/** Everything the cards of one block show, merged. */
export interface VacayView {
  months: CardMonth[];
  weekStart: 0 | 1;
  weekendDays: number[];
  people: VacayCardPerson[];
  days: VacayCardDay[];
  company: VacayCard['company'];
  holidays: VacayCardHoliday[];
  tripDates: ReadonlySet<string>;
  balances: VacayCardBalance[];
  otherDays: number;
}

/** One person's days left in one leave year, before and after the changes that count. */
export interface BalanceLine {
  personId: number;
  year: number;
  total: number;
  /** What was carried over into the year: the allowance alone is `total - carried`. */
  carried: number;
  /** The total a new allowance gives, while that change counts. */
  totalAfter: number | null;
  used: number;
  comp: number;
  /** What the changes that count add to the used days; negative when they give days back. */
  delta: number;
}

/** The most months one strip shows. */
const MAX_MONTHS = 12;

export function monthKey(month: CardMonth): string {
  return `${month.year}-${String(month.month).padStart(2, '0')}`;
}

function byKey<T>(rows: readonly T[], key: (row: T) => string): T[] {
  return [...new Map(rows.map((row) => [key(row), row])).values()];
}

/** The cards of one block as one calendar: months in order, a day or a holiday once, the last card's word winning. */
export function mergeVacayCards(cards: readonly VacayCard[]): VacayView {
  const first = cards[0];
  const months = byKey(
    cards.flatMap((card) => card.months),
    monthKey
  )
    .sort((a, b) => monthKey(a).localeCompare(monthKey(b)))
    .slice(0, MAX_MONTHS);
  return {
    months,
    weekStart: first?.weekStart ?? 1,
    weekendDays: first?.weekendDays ?? [0, 6],
    people: byKey(
      cards.flatMap((card) => card.people),
      (person) => String(person.id)
    ),
    days: byKey(
      cards.flatMap((card) => card.days),
      (day) => `${day.date}:${day.personId}`
    ),
    company: byKey(
      cards.flatMap((card) => card.company),
      (row) => row.date
    ),
    holidays: byKey(
      cards.flatMap((card) => card.holidays),
      (holiday) => `${holiday.date}:${holiday.name}`
    ),
    tripDates: new Set(cards.flatMap((card) => card.tripDates)),
    balances: byKey(
      cards.flatMap((card) => card.balances),
      (balance) => `${balance.personId}:${balance.year}`
    ),
    otherDays: Math.max(0, ...cards.map((card) => card.otherDays)),
  };
}

/** Where a change stands, with the user's choice of the waiting ones. */
function proposalState(item: ChangeItem, excluded: ReadonlySet<string>): ProposalState {
  if (item.state === 'pending') return excluded.has(item.toolCallId) ? 'excluded' : 'pending';
  if (item.state === 'applying' || item.state === 'applied' || item.state === 'failed') return item.state;
  return 'off';
}

/** Whether a change in this state counts for the days left: chosen, on its way, or done. */
function counts(state: ProposalState): boolean {
  return state === 'pending' || state === 'applying' || state === 'applied';
}

/** The vacation cards among the change rows. */
export function vacayCardsOf(items: readonly ChangeItem[]): Array<{ item: ChangeItem; card: VacayCard }> {
  return items.flatMap((item) => (item.card?.kind === 'vacay' ? [{ item, card: item.card }] : []));
}

/** The day a held change is about: one person's day, or the plan's company holiday that day. */
function dayKeyOf(entry: PlacedProposal): string {
  return `${entry.proposal.date}:${entry.proposal.personId ?? 'company'}`;
}

/** What a held change makes of its day: its kind and size. */
function sizeKeyOf(entry: PlacedProposal): string {
  return `${entry.proposal.kind}:${entry.proposal.fraction}`;
}

/** The held days of the rows, each with its state, and which of them name the same day twice. */
export function placedProposals(items: readonly ChangeItem[], excluded: ReadonlySet<string>): PlacedProposal[] {
  const placed = vacayCardsOf(items).flatMap(({ item, card }) =>
    card.proposal
      ? [{ toolCallId: item.toolCallId, proposal: card.proposal, state: proposalState(item, excluded), twice: false }]
      : []
  );
  const seen = new Map<string, number>();
  for (const entry of placed) {
    if (entry.state !== 'off') seen.set(dayKeyOf(entry), (seen.get(dayKeyOf(entry)) ?? 0) + 1);
  }
  return placed.map((entry) => ({ ...entry, twice: entry.state !== 'off' && (seen.get(dayKeyOf(entry)) ?? 0) > 1 }));
}

/**
 * The changes to the used days of the held days that count. Each day counts
 * once: the toggles were all foreseen from the same calendar, so the same day
 * held twice the same way takes it and clears it again (the pair cancels),
 * and otherwise the first of them says what happens to the day.
 */
function countedDeltas(placed: readonly PlacedProposal[]): VacayCardProposal['deltas'] {
  const days = new Map<string, PlacedProposal[]>();
  for (const entry of placed.filter((candidate) => counts(candidate.state))) {
    days.set(dayKeyOf(entry), [...(days.get(dayKeyOf(entry)) ?? []), entry]);
  }
  return [...days.values()].flatMap((held) => {
    const [first] = held;
    if (!first) return [];
    const same = held.every((entry) => sizeKeyOf(entry) === sizeKeyOf(first));
    return same && held.length % 2 === 0 ? [] : first.proposal.deltas;
  });
}

/**
 * The days left per person and year: the balances the cards carry, the held
 * days that count added to the used days, and a new allowance that counts as
 * the total it gives.
 */
export function balanceLines(
  view: VacayView,
  placed: readonly PlacedProposal[],
  allowances: ReadonlyMap<string, number> = new Map()
): BalanceLine[] {
  const deltas = countedDeltas(placed);
  return view.balances.map((balance) => {
    const key = `${balance.personId}:${balance.year}`;
    const delta = deltas
      .filter((change) => `${change.personId}:${change.year}` === key)
      .reduce((sum, change) => sum + change.days, 0);
    return {
      personId: balance.personId,
      year: balance.year,
      total: balance.total,
      carried: balance.carried ?? 0,
      totalAfter: allowances.get(key) ?? null,
      used: balance.used,
      comp: balance.comp,
      delta,
    };
  });
}

/** The totals the new allowances of the rows give, by person and year, while each counts. */
export function allowancesOf(items: readonly ChangeItem[], excluded: ReadonlySet<string>): Map<string, number> {
  const found = new Map<string, number>();
  for (const { item, card } of vacayCardsOf(items)) {
    if (card.proposal || !counts(proposalState(item, excluded))) continue;
    for (const balance of card.balances) {
      if (balance.totalAfter !== null) found.set(`${balance.personId}:${balance.year}`, balance.totalAfter);
    }
  }
  return found;
}

/** What a line comes to: the days left before and after, and how far past the allowance it would go. */
export function lineFigures(line: BalanceLine): { leftNow: number; leftAfter: number; over: number } {
  const total = line.totalAfter ?? line.total;
  const leftAfter = total - (line.used + line.delta);
  return { leftNow: line.total - line.used, leftAfter, over: Math.max(0, -leftAfter) };
}

/** Whether the lines need their year named: two years in one card, or a year that is not this one. */
export function namesYear(lines: readonly BalanceLine[], today: string): boolean {
  const years = new Set(lines.map((line) => line.year));
  return years.size > 1 || [...years].some((year) => String(year) !== today.slice(0, 4));
}

/**
 * A held day that starts left out: one the planner would refuse, or leave
 * where no leave is needed (a whole company holiday, a public holiday). The
 * user takes it in with one tap.
 */
export function startsExcluded(card: VacayCard): boolean {
  const proposal = card.proposal;
  if (!proposal) return false;
  if (proposal.outcome === 'blocked') return true;
  const free = proposal.notes.includes('companyHoliday') || proposal.notes.includes('publicHoliday');
  return proposal.outcome === 'add' && proposal.personId !== null && free;
}

export interface DayCell {
  date: string;
  day: number;
  weekend: boolean;
  today: boolean;
  entries: VacayCardDay[];
  /** A company holiday that day: 1 whole, 0.5 half. */
  company: number | null;
  holiday: VacayCardHoliday | null;
  trip: boolean;
  proposals: PlacedProposal[];
}

/** The cells of a month, empty ones first for the days before the 1st. */
export function monthCells(
  view: VacayView,
  month: CardMonth,
  placed: readonly PlacedProposal[],
  today: string
): Array<DayCell | null> {
  const lead = monthLead(month.year, month.month - 1, view.weekStart);
  const length = new Date(month.year, month.month, 0).getDate();
  const cells: Array<DayCell | null> = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= length; day++) {
    const date = localDateStr(month.year, month.month - 1, day);
    cells.push({
      date,
      day,
      weekend: view.weekendDays.includes(new Date(month.year, month.month - 1, day).getDay()),
      today: date === today,
      entries: view.days.filter((entry) => entry.date === date),
      company: view.company.find((row) => row.date === date)?.fraction ?? null,
      holiday: view.holidays.find((holiday) => holiday.date === date) ?? null,
      trip: view.tripDates.has(date),
      proposals: placed.filter((entry) => entry.proposal.date === date),
    });
  }
  return cells;
}

/** Today in the user's time zone, as the planner writes a date. */
export function todayStr(now = new Date()): string {
  return localDateStr(now.getFullYear(), now.getMonth(), now.getDate());
}
