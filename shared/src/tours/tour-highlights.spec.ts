import {
  TOUR_HIGHLIGHT_FALLBACK_MIN_QRANK,
  TOUR_HIGHLIGHT_MIN_COUNT,
  TOUR_HIGHLIGHT_MIN_QRANK,
  tourHighlightIds,
} from './tour-highlights';

import { describe, expect, it } from 'vitest';

const rank = (id: string, qrank: number) => ({ id, qrank });

describe('tour highlights', () => {
  it('TOUR-HIGHLIGHT-001: every place past the bar is a highlight, best known first', () => {
    expect(
      tourHighlightIds([
        rank('square', 900_000),
        rank('cafe', 100),
        rank('church', 41_000),
        rank('bridge', 40_000),
        rank('tower', 250_000),
      ]),
    ).toEqual(['square', 'tower', 'church', 'bridge']);
  });

  it('TOUR-HIGHLIGHT-002: with fewer than three past the bar, the best known down to the fallback fill up to three', () => {
    expect(
      tourHighlightIds([rank('a', 6_000), rank('b', 60_000), rank('c', 4_999), rank('d', 5_000), rank('e', 7_000)]),
    ).toEqual(['b', 'e', 'a']);
    expect(tourHighlightIds([rank('a', 6_000), rank('b', 4_000)])).toEqual(['a']);
  });

  it('TOUR-HIGHLIGHT-003: nothing ranked is nothing marked, and a broken rank is never a highlight', () => {
    expect(tourHighlightIds([])).toEqual([]);
    expect(tourHighlightIds([rank('a', 4_999), rank('b', Number.NaN)])).toEqual([]);
  });

  it('TOUR-HIGHLIGHT-004: the bars are what the rule says', () => {
    expect(TOUR_HIGHLIGHT_MIN_QRANK).toBe(40_000);
    expect(TOUR_HIGHLIGHT_FALLBACK_MIN_QRANK).toBe(5_000);
    expect(TOUR_HIGHLIGHT_MIN_COUNT).toBe(3);
  });
});
