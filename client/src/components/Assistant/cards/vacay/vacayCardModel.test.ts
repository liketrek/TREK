/**
 * FE-AI-VACAY-001 to FE-AI-VACAY-007
 *
 * The pure side of the vacation cards: several cards read as one calendar,
 * where each held day stands, the days left before and after the chosen
 * changes, which days start left out, the cells of a month and their look,
 * and where the card opens Vacay.
 */
import type { VacayCard, VacayCardProposal } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import type { ChangeItem } from '../../assistantParts';
import {
  allowancesOf,
  balanceLines,
  lineFigures,
  mergeVacayCards,
  monthCells,
  namesYear,
  placedProposals,
  startsExcluded,
} from './vacayCardModel';
import { cellLook, entriesFill } from './vacayCellLook';
import { VACAY_LOOK, vacayPathOf, vacayYearOf } from './vacayLook';

const proposal = (over: Partial<VacayCardProposal> = {}): VacayCardProposal => ({
  date: '2026-10-27',
  personId: 7,
  kind: 'vacation',
  fraction: 1,
  outcome: 'add',
  before: null,
  periodYear: 2026,
  notes: [],
  deltas: [{ personId: 7, year: 2026, days: 1 }],
  ...over,
});

const BALANCE = {
  personId: 7,
  year: 2026,
  total: 30,
  used: 28,
  comp: 0,
  totalAfter: null,
  windowStart: '2026-01-01',
  windowEnd: '2027-01-01',
};

const card = (over: Partial<VacayCard> = {}): VacayCard => ({
  kind: 'vacay',
  months: [{ year: 2026, month: 10 }],
  weekStart: 1,
  weekendDays: [0, 6],
  people: [
    { id: 7, name: 'Ana', avatarKey: null, color: '#6366f1' },
    { id: 8, name: 'Ben', avatarKey: null, color: null },
  ],
  days: [{ date: '2026-10-26', personId: 7, fraction: 1, kind: 'vacation' }],
  company: [],
  holidays: [],
  tripDates: ['2026-10-28'],
  proposal: proposal(),
  balances: [BALANCE],
  otherDays: 0,
  ...over,
});

/** The held days of a cell: each row's state with its day. */
type HeldStates = Array<[ChangeItem['state'], VacayCardProposal]>;

const item = (id: string, state: ChangeItem['state'], vacay: VacayCard): ChangeItem => ({
  toolCallId: id,
  preview: null,
  applied: null,
  state,
  card: vacay,
});

