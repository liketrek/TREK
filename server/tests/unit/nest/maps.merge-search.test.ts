/**
 * MAPS-MERGE-001..008 — showing the index's answer and OpenStreetMap's together.
 *
 * Why this exists, in numbers. 128 places out of a real trip to Japan, all
 * saved through the old search, replayed against the index: 51.6 percent came
 * back inside the top five. For most of the rest the index returned the shops
 * AROUND the landmark instead of nothing, which is worse than nothing, because
 * ten plausible wrong answers look like an answer and the user never learns the
 * temple was one query away in OpenStreetMap.
 */
import { describe, it, expect } from 'vitest';
import { mergeSearchResults } from '../../../src/nest/maps/maps.helpers';

const p = (name: string, lat: number, lng: number, source: string) => ({
  name,
  lat,
  lng,
  source,
  osm_id: `${source}:${name}`,
});

describe('mergeSearchResults', () => {
  it('MAPS-MERGE-001: puts the landmark second, not eleventh', () => {
    // The Hase-dera case. The index has the shops around the temple and not the
    // temple; OpenStreetMap has the temple, under its Japanese name.
    const index = Array.from({ length: 10 }, (_, i) =>
      p(`Shop ${i}`, 35.31 + i / 1000, 139.53, 'trek-places'),
    );
    const osm = [p('長谷寺', 35.3125, 139.5335, 'openstreetmap')];
    const out = mergeSearchResults(index, osm);
    expect(out[1].name).toBe('長谷寺');
  });

  it('MAPS-MERGE-002: leaves a good index match at the top', () => {
    const index = [p("L'Osteria Rostock", 54.0879, 12.1408, 'trek-places')];
    const osm = [p('Steinstrasse', 54.09, 12.15, 'openstreetmap')];
    expect(mergeSearchResults(index, osm)[0].name).toBe("L'Osteria Rostock");
  });

  it('MAPS-MERGE-003: keeps one copy of a place both sources know', () => {
    // The index's copy, because that is the one carrying a stable id, contact
    // details and hours.
    const index = [p("L'Osteria", 54.0879, 12.1408, 'trek-places')];
    const osm = [p("L'Osteria", 54.08792, 12.14082, 'openstreetmap')];
    const out = mergeSearchResults(index, osm);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('trek-places');
  });

  it('MAPS-MERGE-004: two neighbouring shops both survive', () => {
    // 60 m is the dedupe distance, and the names have to agree as well: a
    // temple and the coffee shop at its gate are closer than that.
    const index = [p('Bakery A', 54.0879, 12.1408, 'trek-places')];
    const osm = [p('Bakery B', 54.0889, 12.1408, 'openstreetmap')];
    expect(mergeSearchResults(index, osm)).toHaveLength(2);
  });

  it('MAPS-MERGE-005: a source that answered nothing changes nothing', () => {
    const index = [p("L'Osteria", 54.0879, 12.1408, 'trek-places')];
    expect(mergeSearchResults(index, [])).toEqual(index);
    expect(mergeSearchResults([], index)).toEqual(index);
  });

  it('MAPS-MERGE-006: alternates, index first, and keeps each order intact', () => {
    const index = [p('I1', 1, 1, 'trek-places'), p('I2', 2, 2, 'trek-places')];
    const osm = [p('O1', 3, 3, 'openstreetmap'), p('O2', 4, 4, 'openstreetmap')];
    expect(mergeSearchResults(index, osm).map((r) => r.name)).toEqual(['I1', 'O1', 'I2', 'O2']);
  });

  it('MAPS-MERGE-007: honours the cap without cutting mid-pair', () => {
    const many = Array.from({ length: 12 }, (_, i) => p(`Place ${i}`, 50 + i, 10 + i, 'trek-places'));
    const other = Array.from({ length: 12 }, (_, i) => p(`Other ${i}`, 20 + i, 30 + i, 'openstreetmap'));
    expect(mergeSearchResults(many, other, 5)).toHaveLength(5);
  });

  it('MAPS-MERGE-008: a result without coordinates is kept, not deduped away', () => {
    // Nominatim occasionally answers with an unparseable coordinate. Dropping
    // the row would lose a result; treating it as "not near anything" keeps it.
    const index = [p('A', 54, 12, 'trek-places')];
    const osm = [{ name: 'B', lat: null, lng: null, source: 'openstreetmap' }];
    expect(mergeSearchResults(index, osm)).toHaveLength(2);
  });

  it('MAPS-MERGE-009: one copy of a place both sources name in the local script', () => {
    // The word split is `[^a-z0-9]`, so a name written in any non-Latin script
    // tokenised to nothing and the dedup could never fire — the very corpus this
    // feature was measured on. The user saw 長谷寺 twice, one row under the other,
    // and picking either one gave the place a different id.
    for (const name of ['長谷寺', '東京タワー', '스타벅스', 'Ακρόπολη', 'Кремль', 'مسجد الشيخ زايد']) {
      const index = [p(name, 35.3125, 139.5335, 'trek-places')];
      const osm = [p(name, 35.3126, 139.5336, 'openstreetmap')];
      const out = mergeSearchResults(index, osm);
      expect(out, name).toHaveLength(1);
      expect(out[0].source, name).toBe('trek-places');
    }
  });

  it('MAPS-MERGE-010: two different places at one address stay two places', () => {
    // The other half of the same rule, and the one that costs a real result if
    // it goes wrong: sharing a character is not being the same thing. 東京 is in
    // both of these, and a station is not a tower.
    const index = [p('東京タワー', 35.6586, 139.7454, 'trek-places')];
    const osm = [p('東京タワー駅前郵便局', 35.6587, 139.7455, 'openstreetmap')];
    expect(mergeSearchResults(index, osm)).toHaveLength(2);
  });

  it('MAPS-MERGE-011: width variants of the same name are still the same name', () => {
    // The two sources disagree on half-width and full-width katakana for the
    // same official name. NFKC folds them; NFD, which the Latin path uses,
    // does not.
    const index = [p('東京ﾀﾜｰ', 35.6586, 139.7454, 'trek-places')];
    const osm = [p('東京タワー', 35.6586, 139.7454, 'openstreetmap')];
    expect(mergeSearchResults(index, osm)).toHaveLength(1);
  });

  it('MAPS-MERGE-012: a local name and a romanised one are not merged on a guess', () => {
    // Nothing here can tell that these are one temple, and inventing the link
    // would swallow whichever copy the ranker put second. Two rows is the honest
    // answer; MAPS-MERGE-001 is the case that makes it useful.
    const index = [p('Hase-dera', 35.3125, 139.5335, 'trek-places')];
    const osm = [p('長谷寺', 35.3125, 139.5335, 'openstreetmap')];
    expect(mergeSearchResults(index, osm)).toHaveLength(2);
  });
});
