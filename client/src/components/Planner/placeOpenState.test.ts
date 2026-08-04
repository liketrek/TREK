import { resolveOpenNow, resolvePlaceTimeZone, placeWeekdayIndex } from './placeOpenState';
import type { OpeningPeriod } from './placeOpenState';

// Seoul is UTC+9, Paris UTC+2 in summer — far enough apart that a viewer's clock and
// the place's clock disagree on both the hour and the weekday.
const SEOUL: [number, number] = [37.5665, 126.978];
const PARIS: [number, number] = [48.8566, 2.3522];

// Periods count days Google's way: Sunday is 0.
const SUN = 0, MON = 1, TUE = 2, WED = 3, THU = 4, SAT = 6;

function period(day: number, openHour: number, closeDay: number, closeHour: number): OpeningPeriod {
  return {
    open: { day, hour: openHour, minute: 0 },
    close: { day: closeDay, hour: closeHour, minute: 0 },
  };
}

describe('resolvePlaceTimeZone', () => {
  it('FE-PLANNER-OPENSTATE-001: maps coordinates to an IANA zone', () => {
    expect(resolvePlaceTimeZone(...SEOUL)).toBe('Asia/Seoul');
    expect(resolvePlaceTimeZone(...PARIS)).toBe('Europe/Paris');
  });

  it('FE-PLANNER-OPENSTATE-002: returns null for missing or non-finite coordinates', () => {
    expect(resolvePlaceTimeZone(null, null)).toBeNull();
    expect(resolvePlaceTimeZone(undefined, 2.3)).toBeNull();
    expect(resolvePlaceTimeZone('48.8', '2.3')).toBeNull();
    expect(resolvePlaceTimeZone(NaN, 2.3)).toBeNull();
    expect(resolvePlaceTimeZone(48.8, Infinity)).toBeNull();
  });

  it('FE-PLANNER-OPENSTATE-003: returns null when the lookup rejects the coordinate', () => {
    expect(resolvePlaceTimeZone(1200, 4000)).toBeNull();
  });
});

describe('placeWeekdayIndex', () => {
  it('FE-PLANNER-OPENSTATE-004: is Monday-based and read in the place timezone', () => {
    // Sunday 20:00 UTC is already Monday 05:00 in Seoul.
    const at = new Date('2026-07-26T20:00:00Z');
    expect(placeWeekdayIndex(at, 'Asia/Seoul')).toBe(0);
    expect(placeWeekdayIndex(at, 'UTC')).toBe(6);
  });

  it('FE-PLANNER-OPENSTATE-005: falls back to the viewer weekday without a timezone', () => {
    const at = new Date('2026-07-29T12:00:00Z');
    const jsDay = at.getDay();
    expect(placeWeekdayIndex(at, null)).toBe(jsDay === 0 ? 6 : jsDay - 1);
  });

  it('FE-PLANNER-OPENSTATE-006: falls back to the viewer weekday for an unusable timezone', () => {
    const at = new Date('2026-07-29T12:00:00Z');
    const jsDay = at.getDay();
    expect(placeWeekdayIndex(at, 'Not/AZone')).toBe(jsDay === 0 ? 6 : jsDay - 1);
  });
});

