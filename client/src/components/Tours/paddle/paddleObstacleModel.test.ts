// FE-PADDLE-OBSMODEL-001 to FE-PADDLE-OBSMODEL-016: what the obstacle card and the route band show of a paddle object.
import { describe, expect, it } from 'vitest';

import {
  paddleObstacleKindSchema,
  type PaddleCoverageRegion,
  type PaddleFeature,
  type RelatedObstacle,
} from '@trek/shared';

import {
  isBlockingKind,
  metresOf,
  OBSTACLE_FACT_KEYS,
  osmUrlOf,
  paddleObstacleDetail,
  routeStripObstacles,
} from './paddleObstacleModel';

/** A weir in the Upper Palatinate unless told otherwise. */
function feature(ref: string, overrides: Partial<PaddleFeature> = {}): PaddleFeature {
  return {
    ref,
    kind: 'weir',
    group_key: null,
    name: null,
    geometry: { type: 'Point', coordinates: [12.1301, 49.1231] },
    tags: {},
    tag_hash: ref,
    region_id: 'oberpfalz',
    ...overrides,
  };
}

/** How the route meets an object: on it where it crosses, or near it, 80 m off. */
function relate(target: PaddleFeature, relation: RelatedObstacle['relation'], alongM: number): RelatedObstacle {
  return { feature: target, relation, distanceM: relation === 'on_route' ? 0 : 80, alongM };
}

function region(id: string, sourceTimestamp: string | null): PaddleCoverageRegion {
  return { id, name: id, source_timestamp: sourceTimestamp, imported_at: '2026-10-02T06:00:00Z' };
}

/** The card's view of one picked object among the loaded ones. */
function detailOf(
  picked: PaddleFeature,
  context: { related?: RelatedObstacle[]; regions?: PaddleCoverageRegion[] } = {}
) {
  return paddleObstacleDetail({
    features: [feature('node/999'), picked],
    related: context.related ?? [],
    regions: context.regions ?? [],
    selectedRef: picked.ref,
  });
}

describe('osmUrlOf', () => {
  it('FE-PADDLE-OBSMODEL-001: links the object in OpenStreetMap by its own reference', () => {
    expect(osmUrlOf('way/29256405')).toBe('https://www.openstreetmap.org/way/29256405');
    expect(osmUrlOf('node/17')).toBe('https://www.openstreetmap.org/node/17');
  });
});

describe('isBlockingKind', () => {
  it('FE-PADDLE-OBSMODEL-003: counts obstacles and access rules, never the places and ways that help', () => {
    const blocking = paddleObstacleKindSchema.options.filter((kind) => isBlockingKind(kind));
    const helping = paddleObstacleKindSchema.options.filter((kind) => !isBlockingKind(kind));
    expect(blocking).toEqual(['weir', 'dam', 'lock', 'lock_gate', 'waterfall', 'rapids', 'hazard', 'access']);
    expect(helping).toEqual(['put_in', 'egress', 'slipway', 'portage']);
  });
});

