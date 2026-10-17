import { describe, expect, it } from 'vitest';
import { formatTourDuration, parseTourDuration } from './tourDurationInput';

describe('parseTourDuration', () => {
  it.each([
    ['176', 176],
    ['0', 0],
    [' 45 ', 45],
    ['2:56', 176],
    ['0:05', 5],
    ['2:5', 125],
    ['2 h 56', 176],
    ['2h56', 176],
    ['2 h 56 min', 176],
    ['2H 56MIN', 176],
    ['2 h', 120],
    ['3h', 180],
    ['1,5 h', 90],
    ['1.5h', 90],
    ['2 Std 10', 130],
    ['2 Std. 10 Min.', 130],
    ['45 min', 45],
    ['45m', 45],
    ['2  h   5', 125],
  ])('reads %j as %d minutes', (text, minutes) => {
    expect(parseTourDuration(text)).toBe(minutes);
  });

  it('clears the value for an empty field', () => {
    expect(parseTourDuration('')).toBeNull();
    expect(parseTourDuration('   ')).toBeNull();
  });

  it.each(['h', 'min', 'abc', '2:60', '2:', ':30', '-5', '2 56', '2,5', '1 h 2 h', '12345678901234567'])(
    'rejects %j',
    (text) => {
      expect(parseTourDuration(text)).toBe('invalid');
    }
  );

  it('reads back everything it formats', () => {
    for (const minutes of [0, 5, 59, 60, 61, 176, 1440]) {
      expect(parseTourDuration(formatTourDuration(minutes))).toBe(minutes);
    }
  });
});

describe('formatTourDuration', () => {
  it('writes hours and minutes the way the planner shows durations', () => {
    expect(formatTourDuration(176)).toBe('2 h 56 min');
    expect(formatTourDuration(120)).toBe('2 h');
    expect(formatTourDuration(45)).toBe('45 min');
    expect(formatTourDuration(0)).toBe('0 min');
  });

  it('writes nothing for an empty or unreadable value', () => {
    expect(formatTourDuration(null)).toBe('');
    expect(formatTourDuration(Number.NaN)).toBe('');
  });
});
