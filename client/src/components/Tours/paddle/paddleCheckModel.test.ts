// PCM-001 to PCM-019: the check bench of a paddle tour in one pill, how the dates of the checklist read, where the
// camera goes for an entry and the order the checklist lists its rows in (PAD-06, PAD-09).
import { Ban, CircleDashed, ListChecks } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import type { PaddleCheck, PaddleCheckData } from '@trek/shared';

import {
  earlierEntry,
  obstacleCheck,
  obstacleEntry,
  ownPortage,
  paddleBench,
} from '../../../../tests/helpers/paddleCheck';
import {
  checkDataWord,
  checklistRows,
  focusPointsOf,
  formatCheckDate,
  nextPendingEntry,
  paddleCheckFact,
} from './paddleCheckModel';

/** The key as it is, with its values appended: a test reads which string and which count. */
const t = (key: string, params?: Record<string, string | number>) => (params ? key + JSON.stringify(params) : key);

const fact = (bench: Partial<PaddleCheck>) => paddleCheckFact(paddleBench(bench), t);
const lines = (bench: Partial<PaddleCheck>) => fact(bench).label.split('\n');

const NOT_CLEARANCE = 'tours.paddle.check.notClearance';

describe('paddleCheckFact', () => {
  it('PCM-001: missing data says so and never shows a count, whatever the bench counts', () => {
    for (const data of ['unavailable', 'none'] as const) {
      const shown = fact({ data, open: 2, review: 1, decided: 3, bans: 1 });
      expect(shown.value).toBe(`tours.paddle.check.data.${data}`);
      expect(shown.value).not.toContain('count');
      expect(shown.icon).toBe(CircleDashed);
    }
    expect(lines({ data: 'none', entries: 0, open: 0 })).toEqual([
      'tours.paddle.check.dataLabel: tours.paddle.check.data.none',
      NOT_CLEARANCE,
    ]);
  });

  it('PCM-002: open entries and the ones to check again are counted together in the pill, apart in the label', () => {
    const shown = fact({ entries: 4, open: 2, review: 1, decided: 1 });
    expect(shown.value).toBe('tours.paddle.check.open{"count":3}');
    expect(shown.icon).toBe(ListChecks);
    expect(shown.label.split('\n')).toEqual([
      'tours.paddle.check.open{"count":2}',
      'tours.paddle.check.review{"count":1}',
      'tours.paddle.check.decided{"count":1}',
      NOT_CLEARANCE,
    ]);
    expect(fact({ entries: 2, open: 0, review: 2 }).value).toBe('tours.paddle.check.open{"count":2}');
  });

  it('PCM-003: open entries come before a partial coverage, and with nothing open the coverage word shows', () => {
    expect(fact({ data: 'partial', open: 1 }).value).toBe('tours.paddle.check.open{"count":1}');
    expect(fact({ data: 'partial', open: 0, decided: 1 }).value).toBe('tours.paddle.check.data.partial');
    expect(fact({ data: 'limited', open: 0, decided: 1 }).value).toBe('tours.paddle.check.data.limited');
    expect(lines({ data: 'limited', open: 0, decided: 1 })[0]).toBe(
      'tours.paddle.check.dataLabel: tours.paddle.check.data.limited'
    );
  });

  it('PCM-004: a route without known obstacles says none are known, never that it is clear', () => {
    const shown = fact({ entries: 0, open: 0 });
    expect(shown.value).toBe('tours.paddle.check.noneKnown');
    expect(shown.icon).toBe(ListChecks);
    expect(shown.label).toBe(NOT_CLEARANCE);
    // Data that covers only part of the route says that first.
    expect(fact({ data: 'partial', entries: 0, open: 0 }).value).toBe('tours.paddle.check.data.partial');
  });

  it('PCM-005: with every entry decided it counts the decisions', () => {
    const shown = fact({ entries: 3, open: 0, decided: 3 });
    expect(shown.value).toBe('tours.paddle.check.decided{"count":3}');
    expect(shown.icon).toBe(ListChecks);
  });

  it('PCM-006: a ban on the route shows the ban icon, and the label says a decision does not lift it', () => {
    const shown = fact({ entries: 2, open: 0, decided: 2, bans: 1 });
    expect(shown.icon).toBe(Ban);
    expect(shown.value).toBe('tours.paddle.check.decided{"count":2}');
    expect(shown.label.split('\n')).toEqual([
      'tours.paddle.check.decided{"count":2}',
      'tours.paddle.check.bans{"count":1}',
      'tours.paddle.check.bansInfo',
      NOT_CLEARANCE,
    ]);
    // Without data the missing data wins over the ban.
    expect(fact({ data: 'unavailable', bans: 1 }).icon).toBe(CircleDashed);
  });

  it('PCM-007: the label always ends with the note that a checklist is no clearance, once', () => {
    const benches: Partial<PaddleCheck>[] = [
      {},
      { data: 'none', entries: 0, open: 0 },
      { data: 'unavailable' },
      { data: 'partial', open: 0, review: 2, bans: 3 },
      { entries: 0, open: 0 },
      { open: 0, decided: 1, bans: 1 },
    ];
    for (const bench of benches) {
      const parts = lines(bench);
      expect(parts[parts.length - 1]).toBe(NOT_CLEARANCE);
      expect(parts.filter((part) => part === NOT_CLEARANCE)).toHaveLength(1);
    }
  });
});