describe('vacayCardModel', () => {
  it('FE-AI-VACAY-001: cards of one block read as one calendar, months in order and each day once', () => {
    const view = mergeVacayCards([
      card({ months: [{ year: 2026, month: 11 }], otherDays: 2 }),
      card({ days: [{ date: '2026-10-26', personId: 7, fraction: 0.5, kind: 'vacation' }], otherDays: 1 }),
    ]);
    expect(view.months).toEqual([
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
    ]);
    expect(view.days).toEqual([{ date: '2026-10-26', personId: 7, fraction: 0.5, kind: 'vacation' }]);
    expect(view.balances).toHaveLength(1);
    expect(view.otherDays).toBe(2);
    expect(view.tripDates.has('2026-10-28')).toBe(true);
    expect(mergeVacayCards([])).toMatchObject({ months: [], weekStart: 1, weekendDays: [0, 6], otherDays: 0 });
  });

  it('FE-AI-VACAY-002: a held day stands where its row stands, and the same day held twice is flagged', () => {
    const excluded = new Set(['c2']);
    const placed = placedProposals(
      [
        item('c1', 'pending', card()),
        item('c2', 'pending', card()),
        item('c3', 'discarded', card({ proposal: proposal({ date: '2026-10-29' }) })),
        item('c4', 'applied', card({ proposal: null })),
      ],
      excluded
    );
    expect(placed.map((entry) => [entry.toolCallId, entry.state, entry.twice])).toEqual([
      ['c1', 'pending', true],
      ['c2', 'excluded', true],
      ['c3', 'off', false],
    ]);
  });

  it('FE-AI-VACAY-003: the days left count the chosen, applying and applied changes, and a new allowance', () => {
    const halfBack = [{ personId: 7, year: 2026, days: -0.5 }];
    const giveBack = proposal({ date: '2026-10-30', outcome: 'remove', deltas: halfBack });
    const items = [
      item('c1', 'pending', card()),
      item('c2', 'pending', card({ proposal: proposal({ date: '2026-10-28' }) })),
      item('c3', 'failed', card({ proposal: proposal({ date: '2026-10-29' }) })),
      item('c4', 'applied', card({ proposal: giveBack })),
    ];
    const view = mergeVacayCards(items.map((entry) => entry.card as VacayCard));
    const [line] = balanceLines(view, placedProposals(items, new Set()));
    expect(line).toMatchObject({ personId: 7, year: 2026, used: 28, delta: 1.5, totalAfter: null });
    expect(line && lineFigures(line)).toEqual({ leftNow: 2, leftAfter: 0.5, over: 0 });
    const [without] = balanceLines(view, placedProposals(items, new Set(['c1', 'c2'])));
    expect(without?.delta).toBe(-0.5);

    const allowance = card({
      proposal: null,
      months: [],
      balances: [{ ...BALANCE, totalAfter: 26 }],
    });
    const raised = allowancesOf([...items, item('c5', 'pending', allowance)], new Set());
    expect(raised.get('7:2026')).toBe(26);
    const [tight] = balanceLines(view, placedProposals(items, new Set()), raised);
    expect(tight && lineFigures(tight)).toEqual({ leftNow: 2, leftAfter: -3.5, over: 3.5 });
    expect(allowancesOf([item('c5', 'pending', allowance)], new Set(['c5'])).size).toBe(0);

    // The same day held twice the same way is taken and cleared again: it counts for nothing.
    const one = mergeVacayCards([card()]);
    const twins = [item('t1', 'pending', card()), item('t2', 'pending', card())];
    expect(balanceLines(one, placedProposals(twins, new Set()))[0]?.delta).toBe(0);
    // Held twice in two sizes, the first says what happens to the day, and it counts once.
    const halfDay = proposal({ fraction: 0.5, deltas: [{ personId: 7, year: 2026, days: 0.5 }] });
    const sizes = [item('t1', 'pending', card()), item('t3', 'pending', card({ proposal: halfDay }))];
    expect(balanceLines(one, placedProposals(sizes, new Set()))[0]?.delta).toBe(1);
    // One of the pair left out: the other counts in full.
    expect(balanceLines(one, placedProposals(twins, new Set(['t2'])))[0]?.delta).toBe(1);
  });

  it('FE-AI-VACAY-004: a refused day, or one with no leave needed, starts left out', () => {
    expect(startsExcluded(card({ proposal: proposal({ outcome: 'blocked', notes: ['weekendBlocked'] }) }))).toBe(true);
    expect(startsExcluded(card({ proposal: proposal({ notes: ['publicHoliday'] }) }))).toBe(true);
    expect(startsExcluded(card({ proposal: proposal({ notes: ['companyHoliday'] }) }))).toBe(true);
    expect(startsExcluded(card({ proposal: proposal({ notes: ['weekend'] }) }))).toBe(false);
    expect(startsExcluded(card({ proposal: proposal({ outcome: 'remove', notes: ['publicHoliday'] }) }))).toBe(false);
    const company = proposal({ personId: null, kind: 'company', notes: ['publicHoliday'] });
    expect(startsExcluded(card({ proposal: company }))).toBe(false);
    expect(startsExcluded(card({ proposal: null }))).toBe(false);
  });

  it('FE-AI-VACAY-005: a month starts on its weekday, marks the weekend, the trip, holidays and the held day', () => {
    const holidays = [{ date: '2026-10-03', name: 'Unity Day', color: null }];
    const view = mergeVacayCards([card({ holidays, company: [{ date: '2026-10-30', fraction: 0.5 }] })]);
    const placed = placedProposals([item('c1', 'pending', card())], new Set());
    const cells = monthCells(view, { year: 2026, month: 10 }, placed, '2026-10-26');
    // 1 October 2026 is a Thursday: three empty cells in a week that starts on Monday.
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells.filter(Boolean)).toHaveLength(31);
    const day = (date: string) => cells.find((cell) => cell?.date === date);
    expect(day('2026-10-03')).toMatchObject({ weekend: true, holiday: { name: 'Unity Day' } });
    expect(day('2026-10-26')).toMatchObject({ today: true, entries: [{ personId: 7 }] });
    expect(day('2026-10-27')?.proposals.map((entry) => entry.toolCallId)).toEqual(['c1']);
    expect(day('2026-10-28')?.trip).toBe(true);
    expect(day('2026-10-30')?.company).toBe(0.5);
    const sunday = monthCells({ ...view, weekStart: 0 }, { year: 2026, month: 10 }, [], '2026-10-01');
    expect(sunday.slice(0, 4)).toEqual([null, null, null, null]);
  });

  it('FE-AI-VACAY-006: a cell wears the planner colours and the state of its held day', () => {
    const view = mergeVacayCards([card({ company: [{ date: '2026-10-22', fraction: 1 }] })]);
    const cellOf = (date: string, held: HeldStates, excluded = new Set<string>()) => {
      const rows = held.map(([state, day], index) => item(`c${index}`, state, card({ proposal: day })));
      const cells = monthCells(view, { year: 2026, month: 10 }, placedProposals(rows, excluded), '2026-10-26');
      const cell = cells.find((entry) => entry?.date === date);
      if (!cell) throw new Error(`no cell for ${date}`);
      return cellLook(view, cell);
    };
    const take = cellOf('2026-10-27', [['pending', proposal()]]);
    expect(take.className).toContain('outline-accent');
    expect(take.style.background).toContain('#6366f1');
    expect(cellOf('2026-10-27', [['pending', proposal()]], new Set(['c0'])).className).toContain('outline-edge');
    const giveBack = cellOf('2026-10-26', [['pending', proposal({ date: '2026-10-26', outcome: 'remove' })]]);
    expect(giveBack.className).toContain('line-through');
    expect(giveBack.className).toContain('ring-content');
    expect(cellOf('2026-10-27', [['applying', proposal()]]).className).toContain('animate-pulse');
    expect(cellOf('2026-10-27', [['failed', proposal()]]).className).toContain('outline-danger');
    expect(cellOf('2026-10-22', []).className).toContain('bg-warning-soft');
    expect(cellOf('2026-10-27', [['pending', proposal({ fraction: 0.5 })]]).half).toBe(true);
    expect(entriesFill(view, [])).toBeNull();
    expect(
      entriesFill(view, [
        { date: '2026-10-26', personId: 7, fraction: 1, kind: 'vacation' },
        { date: '2026-10-26', personId: 8, fraction: 1, kind: 'comp' },
      ])
    ).toContain('linear-gradient(90deg');
  });

  it('FE-AI-VACAY-007: the card opens Vacay on its leave year, and names the year only where it helps', () => {
    expect(vacayYearOf(card())).toBe(2026);
    expect(vacayPathOf(card({ proposal: proposal({ periodYear: 2025 }) }))).toBe('/vacay?year=2025');
    expect(vacayPathOf(card({ proposal: null, balances: [], months: [] }))).toBe('/vacay');
    expect(vacayPathOf(null)).toBe('/vacay');
    // A read of the days off opens the leave year it asked for, not the year of its first month.
    const asked = card({ proposal: null, balances: [], months: [{ year: 2027, month: 2 }], year: 2026 });
    expect(vacayPathOf(asked)).toBe('/vacay?year=2026');
    const applied = { toolCallId: 'c1', entity: 'vacay' as const, ids: [], dayId: null, undoUntil: null };
    expect(VACAY_LOOK.entities.vacay.open(applied, card())).toEqual({ kind: 'page', path: '/vacay?year=2026' });
    const line = { personId: 7, year: 2026, total: 30, carried: 0, totalAfter: null, used: 2, comp: 0, delta: 0 };
    expect(namesYear([line], '2026-10-01')).toBe(false);
    expect(namesYear([line, { ...line, year: 2027 }], '2026-10-01')).toBe(true);
    expect(namesYear([line], '2027-01-05')).toBe(true);
  });
});
