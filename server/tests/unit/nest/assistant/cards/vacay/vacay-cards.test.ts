/**
 * The vacation planner's cards: what a held day off looks up first, what it
 * would do to the day (taken, given back, changed, refused) and to the days
 * left, the company holiday and the new allowance, the applied card against
 * what the tool says it did, the way back from a toggled day while it is as
 * the change left it, and the answer cards of the planner's reads, each
 * checked against the card union.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import type { CardReader, PreviewContext, UndoSnapshot } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  changeCardOf,
  TOOL_CARDS,
  undoReadsOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { VACAY_CARDS } from '../../../../../../src/nest/assistant/cards/vacay';
import { loadDay, loadStats, type VacayLoaded } from '../../../../../../src/nest/assistant/cards/vacay/vacay-load';
import { entriesOf, holidaysOf, planOf, statsOf } from '../../../../../../src/nest/assistant/cards/vacay/vacay-reads';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { trekCardSchema, VACAY_CARD_MAX_DAYS, type AssistantChangePreview, type VacayCard } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const ANA = 7;
const BEN = 8;

const plan = (overrides: Record<string, unknown> = {}) => ({
  plan: {
    plan: {
      id: 1,
      block_weekends: false,
      weekend_days: '0,6',
      week_start: 1,
      company_holidays_enabled: true,
      holidays_enabled: true,
      holiday_calendars: [
        { type: 'public_holiday', region: 'DE-BY', color: '#ef4444' },
        { type: 'school_holiday', region: 'DE-BY', color: '#22c55e' },
      ],
      ...overrides,
    },
    users: [
      { id: ANA, username: 'Ana', email: 'ana@example.com', color: '#6366f1' },
      { id: BEN, username: 'ben@example.com', email: 'ben@example.com', color: 'red' },
    ],
  },
});

const entry = (user: number, date: string, fraction = 1, kind = 'vacation') => ({
  user_id: user,
  date,
  fraction,
  kind,
  person_name: user === ANA ? 'Ana' : 'ben@example.com',
  person_color: user === ANA ? '#6366f1' : 'red',
});

const ENTRIES = {
  entries: {
    entries: [
      entry(ANA, '2026-10-26'),
      entry(ANA, '2026-10-27', 0.5),
      entry(BEN, '2026-10-26', 1, 'comp'),
      entry(BEN, '2026-10-29'),
      entry(ANA, '2026-12-21'),
    ],
    companyHolidays: [
      { date: '2026-10-30', fraction: 0.5 },
      { date: '2026-10-22', fraction: 1 },
    ],
  },
};

const stat = (user: number, year: number, start = `${year}-01-01`, end = `${year + 1}-01-01`) => ({
  user_id: user,
  person_name: user === ANA ? 'Ana' : 'ben@example.com',
  person_color: '#6366f1',
  year,
  vacation_days: 28,
  carried_over: 2,
  total_available: 30,
  used: user === ANA ? 12.5 : 5,
  remaining: 0,
  comp_used: user === BEN ? 1 : 0,
  window_start: start,
  window_end: end,
});

const HOLIDAYS = {
  holidays: [
    { date: '2026-10-03', localName: 'Tag der Deutschen Einheit', global: true, counties: null },
    { date: '2026-11-01', localName: 'Allerheiligen', global: false, counties: ['DE-BW', 'DE-BY'] },
    { date: '2026-10-31', localName: 'Reformationstag', global: false, counties: ['DE-BB'] },
    { date: '2026-12-25', localName: 'Erster Weihnachtstag', global: true, counties: null },
  ],
};

/** A reader over fixed answers, counting what it was asked. */
function reader(values: Record<string, unknown>) {
  const calls: string[] = [];
  const read: CardReader = (tool, args = {}) => {
    const key = readKey(tool, args);
    calls.push(key);
    return Promise.resolve(key in values ? values[key] : null);
  };
  return { read, calls };
}

const CALENDAR_YEAR = {
  [readKey('get_vacay_plan')]: plan(),
  [readKey('get_vacay_stats', { year: 2026 })]: { stats: [stat(ANA, 2026), stat(BEN, 2026)] },
  [readKey('get_vacay_entries', { year: 2026 })]: ENTRIES,
  [readKey('list_holidays', { country: 'DE', year: 2026 })]: HOLIDAYS,
};

const trip = buildTripCard(
  1,
  ANA,
  {
    trip: { title: 'Lisbon', start_date: '2026-10-27', end_date: '2026-10-28' },
    days: [
      { id: 31, day_number: 1, date: '2026-10-27', assignments: [], notes: [] },
      { id: 32, day_number: 2, date: '2026-10-28', assignments: [], notes: [] },
    ],
  },
  null,
  null,
);
const ctx: PreviewContext = {
  card: trip,
  categories: new Map(),
  locale: 'en',
  today: '2026-10-01',
  airport: () => null,
};

