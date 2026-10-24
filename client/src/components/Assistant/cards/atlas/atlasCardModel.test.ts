/**
 * FE-AI-ATLAS-MODEL-001 to FE-AI-ATLAS-MODEL-006
 *
 * The pure side of the atlas cards: the counters a run of atlas changes moves
 * as rows are ticked off, applied or discarded, a wish's month, the flags and
 * tiles that fit, and the continent a country counts for.
 */
import type { AtlasBucketCard, AtlasCountryCard, TrekCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import type { ChangeItem, ChangeState } from '../../assistantParts';
import { continentOf, densityLimits, shortDay, signedDelta, tallyLines, wishMonth } from './atlasCardModel';

function country(code: string, before: number, after: number | null, regionCode?: string): AtlasCountryCard {
  return {
    kind: 'atlasCountry',
    code,
    status: null,
    markedBy: null,
    placeCount: null,
    tripCount: null,
    trips: [],
    moreTrips: 0,
    places: [],
    morePlaces: 0,
    change: {
      op: 'mark',
      region: regionCode ? { code: regionCode, name: 'North', before: null, after: 'visited' } : null,
      after: after === null ? 'unknown' : 'visited',
      countries: { before, after },
      regions: regionCode ? { before: 1, after: 2 } : null,
    },
  };
}

const wish: AtlasBucketCard = {
  kind: 'atlasBucket',
  items: [
    {
      id: null,
      name: 'Patagonia',
      countryCode: 'AR',
      regionCode: null,
      targetDate: null,
      notes: null,
      reachedOn: null,
      reachedFrom: null,
    },
  ],
  more: 0,
  change: { op: 'add', before: null, duplicate: false, wishes: { before: 7, after: 8 } },
};

function item(id: string, card: TrekCard, state: ChangeState = 'pending'): ChangeItem {
  return { toolCallId: id, preview: null, applied: null, state, card };
}

const NONE: ReadonlySet<string> = new Set();

describe('atlasCardModel', () => {
  it('FE-AI-ATLAS-MODEL-001: waiting changes move the counter by what each ticked row adds, an unknown one by nothing', () => {
    const items = [
      item('a', country('JP', 23, 24)),
      item('b', country('KR', 23, 24)),
      item('c', country('TH', 23, null)),
    ];
    expect(tallyLines(items, NONE)).toEqual([
      { key: 'countries', what: 'countries', country: null, before: 23, after: 25, phase: 'pending' },
    ]);
    expect(tallyLines(items, new Set(['b']))[0]).toMatchObject({ before: 23, after: 24 });
    expect(tallyLines([item('w', wish)], NONE)).toEqual([
      { key: 'wishes', what: 'wishes', country: null, before: 7, after: 8, phase: 'pending' },
    ]);
  });

  it('FE-AI-ATLAS-MODEL-002: a region change adds the regions of its country; discarded or expired changes count for nothing', () => {
    const lines = tallyLines([item('a', country('JP', 23, 24, 'JP-01'))], NONE);
    expect(lines.map((line) => line.key)).toEqual(['countries', 'regions-JP']);
    expect(lines[1]).toMatchObject({ what: 'regions', country: 'JP', before: 1, after: 2 });
    const settled = [item('a', country('JP', 23, 24), 'discarded'), item('b', country('KR', 23, 24), 'expired')];
    expect(tallyLines(settled, NONE)).toEqual([]);
  });

  it('FE-AI-ATLAS-MODEL-003: while applying the counter shimmers, once applied it shows the exact count the write answered', () => {
    const applying = [item('a', country('JP', 23, 24), 'applying'), item('b', country('KR', 23, 24), 'applying')];
    expect(tallyLines(applying, NONE)[0]).toMatchObject({ after: 25, phase: 'applying' });
    const applied = [item('a', country('JP', 23, 24), 'applied'), item('b', country('KR', 24, 24), 'applied')];
    expect(tallyLines(applied, NONE)[0]).toMatchObject({ before: 23, after: 24, phase: 'applied' });
  });

  it('FE-AI-ATLAS-MODEL-004: a wish month reads as month and year, a year alone as the year', () => {
    expect(wishMonth('2027', 'en')).toBe('2027');
    expect(wishMonth('2027-05', 'en')).toBe('May 2027');
    expect(wishMonth('2027-05-14', 'de')).toBe('Mai 2027');
    expect(wishMonth(null, 'en')).toBeNull();
    expect(shortDay('2024-04-03', 'en')).toBe('Apr 3, 2024');
    expect(shortDay('soon', 'en')).toBe('soon');
  });

  it('FE-AI-ATLAS-MODEL-005: more flags and tiles fit a roomy chat; a country counts for its continent', () => {
    expect(densityLimits(false)).toEqual({ flags: 16, wishes: 6 });
    expect(densityLimits(true)).toEqual({ flags: 24, wishes: 9 });
    expect(continentOf('JP')).toBe('Asia');
    expect(continentOf('ZZ')).toBe('Other');
    expect(signedDelta(2, 'en')).toBe('+2');
    expect(signedDelta(-1, 'en')).toBe('-1');
    expect(signedDelta(0, 'en')).toBe('');
  });

  it('FE-AI-ATLAS-MODEL-006: a country or a region counts once however many waiting changes touch it', () => {
    // Japan and Tokyo in one turn: one more country, one more region.
    const japanAndTokyo = tallyLines(
      [item('a', country('JP', 23, 24)), item('b', country('JP', 23, 24, 'JP-13'))],
      NONE
    );
    expect(japanAndTokyo).toEqual([
      { key: 'countries', what: 'countries', country: null, before: 23, after: 24, phase: 'pending' },
      { key: 'regions-JP', what: 'regions', country: 'JP', before: 1, after: 2, phase: 'pending' },
    ]);
    // Two regions of a country not visited yet: one more country, two more regions.
    const twoRegions = tallyLines(
      [item('a', country('KR', 23, 24, 'KR-11')), item('b', country('KR', 23, 24, 'KR-26'))],
      NONE
    );
    expect(twoRegions.map((line) => [line.key, line.after])).toEqual([
      ['countries', 24],
      ['regions-KR', 3],
    ]);
    // The same country twice, the same region twice: each counts once.
    const twice = [item('a', country('JP', 23, 24)), item('b', country('JP', 23, 24))];
    expect(tallyLines(twice, NONE)[0]?.after).toBe(24);
    const tokyoTwice = [item('a', country('JP', 23, 24, 'JP-13')), item('b', country('JP', 23, 24, 'JP-13'))];
    const sameRegion = tallyLines(tokyoTwice, NONE);
    expect(sameRegion.map((line) => line.after)).toEqual([24, 2]);
    // Switching one of the two off keeps the other's move.
    expect(tallyLines(twice, new Set(['a']))[0]?.after).toBe(24);
    // Once Japan landed, a waiting Tokyo adds no country on top of the exact count.
    const tokyo = item('b', country('JP', 23, 24, 'JP-13'));
    const landed = tallyLines([item('a', country('JP', 23, 24), 'applied'), tokyo], NONE);
    expect(landed[0]).toMatchObject({ key: 'countries', after: 24, phase: 'applying' });
  });
});
