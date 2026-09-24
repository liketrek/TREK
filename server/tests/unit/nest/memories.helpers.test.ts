/**
 * The provider-agnostic ordering the memories domain hands to the picker.
 *
 * Both provider services ask upstream for a descending order now, but neither
 * Immich nor Synology guarantees it across versions, and the album paths do not
 * run through a sorted search at all. This is the fallback that makes the day
 * headings in the picker mean something, so it is pinned here rather than
 * inside either provider suite.
 */
import { describe, it, expect } from 'vitest';
import {
  dayStartEpochSeconds,
  describeFetchFailure,
  isWithinLocalDayRange,
  shiftCalendarDay,
  sortAssetsByTakenAtDesc,
} from '../../../src/nest/memories/memories.helpers';

const asset = (id: string, takenAt?: string | null) => ({ id, takenAt });

const ids = (assets: { id: string }[]) => assets.map(a => a.id);

describe('sortAssetsByTakenAtDesc', () => {
  it('MEM-SORT-001: puts the newest capture first regardless of the order upstream sent', () => {
    const out = sortAssetsByTakenAtDesc([
      asset('middle', '2026-03-15T09:00:00Z'),
      asset('oldest', '2026-03-01T09:00:00Z'),
      asset('newest', '2026-03-31T09:00:00Z'),
    ]);

    expect(ids(out)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('MEM-SORT-002: keeps the upstream order between assets sharing a timestamp', () => {
    // Burst shots land on the same second often enough that an unstable sort
    // would reshuffle them on every page load.
    const out = sortAssetsByTakenAtDesc([
      asset('first', '2026-03-15T09:00:00Z'),
      asset('second', '2026-03-15T09:00:00Z'),
      asset('third', '2026-03-15T09:00:00Z'),
    ]);

    expect(ids(out)).toEqual(['first', 'second', 'third']);
  });

  it('MEM-SORT-003: sends assets without a usable timestamp to the end, in order', () => {
    const out = sortAssetsByTakenAtDesc([
      asset('no-date'),
      asset('dated', '2026-03-15T09:00:00Z'),
      asset('null-date', null),
      asset('empty-date', ''),
    ]);

    expect(ids(out)).toEqual(['dated', 'no-date', 'null-date', 'empty-date']);
  });

  it('MEM-SORT-004: treats an unparsable timestamp as missing rather than sorting on the string', () => {
    // Synology hands back an epoch it converts itself; a malformed value must not
    // outrank a real date just because it compares high as text.
    const out = sortAssetsByTakenAtDesc([
      asset('garbage', 'not-a-date'),
      asset('real', '2026-03-15T09:00:00Z'),
    ]);

    expect(ids(out)).toEqual(['real', 'garbage']);
  });

  it('MEM-SORT-005: leaves an empty list alone and does not mutate its input', () => {
    expect(sortAssetsByTakenAtDesc([])).toEqual([]);

    const input = [asset('a', '2026-01-01T00:00:00Z'), asset('b', '2026-02-01T00:00:00Z')];
    sortAssetsByTakenAtDesc(input);

    expect(ids(input)).toEqual(['a', 'b']);
  });

  it('MEM-SORT-006: compares across timezone offsets by instant, not by text', () => {
    // 23:00Z is later than 09:00-06:00 (15:00Z) even though the string sorts lower.
    const out = sortAssetsByTakenAtDesc([
      asset('offset', '2026-03-15T09:00:00-06:00'),
      asset('utc', '2026-03-15T23:00:00Z'),
    ]);

    expect(ids(out)).toEqual(['utc', 'offset']);
  });
});


describe('shiftCalendarDay', () => {
  it('MEM-DAY-001: pads a day outwards, crossing month and year ends', () => {
    expect(shiftCalendarDay('2026-03-15', -1)).toBe('2026-03-14');
    expect(shiftCalendarDay('2026-03-15', 1)).toBe('2026-03-16');
    expect(shiftCalendarDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftCalendarDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('MEM-DAY-002: hands a bound it cannot read straight back, so it fails upstream as before', () => {
    expect(shiftCalendarDay('not-a-day', -1)).toBe('not-a-day');
    expect(shiftCalendarDay('', 1)).toBe('');
  });
});


describe('isWithinLocalDayRange', () => {
  const at = (takenAt: string | null, localTakenAt?: string | null) => ({ takenAt, localTakenAt });

  it('MEM-DAY-010: reads the day off the local capture stamp when the provider sends one', () => {
    // 21:00 UTC on the 14th is already the 15th in Sydney, and Immich says so.
    expect(isWithinLocalDayRange(at('2026-03-14T21:00:00Z', '2026-03-15T08:00:00.000Z'), '2026-03-15', '2026-03-15')).toBe(true);
    // And the mirror: 22:00 UTC on the 15th is already the 16th there, so it
    // does not belong to the 15th however the UTC day reads.
    expect(isWithinLocalDayRange(at('2026-03-15T22:00:00Z', '2026-03-16T09:00:00.000Z'), '2026-03-15', '2026-03-15')).toBe(false);
  });

  it('MEM-DAY-011: falls back to the capture instant, which is the UTC day it always used', () => {
    expect(isWithinLocalDayRange(at('2026-03-15T23:30:00Z'), '2026-03-15', '2026-03-15')).toBe(true);
    expect(isWithinLocalDayRange(at('2026-03-16T00:30:00Z'), '2026-03-15', '2026-03-15')).toBe(false);
  });

  it('MEM-DAY-012: narrows only the bound it was given', () => {
    expect(isWithinLocalDayRange(at('2026-03-10T09:00:00Z'), '2026-03-15', undefined)).toBe(false);
    expect(isWithinLocalDayRange(at('2026-03-20T09:00:00Z'), '2026-03-15', undefined)).toBe(true);
    expect(isWithinLocalDayRange(at('2026-03-10T09:00:00Z'), undefined, '2026-03-15')).toBe(true);
    expect(isWithinLocalDayRange(at('2026-03-20T09:00:00Z'), undefined, '2026-03-15')).toBe(false);
    expect(isWithinLocalDayRange(at('2026-03-20T09:00:00Z'))).toBe(true);
  });

  it('MEM-DAY-013: keeps an asset with no usable timestamp rather than losing it', () => {
    expect(isWithinLocalDayRange(at(null), '2026-03-15', '2026-03-15')).toBe(true);
    expect(isWithinLocalDayRange(at('nope'), '2026-03-15', '2026-03-15')).toBe(true);
  });
});


describe('dayStartEpochSeconds', () => {
  it('MEM-DAY-020: with no offset it is the UTC midnight the window always used', () => {
    expect(dayStartEpochSeconds('2026-03-15')).toBe(Math.floor(new Date('2026-03-15').getTime() / 1000));
  });

  it('MEM-DAY-021: an eastern offset starts the day earlier in UTC, a western one later', () => {
    const utc = dayStartEpochSeconds('2026-03-15');
    // UTC+10 reaches midnight ten hours before UTC does.
    expect(dayStartEpochSeconds('2026-03-15', 600)).toBe(utc - 600 * 60);
    expect(dayStartEpochSeconds('2026-03-15', -480)).toBe(utc + 480 * 60);
  });

  it('MEM-DAY-022: a bound that is not a calendar day is parsed as before, offset ignored', () => {
    const instant = '2026-03-15T06:00:00Z';
    expect(dayStartEpochSeconds(instant, 600)).toBe(Math.floor(Date.parse(instant) / 1000));
    expect(Number.isNaN(dayStartEpochSeconds('nope'))).toBe(true);
  });
});

describe('describeFetchFailure', () => {
  it('MEM-FETCH-001: appends the reason undici keeps on cause', () => {
    const err = new TypeError('fetch failed', { cause: new Error('self-signed certificate') });
    expect(describeFetchFailure(err)).toBe('fetch failed (self-signed certificate)');
  });

  it('MEM-FETCH-002: an error without a cause reads exactly as before', () => {
    expect(describeFetchFailure(new Error('ECONNREFUSED'))).toBe('ECONNREFUSED');
  });

  it('MEM-FETCH-003: looks past a silent or repeated cause to the first one that says something', () => {
    const deep = new Error('fetch failed', {
      cause: new Error('', { cause: new Error('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND immich.lan') }) }),
    });
    expect(describeFetchFailure(deep)).toBe('fetch failed (getaddrinfo ENOTFOUND immich.lan)');
  });

  it('MEM-FETCH-004: a cause that is not an Error is ignored', () => {
    expect(describeFetchFailure(new Error('fetch failed', { cause: 'DEPTH_ZERO_SELF_SIGNED_CERT' }))).toBe('fetch failed');
  });

  it('MEM-FETCH-005: a rejection that is not an Error falls back to the old wording', () => {
    expect(describeFetchFailure('boom')).toBe('Connection failed');
  });

  it('MEM-FETCH-006: leaves out the advice Node adds for whoever runs the server', () => {
    const cause = new Error('self-signed certificate; if the root CA is installed locally, try running Node.js with --use-system-ca');
    expect(describeFetchFailure(new TypeError('fetch failed', { cause }))).toBe('fetch failed (self-signed certificate)');
  });
});