async function loaded(values: Record<string, unknown> = CALENDAR_YEAR, args: Record<string, unknown> = {}) {
  const found = await loadDay({ date: '2026-10-28', ...args }, reader(values).read);
  if (!found) throw new Error('nothing loaded');
  return found;
}

function change(tool: string, args: Record<string, unknown>, found: unknown): VacayCard {
  const card = changeCardOf(tool, ctx, args, found);
  if (card?.kind !== 'vacay') throw new Error(`no vacation card for ${tool}`);
  return card;
}

const proposalOf = (args: Record<string, unknown>, found: VacayLoaded) =>
  change('toggle_vacay_entry', args, found).proposal;

describe('the lookup of a held vacation day', () => {
  it('ASTVAC-001: reads the plan, the days left, the logged days and the first calendar holidays, four reads', async () => {
    const { read, calls } = reader(CALENDAR_YEAR);
    const found = await loadDay({ date: '2026-10-28' }, read);
    expect(calls).toEqual(Object.keys(CALENDAR_YEAR));
    expect(found?.plan.calendars).toEqual([{ region: 'DE-BY', color: '#ef4444' }]);
    expect(found?.holidays.map((holiday) => holiday.name)).toEqual([
      'Tag der Deutschen Einheit',
      'Allerheiligen',
      'Erster Weihnachtstag',
    ]);
    expect(found?.entries).toHaveLength(5);
    expect(found?.company).toEqual([
      { date: '2026-10-30', fraction: 0.5 },
      { date: '2026-10-22', fraction: 1 },
    ]);
    // No day, no plan (the addon off): nothing to draw with, and no read for a missing day.
    const none = reader(CALENDAR_YEAR);
    expect(await loadDay({ date: '28.10.2026' }, none.read)).toBeNull();
    expect(none.calls).toEqual([]);
    expect(await loadDay({ date: '2026-10-28' }, reader({}).read)).toBeNull();
    // Holidays switched off in the plan: no calendar, no holiday read.
    const quiet = reader({ ...CALENDAR_YEAR, [readKey('get_vacay_plan')]: plan({ holidays_enabled: false }) });
    expect((await loadDay({ date: '2026-10-28' }, quiet.read))?.holidays).toEqual([]);
    expect(quiet.calls.some((call) => call.startsWith('list_holidays'))).toBe(false);
  });

  it('ASTVAC-002: a leave year that starts in April puts a March day in the year before', async () => {
    const fiscal = {
      [readKey('get_vacay_plan')]: plan(),
      [readKey('get_vacay_stats', { year: 2026 })]: { stats: [stat(ANA, 2026, '2026-04-01', '2027-04-01')] },
      [readKey('get_vacay_stats', { year: 2025 })]: { stats: [stat(ANA, 2025, '2025-04-01', '2026-04-01')] },
      [readKey('get_vacay_entries', { year: 2025 })]: { entries: { entries: [], companyHolidays: [] } },
    };
    const { read, calls } = reader(fiscal);
    const found = await loadDay({ date: '2026-03-10' }, read);
    expect(calls).toEqual(Object.keys(fiscal));
    if (!found) throw new Error('nothing loaded');
    const proposal = proposalOf({ date: '2026-03-10' }, found);
    expect(proposal).toMatchObject({
      outcome: 'add',
      periodYear: 2025,
      deltas: [{ personId: ANA, year: 2025, days: 1 }],
    });
    const card = change('toggle_vacay_entry', { date: '2026-03-10' }, found);
    expect(card.balances.map((balance) => balance.year)).toEqual([2025]);
    expect(card.holidays).toEqual([]);
  });

  it('ASTVAC-005: a leave year from 6 April reads a day of 3 April from the grid that shows it', async () => {
    // The grid of 2026 starts on 1 April, so the day is there although it counts in the leave year 2025.
    const uk = {
      [readKey('get_vacay_plan')]: plan(),
      [readKey('get_vacay_stats', { year: 2026 })]: { stats: [stat(ANA, 2026, '2026-04-06', '2027-04-06')] },
      [readKey('get_vacay_stats', { year: 2025 })]: { stats: [stat(ANA, 2025, '2025-04-06', '2026-04-06')] },
      [readKey('get_vacay_entries', { year: 2026 })]: { entries: { entries: [entry(ANA, '2026-04-03')] } },
    };
    const { read, calls } = reader(uk);
    const found = await loadDay({ date: '2026-04-03' }, read);
    expect(calls).toEqual(Object.keys(uk));
    if (!found) throw new Error('nothing loaded');
    expect(proposalOf({ date: '2026-04-03' }, found)).toMatchObject({
      outcome: 'remove',
      periodYear: 2025,
      deltas: [{ personId: ANA, year: 2025, days: -1 }],
    });
  });

  it('ASTVAC-006: people whose leave years split on the day give no lookup; a named person decides alone', async () => {
    const split = {
      [readKey('get_vacay_plan')]: plan(),
      [readKey('get_vacay_stats', { year: 2026 })]: {
        stats: [stat(ANA, 2026, '2026-04-01', '2027-04-01'), stat(BEN, 2026)],
      },
    };
    const { read, calls } = reader(split);
    // Whose grid the logged days come from is not known here, so an existing day could be missed.
    expect(await loadDay({ date: '2026-03-10' }, read)).toBeNull();
    expect(calls).toEqual(Object.keys(split));
    const sameMonth = {
      [readKey('get_vacay_plan')]: plan(),
      [readKey('get_vacay_stats', { year: 2026 })]: {
        stats: [stat(ANA, 2026, '2026-04-06', '2027-04-06'), stat(BEN, 2026)],
      },
      [readKey('get_vacay_entries', { year: 2026 })]: { entries: { entries: [] } },
      [readKey('list_holidays', { country: 'DE', year: 2026 })]: HOLIDAYS,
    };
    // Ben's year holds the day, so his toggle reads the holidays instead of Ana's year before.
    const named = reader(sameMonth);
    const found = await loadDay({ date: '2026-04-03', targetUserId: BEN }, named.read);
    expect(named.calls).toEqual(Object.keys(sameMonth));
    expect(found?.holidays).toHaveLength(3);
    expect(found?.stats.map((row) => row.year)).toEqual([2026, 2026]);
  });

  it('ASTVAC-003: a new allowance reads the days left of its year only', async () => {
    const { read, calls } = reader({ [readKey('get_vacay_stats', { year: 2027 })]: { stats: [stat(ANA, 2027)] } });
    expect(await loadStats({ year: 2027, vacationDays: 30 }, read)).toMatchObject({ stats: [{ personId: ANA }] });
    expect(calls).toEqual([readKey('get_vacay_stats', { year: 2027 })]);
    expect(await loadStats({ year: 1999 }, read)).toBeNull();
  });
});

