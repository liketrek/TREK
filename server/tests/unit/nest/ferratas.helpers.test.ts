import {
  FERRATA_QUERY_TIMEOUT_S,
  buildFerrataQuery,
  ferrataTileBlocks,
  ferrataTileKeysFor,
  ferrataTilesBbox,
  parseFerrataGrade,
  snapFerrataBbox,
  splitFerratasByTile,
  toFerratas,
} from '../../../src/nest/ferratas/ferratas.helpers';
import { FERRATAS_RESULT_CAP, type Ferrata } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const line = [
  { lat: 47.1, lon: 11.2 },
  { lat: 47.11, lon: 11.21 },
];
const way = (id: number, tags: Record<string, string> = {}, geometry: unknown = line) => ({
  type: 'way',
  id,
  tags: { highway: 'via_ferrata', ...tags },
  geometry,
});

describe('parseFerrataGrade', () => {
  it.each([
    ['0', 0, null],
    ['3', 3, null],
    ['6', 6, null],
    ['2+', 2, '+'],
    ['4-', 4, '-'],
    [' 5 ', 5, null],
  ])('reads %j as level %s', (raw, level, plus) => {
    expect(parseFerrataGrade(raw)).toEqual({ raw: raw.trim(), level, plus });
  });

  it.each(['7', '-1', 'C', 'C/D', 'K3', '2++', '3 +', 'difficult', '2.5'])('keeps %j as unknown', (raw) => {
    expect(parseFerrataGrade(raw)).toEqual({ raw, level: null, plus: null });
  });

  it('answers all null for a missing or blank tag', () => {
    expect(parseFerrataGrade(undefined)).toEqual({ raw: null, level: null, plus: null });
    expect(parseFerrataGrade('   ')).toEqual({ raw: null, level: null, plus: null });
  });

  it('cuts an overlong raw value to what the contract holds', () => {
    expect(parseFerrataGrade('x'.repeat(100)).raw).toHaveLength(64);
  });
});

describe('snapFerrataBbox', () => {
  it('grows the box outwards to the 0.05 degree grid', () => {
    expect(snapFerrataBbox({ south: 47.12, west: 11.21, north: 47.38, east: 11.57 })).toEqual({
      south: 47.1,
      west: 11.2,
      north: 47.4,
      east: 11.6,
    });
  });

  it('leaves a box already on the grid as it is', () => {
    const onGrid = { south: 47.1, west: 11.2, north: 47.4, east: 11.6 };
    expect(snapFerrataBbox(onGrid)).toEqual(onGrid);
  });

  it('handles negative coordinates and clamps to the globe', () => {
    expect(snapFerrataBbox({ south: -89.99, west: -179.99, north: -89.9, east: -179.9 })).toEqual({
      south: -90,
      west: -180,
      north: -89.9,
      east: -179.9,
    });
  });
});

describe('ferrataTileKeysFor', () => {
  it('names every whole cell the snapped box covers, south to north and west to east', () => {
    expect(ferrataTileKeysFor({ south: 47.12, west: 11.21, north: 47.18, east: 11.29 }, 200)).toEqual([
      '942,224',
      '942,225',
      '943,224',
      '943,225',
    ]);
  });

  it('gives two nearby requests the same cells', () => {
    const a = ferrataTileKeysFor({ south: 47.11, west: 11.21, north: 47.39, east: 11.59 }, 200);
    const b = ferrataTileKeysFor({ south: 47.12, west: 11.22, north: 47.38, east: 11.58 }, 200);
    expect(a).toEqual(b);
    expect(a).toHaveLength(6 * 8);
  });

  it('a box on the grid covers exactly its own cells', () => {
    expect(ferrataTileKeysFor({ south: 47.1, west: 11.2, north: 47.15, east: 11.25 }, 200)).toEqual(['942,224']);
  });

  it('keys cells south of the equator and west of Greenwich by negative indices', () => {
    expect(ferrataTileKeysFor({ south: -0.04, west: -0.04, north: 0.04, east: 0.04 }, 200)).toEqual([
      '-1,-1',
      '-1,0',
      '0,-1',
      '0,0',
    ]);
  });

  it('answers null for a box over the cell cap instead of walking it', () => {
    expect(ferrataTileKeysFor({ south: 47, west: 11, north: 48, east: 12 }, 200)).toBeNull();
    expect(ferrataTileKeysFor({ south: 47, west: 11, north: 47.5, east: 11.5 }, 100)).toHaveLength(100);
    expect(ferrataTileKeysFor({ south: 47, west: 11, north: 47.5, east: 11.5 }, 99)).toBeNull();
  });
});