describe('checkDataWord', () => {
  it('PCM-008: data that covers the route has no word, every other coverage its own', () => {
    expect(checkDataWord('covered', t)).toBeNull();
    const coverages: PaddleCheckData[] = ['partial', 'none', 'limited', 'unavailable'];
    for (const data of coverages) expect(checkDataWord(data, t)).toBe(`tours.paddle.check.data.${data}`);
  });
});

describe('formatCheckDate', () => {
  it('PCM-009: a bare month from the data reads as month and year in the language', () => {
    const may = new Date(Date.UTC(2026, 4, 1));
    const month = (language: string) =>
      new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(may);
    expect(formatCheckDate('2026-05', 'en')).toBe(month('en'));
    expect(formatCheckDate('2026-05', 'en')).toMatch(/May.*2026/);
    expect(formatCheckDate('2026-05', 'de')).toBe(month('de'));
  });

  it('PCM-010: a bare day is the calendar day it names, an instant the day it falls on here', () => {
    const day = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 9, 1))
    );
    expect(formatCheckDate('2026-10-01', 'en')).toBe(day);
    expect(formatCheckDate('2026-10-01', 'en')).toMatch(/Oct.*1.*2026/);
    const instant = '2026-10-02T04:20:00.000Z';
    expect(formatCheckDate(instant, 'en')).toBe(
      new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(instant))
    );
  });

  it('PCM-011: a value that is no date, or a language Intl cannot read, comes back as written', () => {
    expect(formatCheckDate('last summer', 'en')).toBe('last summer');
    expect(formatCheckDate('', 'en')).toBe('');
    expect(formatCheckDate('2026-05', 'not a language')).toBe('2026-05');
  });
});

describe('focusPointsOf', () => {
  it('PCM-012: an area small enough to frame whole gives its corners', () => {
    expect(focusPointsOf(obstacleEntry())).toEqual([
      [49.2, 12.005],
      [49.2, 12.005],
    ]);
    expect(focusPointsOf(ownPortage())).toEqual([
      [49.2, 12.0045],
      [49.2001, 12.0058],
    ]);
    // A lock of 1.1 km is still framed whole.
    expect(
      focusPointsOf({
        at: [49.205, 12],
        bounds: [
          [49.2, 12],
          [49.21, 12],
        ],
      })
    ).toEqual([
      [49.2, 12],
      [49.21, 12],
    ]);
  });

  it('PCM-013: an area too wide to frame goes to the point of the entry', () => {
    // About 3.4 km from corner to corner.
    expect(
      focusPointsOf({
        at: [49.215, 12.01],
        bounds: [
          [49.2, 12],
          [49.23, 12.01],
        ],
      })
    ).toEqual([[49.215, 12.01]]);
  });
});