describe('the readers of the planner tools', () => {
  it('ASTVAC-004: odd answers read safely: the usual weekend, half of any part day, no rows that name nobody', () => {
    const odd = planOf(plan({ weekend_days: '', week_start: 0, block_weekends: 1, company_holidays_enabled: 0 }));
    expect(odd).toMatchObject({ weekStart: 0, weekendDays: [0, 6], blockWeekends: true, companyOn: false });
    expect(planOf(plan({ weekend_days: '5,6,6,9' }))?.weekendDays).toEqual([5, 6]);
    // A value naming no real weekday is no weekend to the planner either, not its usual one.
    expect(planOf(plan({ weekend_days: '7' }))?.weekendDays).toEqual([]);
    expect(planOf(plan({ weekend_days: null }))?.weekendDays).toEqual([0, 6]);
    expect(planOf({ plan: { plan: {}, users: [] } })).toBeNull();
    const rows = [entry(ANA, '2026-10-05', 0.25), { user_id: 0, date: '2026-10-06' }];
    const logged = entriesOf({ entries: { entries: rows, companyHolidays: null } });
    expect(logged).toEqual({
      entries: [{ date: '2026-10-05', personId: ANA, fraction: 0.5, kind: 'vacation', person: expect.any(Object) }],
      company: [],
    });
    const stats = statsOf({ stats: [stat(ANA, 2026), { user_id: BEN, year: 2026 }] });
    expect(stats?.map((row) => row.personId)).toEqual([ANA]);
    expect(statsOf('no plan')).toBeNull();
    // A calendar for the whole country, where the country splits its holidays by region: none fit.
    expect(holidaysOf(HOLIDAYS, 'DE', null)).toEqual([]);
    expect(holidaysOf({ holidays: [{ date: '2026-05-01', name: 'Labour Day' }] }, 'PT', '#00aa00')).toEqual([
      { date: '2026-05-01', name: 'Labour Day', color: '#00aa00' },
    ]);
  });
});