describe('paddleObstacleDetail', () => {
  it('FE-PADDLE-OBSMODEL-004: knows nothing when nothing is picked or the picked object is no longer loaded', () => {
    const state = { features: [feature('node/1')], related: [], regions: [] };
    expect(paddleObstacleDetail({ ...state, selectedRef: null })).toBeNull();
    expect(paddleObstacleDetail({ ...state, selectedRef: '' })).toBeNull();
    expect(paddleObstacleDetail({ ...state, selectedRef: 'node/2' })).toBeNull();
  });

  it('FE-PADDLE-OBSMODEL-005: leaves an object only in the area in the area, without a distance or a place on the route', () => {
    const weir = feature('way/7', { name: 'Wehr Lindenmühle' });
    const detail = detailOf(weir, { related: [relate(feature('way/8'), 'on_route', 300)] });
    expect(detail).toMatchObject({ feature: weir, relation: 'area', distanceM: null, alongM: null });
  });

  it('FE-PADDLE-OBSMODEL-006: carries how its own related entry stands to the route, a crossing at the start included', () => {
    const weir = feature('way/7');
    const crossed = detailOf(weir, { related: [relate(weir, 'on_route', 0)] });
    expect(crossed).toMatchObject({ relation: 'on_route', distanceM: 0, alongM: 0 });
    const passed = detailOf(weir, { related: [relate(feature('way/8'), 'near', 40), relate(weir, 'near', 1200)] });
    expect(passed).toMatchObject({ relation: 'near', distanceM: 80, alongM: 1200 });
  });

  it('FE-PADDLE-OBSMODEL-007: dates the data by the region the object came from, and leaves the date unknown otherwise', () => {
    const weir = feature('way/7');
    const regions = [region('bayern', '2026-09-01T00:00:00Z'), region('oberpfalz', '2026-10-01T21:14:02Z')];
    expect(detailOf(weir, { regions })?.dataAsOf).toBe('2026-10-01T21:14:02Z');
    expect(detailOf(weir, { regions: [region('oberpfalz', null)] })?.dataAsOf).toBeNull();
    expect(detailOf(weir, { regions: [region('bayern', '2026-09-01T00:00:00Z')] })?.dataAsOf).toBeNull();
    expect(detailOf(weir)?.dataAsOf).toBeNull();
  });

  it('FE-PADDLE-OBSMODEL-008: reads the access rule canoe first with its condition, and an untagged object has none', () => {
    const rule = feature('way/7', {
      kind: 'access',
      tags: { canoe: 'no', boat: 'yes', 'canoe:conditional': 'yes @ (Jun-Sep)' },
    });
    expect(detailOf(rule)?.access).toEqual({
      value: 'no',
      source: 'canoe',
      condition: 'yes @ (Jun-Sep)',
      forbidden: true,
      private: false,
    });
    expect(detailOf(feature('way/8'))?.access).toEqual({
      value: null,
      source: null,
      condition: null,
      forbidden: false,
      private: false,
    });
  });

  it('FE-PADDLE-OBSMODEL-009: calls a carrying way private on a private tag of its own or of the way, and nothing else', () => {
    const carryWay = (tags: Record<string, string>) => detailOf(feature('way/9', { kind: 'portage', tags }));
    expect(carryWay({ access: 'private' })?.privateWay).toBe(true);
    expect(carryWay({ canoe: 'yes', 'portage:access': 'private' })?.privateWay).toBe(true);
    expect(carryWay({ canoe: 'yes', access: 'private' })?.privateWay).toBe(true);
    // The carrying way's own tag speaks over the general one.
    expect(carryWay({ canoe: 'yes', access: 'private', 'portage:access': 'yes' })?.privateWay).toBe(false);
    expect(carryWay({})?.privateWay).toBe(false);
    // Only a carrying way is a way round: a private weir is still an obstacle, not a private way.
    expect(detailOf(feature('way/10', { tags: { access: 'private' } }))?.privateWay).toBe(false);
  });

  it('FE-PADDLE-OBSMODEL-010: names the facts it has a label for in its own order, trimmed, and leaves the rest behind', () => {
    const lock = feature('way/11', {
      kind: 'lock',
      tags: {
        operator: ' WSA Donau-MDK ',
        lock: 'yes',
        height: '2.5',
        fee: 'yes',
        seasonal: '   ',
        'whitewater:section_grade': 'II',
        width: '',
        opening_hours: 'Mo-Su 08:00-18:00',
      },
    });
    expect(detailOf(lock)?.facts).toEqual([
      { key: 'height', value: '2.5' },
      { key: 'whitewater:section_grade', value: 'II' },
      { key: 'opening_hours', value: 'Mo-Su 08:00-18:00' },
      { key: 'fee', value: 'yes' },
      { key: 'operator', value: 'WSA Donau-MDK' },
    ]);
    const everything = Object.fromEntries(OBSTACLE_FACT_KEYS.map((key): [string, string] => [key, '1']));
    const named = detailOf(feature('way/12', { tags: everything }))?.facts.map((fact) => fact.key);
    expect(named).toEqual([...OBSTACLE_FACT_KEYS]);
    expect(detailOf(feature('way/13'))?.facts).toEqual([]);
  });

  it('FE-PADDLE-OBSMODEL-011: shows the description before the note, as written, and no note when both are empty', () => {
    const noteOf = (tags: Record<string, string>) => detailOf(feature('way/14', { tags }))?.note;
    expect(noteOf({ description: ' Portage path ', note: 'Steps are slippery' })).toBe('Portage path');
    expect(noteOf({ description: '  ', note: ' Steps are slippery ' })).toBe('Steps are slippery');
    expect(noteOf({ note: '' })).toBeNull();
    expect(noteOf({})).toBeNull();
  });
});

describe('routeStripObstacles', () => {
  it('FE-PADDLE-OBSMODEL-012: places each obstacle by its share of the measured route on a band of another length', () => {
    const weir = feature('way/1', { name: 'Wehr Lindenmühle' });
    const lock = feature('way/2', { kind: 'lock' });
    const strip = routeStripObstacles([relate(weir, 'on_route', 500), relate(lock, 'near', 1500)], 2000, 3000);
    expect(strip).toEqual([
      { ref: 'way/1', kind: 'weir', name: 'Wehr Lindenmühle', relation: 'on_route', atM: 750 },
      { ref: 'way/2', kind: 'lock', name: null, relation: 'near', atM: 2250 },
    ]);
  });

  it('FE-PADDLE-OBSMODEL-013: marks only what a paddler decides about there, leaving access rules to the map and the card', () => {
    const all = paddleObstacleKindSchema.options.map((kind) => relate(feature(kind, { kind }), 'near', 100));
    const kinds = routeStripObstacles(all, 1000, 1000).map((entry) => entry.kind);
    expect(kinds).toEqual(['weir', 'dam', 'lock', 'lock_gate', 'waterfall', 'rapids', 'hazard']);
  });

  it('FE-PADDLE-OBSMODEL-014: keeps an object before the start or past the measured end on the band', () => {
    const before = relate(feature('way/1'), 'near', -40);
    const past = relate(feature('way/2'), 'on_route', 2600);
    expect(routeStripObstacles([before, past], 2500, 2000).map((entry) => entry.atM)).toEqual([0, 2000]);
  });

  it('FE-PADDLE-OBSMODEL-015: marks nothing on a route or a band without a length', () => {
    const related = [relate(feature('way/1'), 'on_route', 100)];
    expect(routeStripObstacles(related, 0, 1000)).toEqual([]);
    expect(routeStripObstacles(related, -5, 1000)).toEqual([]);
    expect(routeStripObstacles(related, 1000, 0)).toEqual([]);
    expect(routeStripObstacles([], 1000, 1000)).toEqual([]);
  });
});

describe('metresOf', () => {
  it('FE-PADDLE-OBSMODEL-016: reads a bare number as metres and leaves units and words to be shown as written', () => {
    expect(metresOf('2')).toBe(2);
    expect(metresOf('1.5')).toBe(1.5);
    expect(metresOf('0.75')).toBe(0.75);
    const worded = ['2 m', '1,5', '6 ft', 'about 3', '.5', '1.', '-1', ' 2', ''];
    expect(worded.map((value) => metresOf(value))).toEqual(worded.map(() => null));
  });
});
