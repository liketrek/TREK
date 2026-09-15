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
import { sortAssetsByTakenAtDesc } from '../../../src/nest/memories/memories.helpers';

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