describe('a held day off', () => {
  it('ASTVAC-010: takes a free day, gives back the same day, converts another size and keeps a comp day free', async () => {
    const found = await loaded();
    expect(proposalOf({ date: '2026-10-28' }, found)).toMatchObject({
      personId: ANA,
      outcome: 'add',
      before: null,
      periodYear: 2026,
      notes: [],
      deltas: [{ personId: ANA, year: 2026, days: 1 }],
    });
    expect(proposalOf({ date: '2026-10-26' }, found)).toMatchObject({ outcome: 'remove', deltas: [{ days: -1 }] });
    expect(proposalOf({ date: '2026-10-27' }, found)).toMatchObject({
      outcome: 'convert',
      before: { fraction: 0.5, kind: 'vacation' },
      deltas: [{ days: 0.5 }],
    });
    expect(proposalOf({ date: '2026-10-26', kind: 'comp' }, found)).toMatchObject({
      outcome: 'convert',
      kind: 'comp',
      deltas: [{ days: -1 }],
    });
    expect(proposalOf({ date: '2026-10-29', targetUserId: BEN, fraction: 0.5 }, found)).toMatchObject({
      personId: BEN,
      outcome: 'convert',
      deltas: [{ personId: BEN, days: -0.5 }],
    });
  });

  it('ASTVAC-011: a blocked weekend refuses, a counted one warns, and half a company holiday leaves half a day', async () => {
    const blocked = await loaded({ ...CALENDAR_YEAR, [readKey('get_vacay_plan')]: plan({ block_weekends: true }) });
    expect(proposalOf({ date: '2026-10-24' }, blocked)).toMatchObject({
      outcome: 'blocked',
      notes: ['weekendBlocked'],
      deltas: [{ days: 0 }],
    });
    const open = await loaded();
    expect(proposalOf({ date: '2026-10-24' }, open)).toMatchObject({ outcome: 'add', notes: ['weekend'] });
    expect(proposalOf({ date: '2026-10-03' }, open)?.notes).toEqual(['weekend', 'publicHoliday']);
    expect(proposalOf({ date: '2026-10-30' }, open)).toMatchObject({
      fraction: 0.5,
      notes: ['companyHalf'],
      deltas: [{ days: 0.5 }],
    });
    expect(proposalOf({ date: '2026-10-22' }, open)?.notes).toEqual(['companyHoliday']);
    expect(proposalOf({ date: '2026-10-28', targetUserId: 99 }, open)).toMatchObject({
      outcome: 'blocked',
      notes: ['notInPlan'],
      deltas: [],
    });
    // A target that is no id is refused by the tool, so the card does not fall back to the user's own day.
    expect(proposalOf({ date: '2026-10-28', targetUserId: 'ben' }, open)).toMatchObject({
      personId: ANA,
      outcome: 'blocked',
      notes: ['notInPlan'],
      deltas: [],
    });
  });

  it('ASTVAC-012: the card shows the month of the day, its people with the user first, and the leave before', async () => {
    const card = change('toggle_vacay_entry', { date: '2026-10-29', targetUserId: BEN }, await loaded());
    expect(trekCardSchema.parse(card)).toEqual(card);
    expect(card.months).toEqual([{ year: 2026, month: 10 }]);
    expect(card.people.map((person) => person.id)).toEqual([ANA, BEN]);
    expect(card.people[1]?.name).not.toContain('example.com');
    expect(card.people[1]?.color).toBeNull();
    expect(card.days.map((day) => day.date)).not.toContain('2026-12-21');
    expect(card.days).toContainEqual({ date: '2026-10-26', personId: BEN, fraction: 1, kind: 'comp' });
    expect(card.company).toHaveLength(2);
    expect(card.holidays).toEqual([{ date: '2026-10-03', name: 'Tag der Deutschen Einheit', color: '#ef4444' }]);
    expect(card.tripDates).toEqual(['2026-10-27', '2026-10-28']);
    expect(card.balances).toEqual([
      {
        personId: BEN,
        year: 2026,
        total: 30,
        carried: 2,
        used: 5,
        comp: 1,
        totalAfter: null,
        windowStart: '2026-01-01',
        windowEnd: '2027-01-01',
      },
    ]);
    expect(card).toMatchObject({ weekStart: 1, weekendDays: [0, 6], otherDays: 0 });
  });

  it('ASTVAC-013: the change card says what the toggle does; without its lookup it still names the day', async () => {
    const found = await loaded();
    const remove = describeToolCall('toggle_vacay_entry', 'v1', { date: '2026-10-26' }, ctx, found);
    expect(remove).toMatchObject({ verbKey: 'removeVacationDay', subject: 'Mon, Oct 26', domain: 'vacay', rows: [] });
    expect(remove.card?.kind).toBe('vacay');
    const convert = describeToolCall('toggle_vacay_entry', 'v2', { date: '2026-10-27' }, ctx, found);
    expect(convert.verbKey).toBe('changeVacationDay');
    // A day added or converted has a way back (ASTVAC-015), a day cleared none, nor a call whose lookup failed.
    const add = describeToolCall('toggle_vacay_entry', 'v4', { date: '2026-10-28' }, ctx, found);
    expect(add).toMatchObject({ verbKey: 'addVacationDay', undoable: true });
    expect(convert.undoable).toBe(true);
    expect(remove.undoable).toBe(false);
    const bare = describeToolCall('toggle_vacay_entry', 'v3', { date: '2026-10-26' }, ctx, null);
    expect(bare).toMatchObject({ verbKey: 'addVacationDay', subject: 'Mon, Oct 26', undoable: false });
    expect(bare.card).toBeUndefined();
    expect(appliedChange('toggle_vacay_entry', 'v1', {}, { action: 'removed' }, null, null)).toMatchObject({
      entity: 'vacay',
      ids: [],
    });
  });

  it('ASTVAC-014: the applied card follows what the tool did, which can differ from the held card hours later', async () => {
    const found = await loaded();
    const args = { date: '2026-10-28' };
    const preview = describeToolCall('toggle_vacay_entry', 'v1', args, ctx, found);
    const applied = (result: unknown) => {
      const card = appliedCardOf('toggle_vacay_entry', { args, result, preview });
      return card?.kind === 'vacay' ? card : null;
    };
    // As foreseen: the held card stands.
    expect(applied({ action: 'added', fraction: 1, kind: 'vacation' })).toEqual(preview.card);
    // Someone logged the day meanwhile: the toggle cleared it, and gave back the day it was asked with.
    expect(applied({ action: 'removed' })?.proposal).toMatchObject({
      outcome: 'remove',
      deltas: [{ personId: ANA, year: 2026, days: -1 }],
    });
    // Half a company holiday came meanwhile: half a day was taken.
    expect(applied({ action: 'added', fraction: 0.5, kind: 'vacation' })?.proposal).toMatchObject({
      outcome: 'add',
      fraction: 0.5,
      deltas: [{ days: 0.5 }],
    });
    // A day the card did not know was converted: what it was before is unknown, so the days left stay.
    expect(applied({ action: 'updated', fraction: 1, kind: 'vacation' })?.proposal).toMatchObject({
      outcome: 'convert',
      deltas: [],
    });
    // A refusal names nothing done, and a preview without its card gives none.
    expect(applied({ error: 'weekend_blocked' })).toBeNull();
    const bare = { ...preview, card: null };
    expect(appliedCardOf('toggle_vacay_entry', { args, result: { action: 'added' }, preview: bare })).toBeNull();
    const shut = { date: '2026-10-26' };
    const company = describeToolCall('toggle_company_holiday', 'c1', shut, ctx, found);
    const removed = { args: shut, result: { action: 'removed' }, preview: company };
    const done = appliedCardOf('toggle_company_holiday', removed);
    expect(done?.kind === 'vacay' && done.proposal).toMatchObject({ outcome: 'remove', deltas: [] });
    const added = { args: shut, result: { action: 'added', fraction: 1 }, preview: company };
    expect(appliedCardOf('toggle_company_holiday', added)).toEqual(company.card);
    // A known half day turned into a comp day instead of a whole one: it gives the half day back.
    const half = { date: '2026-10-27' };
    const convert = describeToolCall('toggle_vacay_entry', 'v4', half, ctx, found);
    const comp = { args: half, result: { action: 'updated', fraction: 1, kind: 'comp' }, preview: convert };
    const changed = appliedCardOf('toggle_vacay_entry', comp);
    expect(changed?.kind === 'vacay' && changed.proposal).toMatchObject({ kind: 'comp', deltas: [{ days: -0.5 }] });
  });
});