describe('resolveOpenNow', () => {
  it('FE-PLANNER-OPENSTATE-010: judges the periods in the place timezone, not the viewer one', () => {
    // Sunday 20:00 UTC → Monday 05:00 in Seoul. The server said closed.
    const hours = { periods: [period(MON, 0, MON, 12)] };
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-26T20:00:00Z'))).toBe(true);
    // The same instant is still Sunday 22:00 in Paris, where Monday has not begun.
    expect(resolveOpenNow(hours, ...PARIS, true, new Date('2026-07-26T20:00:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-011: reports closed when the place clock is outside the hours', () => {
    const hours = { periods: [period(MON, 9, MON, 18)] };
    // Sunday 23:00 UTC → Monday 08:00 Seoul is still an hour before opening.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-26T23:00:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-012: a weekday with no period of its own counts as closed', () => {
    const hours = { periods: [period(MON, 9, MON, 18), period(TUE, 9, TUE, 18)] };
    // Wednesday 12:00 in Seoul.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-29T03:00:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-013: minutes are honoured on both ends of a period', () => {
    const hours = {
      periods: [{ open: { day: WED, hour: 9, minute: 30 }, close: { day: WED, hour: 17, minute: 15 } }],
    };
    // 09:29 Seoul — a minute short.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-29T00:29:00Z'))).toBe(false);
    // 09:30 Seoul.
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-29T00:30:00Z'))).toBe(true);
    // 17:15 Seoul — the closing minute itself is shut.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-29T08:15:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-014: handles a second period after a midday break', () => {
    const hours = { periods: [period(WED, 9, WED, 12), period(WED, 14, WED, 20)] };
    // 13:00 Seoul — in the break.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-29T04:00:00Z'))).toBe(false);
    // 15:00 Seoul — second period.
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-29T06:00:00Z'))).toBe(true);
  });

  it('FE-PLANNER-OPENSTATE-015: a period running past midnight stays open after the start', () => {
    const hours = { periods: [period(WED, 20, THU, 2)] };
    // 23:00 Seoul on Wednesday.
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-29T14:00:00Z'))).toBe(true);
    // 01:00 Seoul on Thursday, which has no period of its own.
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-29T16:00:00Z'))).toBe(true);
    // 03:00 Seoul on Thursday — the night is over.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-29T18:00:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-016: a Saturday night period carries over into Sunday', () => {
    const hours = { periods: [period(SAT, 22, SUN, 4)] };
    // Sunday 02:00 Seoul — the period started the previous day and wraps the week end.
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-25T17:00:00Z'))).toBe(true);
    // Sunday 05:00 Seoul.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-25T20:00:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-017: a period without a close is a round-the-clock place', () => {
    // Google describes 24/7 as one period opening Sunday midnight and never closing —
    // no text in any language is involved.
    const hours = { periods: [{ open: { day: SUN, hour: 0, minute: 0 } }] };
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-29T03:00:00Z'))).toBe(true);
    expect(resolveOpenNow({ periods: [{ open: { day: SUN, hour: 0, minute: 0 }, close: null }] }, ...SEOUL, false,
      new Date('2026-07-29T18:00:00Z'))).toBe(true);
  });

  it('FE-PLANNER-OPENSTATE-018: a full week of daily periods is open at every hour', () => {
    const hours = { periods: [0, 1, 2, 3, 4, 5, 6].map(d => ({ open: { day: d, hour: 0, minute: 0 }, close: { day: (d + 1) % 7, hour: 0, minute: 0 } })) };
    for (const iso of ['2026-07-29T03:00:00Z', '2026-07-29T14:59:00Z', '2026-07-25T16:00:00Z']) {
      expect(resolveOpenNow(hours, ...SEOUL, false, new Date(iso))).toBe(true);
    }
  });

  it('FE-PLANNER-OPENSTATE-019: keeps the server verdict on a special day', () => {
    // 2026-07-29 is a holiday in the payload, so Google's own verdict decides.
    const hours = { periods: [period(WED, 9, WED, 18)], specialDays: ['2026-07-29'] };
    expect(resolveOpenNow(hours, ...SEOUL, false, new Date('2026-07-29T03:00:00Z'))).toBe(false);
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-29T03:00:00Z'))).toBe(true);
    // The day before is a normal Tuesday with no period — recomputed, not deferred.
    expect(resolveOpenNow(hours, ...SEOUL, true, new Date('2026-07-28T03:00:00Z'))).toBe(false);
  });

  it('FE-PLANNER-OPENSTATE-020: keeps the server verdict without usable periods', () => {
    const at = new Date('2026-07-29T03:00:00Z');
    expect(resolveOpenNow(null, ...SEOUL, true, at)).toBe(true);
    expect(resolveOpenNow({ periods: [] }, ...SEOUL, false, at)).toBe(false);
    expect(resolveOpenNow({ periods: null }, ...SEOUL, true, at)).toBe(true);
    expect(resolveOpenNow({}, ...SEOUL, undefined, at)).toBeNull();
  });

  it('FE-PLANNER-OPENSTATE-021: keeps the server verdict without coordinates', () => {
    const hours = { periods: [period(WED, 0, WED, 23)] };
    expect(resolveOpenNow(hours, null, null, true, new Date('2026-07-29T03:00:00Z'))).toBe(true);
    expect(resolveOpenNow(hours, null, null, undefined, new Date('2026-07-29T03:00:00Z'))).toBeNull();
  });

  it('FE-PLANNER-OPENSTATE-022: drops malformed periods instead of guessing', () => {
    const at = new Date('2026-07-29T03:00:00Z');
    // Wednesday 12:00 Seoul would be inside every one of these if they were trusted.
    const junk = [
      { open: { day: 9, hour: 0, minute: 0 }, close: { day: 9, hour: 23, minute: 0 } },
      { open: { day: WED, hour: 24, minute: 0 }, close: { day: WED, hour: 23, minute: 0 } },
      { open: { day: WED, hour: '09', minute: 0 } },
      { close: { day: WED, hour: 23, minute: 0 } },
      null,
    ];
    // Nothing usable is left, so the server verdict stands instead of a stray "open".
    expect(resolveOpenNow({ periods: junk as never }, ...SEOUL, false, at)).toBe(false);
    // A period whose close point is broken is dropped rather than read as 24/7 — the
    // Monday period keeps the list usable, so the state is still recomputed.
    const brokenClose = [
      period(MON, 9, MON, 10),
      { open: { day: WED, hour: 9, minute: 0 }, close: { day: WED, hour: 61, minute: 0 } },
    ];
    expect(resolveOpenNow({ periods: brokenClose }, ...SEOUL, true, at)).toBe(false);
  });
});