describe('checklistRows', () => {
  it('PCM-014: lists the obstacles and the own portages and locks in route order, then the vanished ones, the earlier decisions apart', () => {
    const weir = obstacleEntry();
    const rapids = obstacleEntry({
      key: 'node/2',
      refs: ['node/2'],
      kind: 'rapids',
      relation: 'near',
      along_m: 300,
      distance_m: 40,
    });
    const dam = obstacleEntry({ key: 'node/3', refs: ['node/3'], kind: 'dam', along_m: 2600 });
    const gone = earlierEntry();
    const offRoute = earlierEntry({ key: 'node/10', refs: ['node/10'], status: 'off_route' });
    const portage = ownPortage();
    const lock = ownPortage({ kind: 'lock', index: 2, from_m: 2000, to_m: 2000, covers: [] });
    const check = obstacleCheck({ entries: [dam, weir, gone, offRoute, rapids], own: [lock, portage] });

    expect(checklistRows(check)).toEqual({
      rows: [
        { type: 'obstacle', entry: rapids },
        { type: 'own', own: portage },
        { type: 'obstacle', entry: weir },
        { type: 'own', own: lock },
        { type: 'obstacle', entry: dam },
        { type: 'obstacle', entry: gone },
      ],
      earlier: [offRoute],
    });
  });

  it('PCM-015: an empty checklist has no rows and nothing earlier', () => {
    expect(checklistRows(obstacleCheck({ entries: [], own: [] }))).toEqual({ rows: [], earlier: [] });
  });
});

describe('nextPendingEntry', () => {
  const decision = { decision: 'pass' as const, note: null, decided_at: '2026-10-10T09:00:00.000Z', decided_by: 5 };
  const first = obstacleEntry({ along_m: 100 });
  const decided = obstacleEntry({ key: 'node/2', refs: ['node/2'], along_m: 500, status: 'decided', decision });
  const todo = obstacleEntry({
    key: 'node/3',
    refs: ['node/3'],
    along_m: 900,
    status: 'todo',
    decision: { ...decision, decision: 'portage' },
  });
  const review = obstacleEntry({
    key: 'node/4',
    refs: ['node/4'],
    along_m: 1300,
    status: 'review',
    changed: ['route'],
    decision,
  });
  const last = obstacleEntry({ key: 'node/5', refs: ['node/5'], along_m: 1700, status: 'decided', decision });
  const gone = earlierEntry();
  const offRoute = earlierEntry({ key: 'node/11', refs: ['node/11'], status: 'off_route' });
  // Listed out of route order: the next one is found by its metre, not by its place in the list.
  const check = obstacleCheck({ entries: [review, last, gone, offRoute, todo, first, decided] });

  it('PCM-016: skips what is decided and takes the next one after the entry, one to check again counted', () => {
    expect(nextPendingEntry(check, first)).toEqual(todo);
    expect(nextPendingEntry(check, decided)).toEqual(todo);
    expect(nextPendingEntry(check, todo)).toEqual(review);
  });

  it('PCM-017: from an earlier decision outside the rows the first pending entry of the route comes next', () => {
    expect(nextPendingEntry(check, offRoute)).toEqual(first);
  });

  it('PCM-018: a vanished object, listed after the route, comes after its last entry, and after it there is none', () => {
    expect(nextPendingEntry(check, review)).toEqual(gone);
    expect(nextPendingEntry(check, last)).toEqual(gone);
    expect(nextPendingEntry(check, gone)).toBeNull();
    expect(nextPendingEntry(obstacleCheck({ entries: [first] }), first)).toBeNull();
  });
});

describe('nextPendingEntry at one metre', () => {
  it('PCM-019: two pending entries at the same metre follow each other in list order', () => {
    const first = obstacleEntry({ key: 'node/1', along_m: 1200 });
    const second = obstacleEntry({ key: 'node/2', refs: ['node/2'], along_m: 1200 });
    const check = obstacleCheck({ entries: [first, second] });
    expect(nextPendingEntry(check, first)?.key).toBe('node/2');
    expect(nextPendingEntry(check, second)).toBeNull();
  });
});