describe('the way back from a day off', () => {
  const ADDED = { action: 'added', fraction: 1, kind: 'vacation' };
  /** What a toggle answers when it converted a day to a whole vacation day. */
  const CONVERTED = { action: 'updated', fraction: 1, kind: 'vacation' };
  const undoArgs = (args: Record<string, unknown>, result: unknown, preview: AssistantChangePreview | null) =>
    ASSISTANT_UNDO_MAP.toggle_vacay_entry?.args(args, result, preview);

  it('ASTVAC-015: an added day is cleared and a converted one set back, for the person held; a cleared day stays', async () => {
    const found = await loaded();
    const held = (args: Record<string, unknown>) => describeToolCall('toggle_vacay_entry', 'v1', args, ctx, found);
    const day = { date: '2026-10-28' };
    expect(undoArgs(day, ADDED, held(day))).toEqual({
      date: '2026-10-28',
      fraction: 1,
      kind: 'vacation',
      targetUserId: ANA,
    });
    const ben = { date: '2026-10-28', targetUserId: BEN, kind: 'comp' };
    expect(undoArgs(ben, { action: 'added', fraction: 1, kind: 'comp' }, held(ben))).toEqual({
      date: '2026-10-28',
      fraction: 1,
      kind: 'comp',
      targetUserId: BEN,
    });
    // Ana's half day made whole goes back to half a day.
    const half = { date: '2026-10-27' };
    expect(undoArgs(half, CONVERTED, held(half))).toEqual({
      date: '2026-10-27',
      fraction: 0.5,
      kind: 'vacation',
      targetUserId: ANA,
    });
    // Cleared, done otherwise than the card foresaw, without the card or on another day: no way back.
    const full = { date: '2026-10-26' };
    expect(undoArgs(full, { action: 'removed' }, held(full))).toBeNull();
    expect(undoArgs(day, CONVERTED, held(day))).toBeNull();
    expect(undoArgs(half, { action: 'updated', fraction: 1, kind: 'comp' }, held(half))).toBeNull();
    expect(undoArgs(half, ADDED, held(half))).toBeNull();
    expect(undoArgs(day, ADDED, null)).toBeNull();
    expect(undoArgs({ date: '2026-10-29' }, ADDED, held(day))).toBeNull();
    expect(undoArgs(day, { action: 'added', fraction: 2, kind: 'vacation' }, held(day))).toBeNull();
    expect(undoReadsOf('toggle_vacay_entry', day, ADDED)).toEqual([
      { tool: 'get_vacay_entries', args: { year: 2026 } },
      { tool: 'get_vacay_entries', args: { year: 2025 } },
    ]);
  });

  it('ASTVAC-016: the undo runs only while the day is as the change left it and the toggle back does just that', async () => {
    const found = await loaded();
    const day = { date: '2026-10-28' };
    const call = { args: day, preview: describeToolCall('toggle_vacay_entry', 'v1', day, ctx, found) };
    const none = { entries: { entries: [], companyHolidays: [] } };
    const snapshot = (rows: unknown[], company: unknown[] = [], earlier: unknown = none): UndoSnapshot => ({
      summary: null,
      places: null,
      reads: new Map([
        [readKey('get_vacay_entries', { year: 2026 }), { entries: { entries: rows, companyHolidays: company } }],
        [readKey('get_vacay_entries', { year: 2025 }), earlier],
      ]),
    });
    const check = (result: unknown, snap: UndoSnapshot, made = call) =>
      unchangedSinceApplied('toggle_vacay_entry', result, snap, made);
    expect(check(ADDED, snapshot([entry(ANA, '2026-10-28')]))).toBe(true);
    // The grid of the year before can show the day too: it is read there as well.
    const before = { entries: { entries: [entry(ANA, '2026-10-28')], companyHolidays: [] } };
    expect(check(ADDED, snapshot([], [], before))).toBe(true);
    // Changed by hand, cleared, or only someone else's day: changed since.
    expect(check(ADDED, snapshot([entry(ANA, '2026-10-28', 0.5)]))).toBe(false);
    expect(check(ADDED, snapshot([entry(BEN, '2026-10-28')]))).toBe(false);
    expect(check(ADDED, snapshot([]))).toBe(false);
    // Half a company holiday since makes every toggle half a day: a whole day is not cleared that way.
    const halfCompany = (date: string) => [{ date, fraction: 0.5 }];
    expect(check(ADDED, snapshot([entry(ANA, '2026-10-28')], halfCompany('2026-10-28')))).toBe(false);
    // A read that failed, or no call to tell the day by, reads as changed since.
    expect(check(ADDED, snapshot([entry(ANA, '2026-10-28')], [], null))).toBe(false);
    expect(unchangedSinceApplied('toggle_vacay_entry', ADDED, snapshot([entry(ANA, '2026-10-28')]))).toBe(false);
    expect(TOOL_CARDS.toggle_vacay_entry?.undo?.unchanged(ADDED, snapshot([entry(ANA, '2026-10-28')]))).toBe(false);
    // Half a day set back on half a company holiday is just what the toggle does there.
    const half = { date: '2026-10-27' };
    const converted = { args: half, preview: describeToolCall('toggle_vacay_entry', 'v2', half, ctx, found) };
    expect(check(CONVERTED, snapshot([entry(ANA, '2026-10-27')], halfCompany('2026-10-27')), converted)).toBe(true);
  });
});

