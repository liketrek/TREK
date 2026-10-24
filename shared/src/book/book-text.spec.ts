import { bookPath } from './book-path';
import { bookCoordValue, bookDateMarkValue, formatBookCoords, formatBookDate } from './book-text';

import { describe, expect, it } from 'vitest';

/**
 * The words an entry lends to a page and the thinned route, moved from the
 * Studio: the characters must stay exactly what the Studio printed, or every
 * open of an old book rewrites its bound lines.
 */

describe('book text', () => {
  it('BOOKTXT-001: sets coordinates in degrees, minutes and seconds with hemisphere letters', () => {
    expect(formatBookCoords(52.5163, 13.3777)).toBe(`52° 30' 59" N   13° 22' 40" E`);
    expect(formatBookCoords(-33.8688, -70.6693)).toBe(`33° 52' 8" S   70° 40' 9" W`);
  });

  it('BOOKTXT-002: sets the decimal form to four places, with the hemisphere letter', () => {
    expect(formatBookCoords(52.5163, 13.3777, 'decimal')).toBe('52.5163° N  13.3777° E');
    expect(formatBookCoords(-33.8688, -70.6693, 'decimal')).toBe('33.8688° S  70.6693° W');
  });

  it('BOOKTXT-003: spells the date out in the given language, and answers nothing for no date or a bad one', () => {
    expect(formatBookDate('2026-06-12', 'de-DE')).toBe('12. Juni 2026');
    expect(formatBookDate('2026-06-12', 'en-GB')).toBe('12 June 2026');
    expect(formatBookDate(null, 'en')).toBe('');
    expect(formatBookDate('not a date', 'en')).toBe('');
  });

  it('BOOKTXT-004: keeps a point as the raw value a coordinates binding compares', () => {
    expect(bookCoordValue(63.4027, -19.0448)).toBe('63.4027,-19.0448');
  });

  it('BOOKTXT-008: sets a date mark as the day numeral and the month in capitals, and nothing for what is no date', () => {
    expect(bookDateMarkValue('2026-06-03', 'de-DE')).toEqual({ text: '3', sub: 'JUNI' });
    expect(bookDateMarkValue('2026-06-03T10:00:00Z', 'en')).toEqual({ text: '3', sub: 'JUNE' });
    // A language tag the platform cannot read spells the month in English rather than failing the page.
    expect(bookDateMarkValue('2026-06-03', 'en_US')).toEqual({ text: '3', sub: 'JUNE' });
    expect(bookDateMarkValue('June', 'en')).toBeNull();
    expect(bookDateMarkValue(null, 'en')).toBeNull();
  });
});

describe('book path', () => {
  it('BOOKTXT-005: keeps short tracks whole, drops tracks under two points and unreadable pairs', () => {
    const path = bookPath([
      {
        points: [
          [52.5, 13.4],
          [52.6, 'x'],
          [52.7, 13.6],
        ],
      },
      { points: [[1, 2]] },
    ]);
    expect(path).toEqual([
      [
        [52.5, 13.4],
        [52.7, 13.6],
      ],
    ]);
  });

  it('BOOKTXT-006: thins a long track to 600 points and keeps both of its ends', () => {
    const points = Array.from({ length: 5000 }, (_, i) => [i / 1000, i / 2000]);
    const [only] = bookPath([{ points }]);
    expect(only).toHaveLength(600);
    expect(only?.[0]).toEqual([0, 0]);
    expect(only?.[599]).toEqual([4.999, 2.4995]);
  });

  it('BOOKTXT-007: keeps at most 40 segments', () => {
    const track = {
      points: [
        [1, 1],
        [2, 2],
      ],
    };
    expect(bookPath(Array.from({ length: 50 }, () => track))).toHaveLength(40);
  });
});