describe('ferrataTileBlocks', () => {
  it('groups cells into the grid-aligned blocks of two by two that one query covers', () => {
    expect(ferrataTileBlocks(['942,224', '942,225', '943,224', '944,224', '942,226', '-1,-1', '-2,-1'])).toEqual([
      ['942,224', '942,225', '943,224'],
      ['944,224'],
      ['942,226'],
      ['-1,-1', '-2,-1'],
    ]);
    expect(ferrataTileBlocks([])).toEqual([]);
  });

  it('refuses a key that is not a cell', () => {
    expect(() => ferrataTileBlocks(['nope'])).toThrow(/tile key/);
  });
});

describe('ferrataTilesBbox', () => {
  it('bounds one cell by its own edges', () => {
    expect(ferrataTilesBbox(['942,224'])).toEqual({ south: 47.1, west: 11.2, north: 47.15, east: 11.25 });
  });

  it('bounds scattered cells by one box around all of them', () => {
    expect(ferrataTilesBbox(['942,230', '945,224', '-1,-1'])).toEqual({
      south: -0.05,
      west: -0.05,
      north: 47.3,
      east: 11.55,
    });
  });

  it('refuses no cells and a key that is not a cell', () => {
    expect(() => ferrataTilesBbox([])).toThrow();
    expect(() => ferrataTilesBbox(['947.1,11'])).toThrow(/tile key/);
    expect(() => ferrataTilesBbox(['1,2,3'])).toThrow(/tile key/);
  });
});

describe('splitFerratasByTile', () => {
  const ferrata = (id: string, geometry: [number, number][]): Ferrata => ({
    id,
    name: null,
    grade: { raw: null, level: null, plus: null },
    routeName: null,
    geometry,
    osmUrl: `https://www.openstreetmap.org/${id}`,
  });

  it('hands a ferrata to every asked cell a point of its line lies in', () => {
    const crossing = ferrata('way/1', [
      [47.12, 11.21],
      [47.17, 11.21],
    ]);
    const byTile = splitFerratasByTile([crossing], new Set(['942,224', '943,224', '942,225']));
    expect(byTile.get('942,224')).toEqual([crossing]);
    expect(byTile.get('943,224')).toEqual([crossing]);
    expect(byTile.get('942,225')).toEqual([]);
  });

  it('counts a point on a cell edge for the cells on both sides', () => {
    const onCorner = ferrata('way/2', [
      [47.15, 11.25],
      [47.15, 11.25],
    ]);
    const byTile = splitFerratasByTile([onCorner], new Set(['942,224', '942,225', '943,224', '943,225']));
    expect([...byTile.values()].every((list) => list.length === 1)).toBe(true);
  });

  it('gives every asked cell a list, empty where nothing lies, and leaves cells it was not asked about out', () => {
    const elsewhere = ferrata('way/3', [
      [46.51, 12.06],
      [46.52, 12.07],
    ]);
    const byTile = splitFerratasByTile([elsewhere], new Set(['942,224']));
    expect([...byTile.entries()]).toEqual([['942,224', []]]);
  });
});