describe('a held company holiday and allowance', () => {
  it('ASTVAC-020: a whole company holiday gives back what was logged that day, a half one half of a whole day', async () => {
    const found = await loaded();
    const whole = change('toggle_company_holiday', { date: '2026-10-26' }, found);
    expect(whole.proposal).toMatchObject({ personId: null, kind: 'company', fraction: 1, outcome: 'add' });
    // Ana's day counted, Ben's comp day did not.
    expect(whole.proposal?.deltas).toEqual([{ personId: ANA, year: 2026, days: -1 }]);
    expect(whole.balances.map((balance) => balance.personId)).toEqual([ANA]);
    const half = change('toggle_company_holiday', { date: '2026-10-27', half: true }, found);
    expect(half.proposal?.deltas).toEqual([]);
    const halfOfWhole = change('toggle_company_holiday', { date: '2026-10-29', half: true }, found);
    expect(halfOfWhole.proposal?.deltas).toEqual([{ personId: BEN, year: 2026, days: -0.5 }]);
    const off = change('toggle_company_holiday', { date: '2026-10-30', half: true }, found);
    expect(off.proposal).toMatchObject({ outcome: 'remove', deltas: [] });
    const larger = change('toggle_company_holiday', { date: '2026-10-30' }, found);
    expect(larger.proposal).toMatchObject({ outcome: 'convert', before: { fraction: 0.5, kind: 'company' } });
    const shut = { date: '2026-10-26', note: 'Shut' };
    const described = describeToolCall('toggle_company_holiday', 'c1', shut, ctx, found);
    expect(described).toMatchObject({ verbKey: 'setCompanyHoliday', rows: [{ labelKey: 'notes', after: 'Shut' }] });
    expect(whole.proposal?.notes).toEqual([]);
    // Company holidays off in the plan: the planner would refuse it, the tool writes it, the card warns.
    const companyOff = plan({ company_holidays_enabled: false });
    const offFound = await loaded({ ...CALENDAR_YEAR, [readKey('get_vacay_plan')]: companyOff });
    const unseen = change('toggle_company_holiday', { date: '2026-10-03' }, offFound);
    expect(unseen.proposal?.notes).toEqual(['companyOff', 'publicHoliday']);
  });

  it("ASTVAC-021: a new allowance shows the user's leave with the total it gives, carry-over included", async () => {
    const found = await loadStats(
      { year: 2026 },
      reader({ [readKey('get_vacay_stats', { year: 2026 })]: { stats: [stat(ANA, 2026), stat(BEN, 2026)] } }).read,
    );
    const card = change('update_vacay_stats', { year: 2026, vacationDays: 31 }, found);
    expect(card.balances).toEqual([expect.objectContaining({ personId: ANA, total: 30, carried: 2, totalAfter: 33 })]);
    expect(card.people.map((person) => person.id)).toEqual([ANA]);
    expect(changeCardOf('update_vacay_stats', ctx, { year: 2026, vacationDays: -1 }, found)).toBeNull();
    expect(changeCardOf('update_vacay_stats', ctx, { year: 2026, vacationDays: 31 }, null)).toBeNull();
    expect(describeToolCall('update_vacay_stats', 's1', { year: 2026, vacationDays: 31 }, ctx, found)).toMatchObject({
      verbKey: 'setVacationAllowance',
      subject: '2026',
      rows: [{ labelKey: 'quantity', after: '31' }],
    });
  });

  it('ASTVAC-022: the package registers its writes, reads, one prompt line and the way back of a toggle only', () => {
    expect(ASSISTANT_WRITE_TOOLS.toggle_vacay_entry).toEqual({ verbKey: 'addVacationDay', entity: 'vacay' });
    expect(ASSISTANT_WRITE_TOOLS.toggle_company_holiday?.verbKey).toBe('setCompanyHoliday');
    expect(ASSISTANT_WRITE_TOOLS.update_vacay_stats?.verbKey).toBe('setVacationAllowance');
    for (const tool of ['get_vacay_entries', 'get_vacay_stats', 'list_holidays']) {
      expect(TOOL_CARDS[tool]?.answer, tool).toBeTypeOf('function');
    }
    expect(TOOL_CARDS.toggle_vacay_entry?.undo?.tool).toBe('toggle_vacay_entry');
    expect(TOOL_CARDS.toggle_company_holiday?.undo).toBeUndefined();
    expect(TOOL_CARDS.update_vacay_stats?.undo).toBeUndefined();
    expect(TOOL_CARDS.toggle_vacay_entry?.applied).toBeTypeOf('function');
    expect(TOOL_CARDS.toggle_company_holiday?.applied).toBeTypeOf('function');
    expect(CARD_PROMPT_LINES).toContain(VACAY_CARDS.prompt?.[0]);
  });
});

