import { ASSISTANT_CHANGE_VERB_KEYS, assistantAppliedSchema } from '../assistant.schema';
import { storedTrekCardSchema, trekCardSchema } from './index';
import { VACAY_CARD_MAX_DATES, VACAY_CARD_MAX_DAYS, vacayCardSchema, type VacayCard } from './vacay.card';
import { VACAY_APPLIED_ENTITIES, VACAY_VERB_KEYS } from './vacay.contract';

import { describe, expect, it } from 'vitest';

/** A change card of one day off, as the server builds it. */
const card = (): VacayCard => ({
  kind: 'vacay',
  months: [{ year: 2026, month: 10 }],
  weekStart: 1,
  weekendDays: [0, 6],
  people: [{ id: 7, name: 'Ana', avatarKey: null, color: '#6366f1' }],
  days: [{ date: '2026-10-26', personId: 7, fraction: 1, kind: 'vacation' }],
  company: [{ date: '2026-10-30', fraction: 0.5 }],
  holidays: [{ date: '2026-10-03', name: 'Tag der Deutschen Einheit', color: null }],
  tripDates: ['2026-10-27'],
  proposal: {
    date: '2026-10-27',
    personId: 7,
    kind: 'vacation',
    fraction: 1,
    outcome: 'add',
    before: null,
    periodYear: 2026,
    notes: [],
    deltas: [{ personId: 7, year: 2026, days: 1 }],
  },
  balances: [
    {
      personId: 7,
      year: 2026,
      total: 30,
      used: 12.5,
      comp: 0,
      totalAfter: null,
      windowStart: '2026-01-01',
      windowEnd: '2027-01-01',
    },
  ],
  otherDays: 0,
});

describe('the vacation card', () => {
  it('VACAYCARD-001: a change card and an answer card read as themselves in the union', () => {
    expect(trekCardSchema.parse(card())).toEqual(card());
    const answer = { ...card(), proposal: null, months: [] };
    expect(storedTrekCardSchema.parse(answer)).toEqual(answer);
  });

  it('VACAYCARD-002: a colour that is no hex, half a half day or an outcome it does not know reads as no card', () => {
    const people = [{ id: 7, name: 'Ana', avatarKey: null, color: 'url(x)' }];
    expect(storedTrekCardSchema.parse({ ...card(), people })).toBeNull();
    const days = [{ date: '2026-10-26', personId: 7, fraction: 0.25, kind: 'vacation' }];
    expect(storedTrekCardSchema.parse({ ...card(), days })).toBeNull();
    const proposal = { ...card().proposal, outcome: 'swap' };
    expect(storedTrekCardSchema.parse({ ...card(), proposal })).toBeNull();
  });

  it('VACAYCARD-003: the lists are bounded, and a field a later build adds is dropped on read', () => {
    const many = Array.from({ length: VACAY_CARD_MAX_DAYS + 1 }, () => card().days[0]);
    expect(vacayCardSchema.safeParse({ ...card(), days: many }).success).toBe(false);
    const months = Array.from({ length: 4 }, () => ({ year: 2026, month: 1 }));
    expect(vacayCardSchema.safeParse({ ...card(), months }).success).toBe(false);
    // Three long months of trip days and company holidays fit; one date more does not.
    const dates = (count: number) => Array.from({ length: count }, () => '2026-10-27');
    expect(vacayCardSchema.safeParse({ ...card(), tripDates: dates(VACAY_CARD_MAX_DATES) }).success).toBe(true);
    expect(vacayCardSchema.safeParse({ ...card(), tripDates: dates(VACAY_CARD_MAX_DATES + 1) }).success).toBe(false);
    const company = dates(VACAY_CARD_MAX_DATES).map((date) => ({ date, fraction: 1 }));
    expect(vacayCardSchema.safeParse({ ...card(), company }).success).toBe(true);
    expect(storedTrekCardSchema.parse({ ...card(), later: true })).toEqual(card());
  });

  it('VACAYCARD-005: the carried-over days and the year asked for are optional, so older cards still read', () => {
    const balances = [{ ...card().balances[0], carried: 2 }];
    expect(vacayCardSchema.parse({ ...card(), balances, year: 2026 })).toMatchObject({ balances, year: 2026 });
    expect(vacayCardSchema.safeParse({ ...card(), year: 1999 }).success).toBe(false);
    const proposal = { ...card().proposal, kind: 'company', personId: null, notes: ['companyOff'] };
    expect(vacayCardSchema.safeParse({ ...card(), proposal }).success).toBe(true);
  });

  it('VACAYCARD-004: its verbs and its entity join the shared enums', () => {
    for (const verb of VACAY_VERB_KEYS) expect(ASSISTANT_CHANGE_VERB_KEYS).toContain(verb);
    const applied = { toolCallId: 'c1', entity: VACAY_APPLIED_ENTITIES[0], ids: [], dayId: null, undoUntil: null };
    expect(assistantAppliedSchema.parse(applied).entity).toBe('vacay');
  });
});