describe('buildFerrataQuery', () => {
  const query = buildFerrataQuery({ south: 47.1, west: 11.2, north: 47.4, east: 11.6 });

  it('carries the server-side timeout and JSON output', () => {
    expect(query.startsWith(`[out:json][timeout:${FERRATA_QUERY_TIMEOUT_S}];`)).toBe(true);
  });

  it('asks for the tagged ways, the scaled paths and the route members inside the box', () => {
    const box = '(47.1,11.2,47.4,11.6)';
    expect(query).toContain(`way["highway"="via_ferrata"]${box};`);
    expect(query).toContain(`way["highway"~"^(path|footway)$"]["via_ferrata_scale"]${box};`);
    expect(query).toContain(`rel["route"="via_ferrata"]${box}->.routes;`);
    expect(query).toContain(`way(r.routes)${box};`);
  });

  it('asks for one way more than the cap, with geometry, and the relations with their members', () => {
    expect(query).toContain(`.ways out geom qt ${FERRATAS_RESULT_CAP + 1};`);
    expect(query).toContain('.routes out body qt;');
  });
});

describe('toFerratas', () => {
  it('maps a way to the wire row', () => {
    const { ferratas, truncated } = toFerratas([way(42, { name: ' Pisciadù ', via_ferrata_scale: '3+' })]);
    expect(truncated).toBe(false);
    expect(ferratas).toEqual([
      {
        id: 'way/42',
        name: 'Pisciadù',
        grade: { raw: '3+', level: 3, plus: '+' },
        routeName: null,
        geometry: [
          [47.1, 11.2],
          [47.11, 11.21],
        ],
        osmUrl: 'https://www.openstreetmap.org/way/42',
      },
    ]);
  });

  it('names a way after the first named route relation that holds it', () => {
    const { ferratas } = toFerratas([
      way(1),
      way(2),
      { type: 'relation', id: 9, tags: { route: 'via_ferrata' }, members: [{ type: 'way', ref: 1, role: '' }] },
      {
        type: 'relation',
        id: 10,
        tags: { route: 'via_ferrata', name: 'Via delle Bocchette' },
        members: [
          { type: 'node', ref: 2, role: '' },
          { type: 'way', ref: 1, role: '' },
        ],
      },
      { type: 'relation', id: 11, tags: { name: 'Second' }, members: [{ type: 'way', ref: 1, role: '' }] },
    ]);
    expect(ferratas.map((f) => [f.id, f.routeName])).toEqual([
      ['way/1', 'Via delle Bocchette'],
      ['way/2', null],
    ]);
  });

  it('leaves out malformed elements, duplicates and lines that cannot be drawn', () => {
    const { ferratas } = toFerratas([
      null,
      'way',
      { type: 'node', id: 3, lat: 1, lon: 2 },
      { type: 'way', id: -1, geometry: line },
      way(5, {}, [{ lat: 47.1, lon: 11.2 }, null]),
      { type: 'way', id: 6, tags: { highway: 'via_ferrata' } },
      way(7, {}, [{ lat: 470, lon: 11.2 }, line[1]]),
      way(8),
      way(8),
      way(9, {}, [line[0], null, line[1]]),
    ]);
    expect(ferratas.map((f) => f.id)).toEqual(['way/8', 'way/9']);
    expect(ferratas[1]?.geometry).toHaveLength(2);
  });

  it('keeps a blank name as null', () => {
    expect(toFerratas([way(1, { name: '  ' })]).ferratas[0]?.name).toBeNull();
  });

  it('cuts at the cap and says so', () => {
    const many = Array.from({ length: FERRATAS_RESULT_CAP + 1 }, (_, i) => way(i + 1));
    const { ferratas, truncated } = toFerratas(many);
    expect(truncated).toBe(true);
    expect(ferratas).toHaveLength(FERRATAS_RESULT_CAP);
  });

  it('stays truncated when Overpass hit the cap but a dropped way brings the rows under it', () => {
    const many = Array.from({ length: FERRATAS_RESULT_CAP }, (_, i) => way(i + 1));
    const { ferratas, truncated } = toFerratas([...many, way(FERRATAS_RESULT_CAP + 1, {}, [{ lat: 46.5, lon: 11.7 }])]);
    expect(ferratas).toHaveLength(FERRATAS_RESULT_CAP);
    expect(truncated).toBe(true);
  });

  it('is not truncated at exactly the cap', () => {
    const many = Array.from({ length: FERRATAS_RESULT_CAP }, (_, i) => way(i + 1));
    expect(toFerratas(many).truncated).toBe(false);
  });
});