describe('the answer cards', () => {
  const answer = (tool: string, value: unknown, args: Record<string, unknown> = {}, today = '2026-10-01') =>
    answerCardOf(tool, { toolCallId: 'r1', args, value, card: trip, today });
  /** The same read in a trip without dates. */
  const undated = { ...trip, days: [], startDate: null, endDate: null };
  const away = (tool: string, value: unknown, args: Record<string, unknown>, today: string) =>
    answerCardOf(tool, { toolCallId: 'r2', args, value, card: undated, today });

  it("ASTVAC-030: a year's days off show on the trip's months, else the coming ones, else today or the year's start", () => {
    const onTrip = answer('get_vacay_entries', ENTRIES, { year: 2026 });
    if (onTrip?.kind !== 'vacay') throw new Error('no card');
    expect(onTrip.months).toEqual([{ year: 2026, month: 10 }]);
    expect(onTrip.people.map((person) => person.id)).toEqual([ANA, BEN]);
    expect(onTrip.otherDays).toBe(1);
    expect(onTrip.tripDates).toEqual(['2026-10-27', '2026-10-28']);
    expect(onTrip.year).toBe(2026);
    const unasked = answer('get_vacay_entries', ENTRIES);
    expect(unasked?.kind === 'vacay' && 'year' in unasked).toBe(false);
    const coming = away('get_vacay_entries', ENTRIES, { year: 2026 }, '2026-11-15');
    expect(coming?.kind === 'vacay' && coming.months).toEqual([{ year: 2026, month: 12 }]);
    const empty = { entries: { entries: [], companyHolidays: [] } };
    const today = away('get_vacay_entries', empty, { year: 2026 }, '2026-05-04');
    expect(today?.kind === 'vacay' && today.months).toEqual([{ year: 2026, month: 5 }]);
    const later = away('get_vacay_entries', empty, { year: 2028 }, '2026-05-04');
    expect(later?.kind === 'vacay' && later.months).toEqual([{ year: 2028, month: 1 }]);
    expect(answer('get_vacay_entries', 'User not in plan')).toBeNull();
  });

  it("ASTVAC-031: a busy plan keeps the user's days first and stays under the card size", () => {
    const people = [ANA, BEN, 9, 10, 11, 12, 13, 14];
    const rows = people.flatMap((user) =>
      Array.from({ length: 31 }, (_, day) => entry(user, `2026-10-${String(day + 1).padStart(2, '0')}`)),
    );
    const card = answer('get_vacay_entries', { entries: { entries: rows, companyHolidays: [] } }, { year: 2026 });
    if (card?.kind !== 'vacay') throw new Error('no card');
    expect(card.days).toHaveLength(VACAY_CARD_MAX_DAYS);
    expect(card.days.filter((day) => day.personId === ANA)).toHaveLength(31);
    expect(JSON.stringify(card).length).toBeLessThan(24_000);
    // Three whole months of trip days and of company holidays fit the card.
    const long = Array.from({ length: 92 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 9, 1 + index)).toISOString().slice(0, 10);
      return { id: 100 + index, day_number: index + 1, date, assignments: [], notes: [] };
    });
    const trek = buildTripCard(2, ANA, { trip: { title: 'Long', start_date: '2026-10-01' }, days: long }, null, null);
    const company = long.map((day) => ({ date: day.date, fraction: 1 }));
    const value = { entries: { entries: [], companyHolidays: [...company, ...company] } };
    const input = { toolCallId: 'r3', args: { year: 2026 }, value, card: trek, today: '2026-10-01' };
    const busy = answerCardOf('get_vacay_entries', input);
    if (busy?.kind !== 'vacay') throw new Error('no card');
    expect(busy.months).toHaveLength(3);
    expect(busy.tripDates).toHaveLength(92);
    expect(busy.company).toHaveLength(92);
  });

  it('ASTVAC-032: the days left list the user first; holidays show on the trip months or the coming ones', () => {
    const stats = answer('get_vacay_stats', { stats: [stat(BEN, 2026), stat(ANA, 2026)] }, { year: 2026 });
    if (stats?.kind !== 'vacay') throw new Error('no card');
    expect(stats.balances.map((balance) => balance.personId)).toEqual([ANA, BEN]);
    expect(stats.months).toEqual([]);
    expect(answer('get_vacay_stats', { stats: [] })).toBeNull();
    const holidays = answer('list_holidays', HOLIDAYS, { country: 'DE', year: 2026 });
    if (holidays?.kind !== 'vacay') throw new Error('no card');
    // Only the holidays of the whole country: the answer knows no region.
    expect(holidays.holidays).toEqual([{ date: '2026-10-03', name: 'Tag der Deutschen Einheit', color: null }]);
    expect(holidays.months).toEqual([{ year: 2026, month: 10 }]);
    const coming = away('list_holidays', HOLIDAYS, { country: 'DE', year: 2026 }, '2026-10-10');
    expect(coming?.kind === 'vacay' && coming.months).toEqual([{ year: 2026, month: 12 }]);
    expect(answer('list_holidays', { holidays: [] })).toBeNull();
  });
});
