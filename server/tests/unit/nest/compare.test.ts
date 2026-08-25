/**
 * byCodeUnit restates what a bare `.sort()` already did, so the contract is
 * "identical to the default order" — and that is what these check, against the
 * default rather than against hand-written expectations.
 */
import { describe, it, expect } from 'vitest';
import { byCodeUnit } from '../../../src/nest/common/compare';

describe('byCodeUnit', () => {
  it('CMP-001: reports less, greater and equal', () => {
    expect(byCodeUnit('a', 'b')).toBe(-1);
    expect(byCodeUnit('b', 'a')).toBe(1);
    expect(byCodeUnit('a', 'a')).toBe(0);
  });

  it('CMP-002: orders ISO dates chronologically, which is why the callers can use it', () => {
    expect(['2026-03-01', '2026-01-15', '2026-02-28'].sort(byCodeUnit))
      .toEqual(['2026-01-15', '2026-02-28', '2026-03-01']);
  });

  it('CMP-003: reproduces the default sort exactly for the ASCII the callers pass', () => {
    const samples = [
      ['EUR', 'usd', 'CHF', 'JPY'],
      ['b', 'A', 'a', 'B', ''],
      ['plugin:one', 'plugin:One', 'plugin:1', 'plugin:'],
      ['2026-01-01', '2026-1-1', '2026-01-1'],
      ['x'],
      [],
    ];
    for (const sample of samples) {
      expect([...sample].sort(byCodeUnit)).toEqual([...sample].sort());
    }
  });

  it('CMP-004: is NOT locale-aware — the reason the doc comment warns callers off names', () => {
    // Code-unit order files every accented word behind the whole ASCII range.
    // A list a person reads wants localeCompare instead; this asserts the
    // difference so nobody reaches for byCodeUnit there by accident.
    expect(['Zelt', 'Übernachtung'].sort(byCodeUnit)).toEqual(['Zelt', 'Übernachtung']);
    expect(['Zelt', 'Übernachtung'].sort((a, b) => a.localeCompare(b, 'de')))
      .toEqual(['Übernachtung', 'Zelt']);
  });
});
