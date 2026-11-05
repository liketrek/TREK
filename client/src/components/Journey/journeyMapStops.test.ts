// FE-JRN-STOPS-001 to FE-JRN-STOPS-007
import { describe, expect, it } from 'vitest';
import { compareJourneyEntries, isJourneyMapEntry, journeyMapStops, type JourneyStopEntry } from './journeyMapStops';

function entry(over: Partial<JourneyStopEntry> & { id: number }): JourneyStopEntry {
  return {
    entry_date: '2026-10-24',
    sort_order: 0,
    type: 'entry',
    title: 'Stop',
    location_lat: 35,
    location_lng: 135.7,
    ...over,
  };
}

function numbers(entries: JourneyStopEntry[]): Record<string, number | null> {
  return Object.fromEntries(journeyMapStops(entries).map(({ entry: e, stop }) => [String(e.id), stop]));
}

describe('journeyMapStops', () => {
  it('FE-JRN-STOPS-001: counts through the whole journey instead of restarting each day', () => {
    const entries = [
      entry({ id: 1, entry_date: '2026-10-23' }),
      entry({ id: 2, entry_date: '2026-10-23', sort_order: 1 }),
      entry({ id: 3, entry_date: '2026-10-23', sort_order: 2 }),
      entry({ id: 4, entry_date: '2026-10-24' }),
      entry({ id: 5, entry_date: '2026-10-24', sort_order: 1 }),
    ];

    expect(numbers(entries)).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });
  });

  it('FE-JRN-STOPS-002: numbers in reading order whatever order the entries arrive in', () => {
    const entries = [
      entry({ id: 9, entry_date: '2026-10-24', sort_order: 1 }),
      entry({ id: 7, entry_date: '2026-10-23' }),
      entry({ id: 8, entry_date: '2026-10-24', sort_order: 0 }),
    ];

    expect(journeyMapStops(entries).map((s) => s.entry.id)).toEqual([7, 8, 9]);
    expect(numbers(entries)).toEqual({ 7: 1, 8: 2, 9: 3 });
  });

  it('FE-JRN-STOPS-003: a sort_order tie is broken by id, as the server orders them', () => {
    const entries = [entry({ id: 12 }), entry({ id: 10 }), entry({ id: 11 })];

    expect(journeyMapStops(entries).map((s) => s.entry.id)).toEqual([10, 11, 12]);
    expect(compareJourneyEntries(entry({ id: 10 }), entry({ id: 11 }))).toBeLessThan(0);
  });

  it('FE-JRN-STOPS-004: a draft keeps its pin without a number and does not move the stops after it', () => {
    const entries = [
      entry({ id: 1, entry_date: '2026-10-23' }),
      entry({ id: 2, entry_date: '2026-10-23', sort_order: 1, is_draft: true }),
      entry({ id: 3, entry_date: '2026-10-24' }),
    ];

    expect(numbers(entries)).toEqual({ 1: 1, 2: null, 3: 2 });
    expect(numbers(entries.filter((e) => !e.is_draft))).toEqual({ 1: 1, 3: 2 });
  });

  it('FE-JRN-STOPS-005: skeletons, gallery placeholders and entries without coordinates stay off the map', () => {
    const entries = [
      entry({ id: 1, type: 'skeleton' }),
      entry({ id: 2, title: 'Gallery' }),
      entry({ id: 3, title: '[Trip Photos]' }),
      entry({ id: 4, location_lat: null, location_lng: null }),
      entry({ id: 5, sort_order: 1 }),
    ];

    expect(numbers(entries)).toEqual({ 5: 1 });
    expect(entries.map(isJourneyMapEntry)).toEqual([false, false, false, false, true]);
  });

  it('FE-JRN-STOPS-006: the owner journal and the share link give every published stop the same number', () => {
    const owner = [
      entry({ id: 21, entry_date: '2026-10-23' }),
      entry({ id: 22, entry_date: '2026-10-23', sort_order: 1, is_draft: true }),
      entry({ id: 23, entry_date: '2026-10-23', sort_order: 2 }),
      entry({ id: 24, entry_date: '2026-10-24', type: 'skeleton' }),
      entry({ id: 25, entry_date: '2026-10-24', sort_order: 1 }),
    ];
    const shared = owner.filter((e) => !e.is_draft && e.type !== 'skeleton');

    const ownerNumbers = numbers(owner);
    delete ownerNumbers[22];
    expect(ownerNumbers).toEqual(numbers(shared));
  });

  it('FE-JRN-STOPS-007: leaves the caller its list untouched', () => {
    const entries = [entry({ id: 2, sort_order: 1 }), entry({ id: 1 })];

    journeyMapStops(entries);

    expect(entries.map((e) => e.id)).toEqual([2, 1]);
  });
});
