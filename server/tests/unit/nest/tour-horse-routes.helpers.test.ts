import {
  buildHorseRoutesQuery,
  HORSE_ROUTE_WAYS_CAP,
  horseAccessOf,
  horseRouteBboxKey,
  snapHorseRouteBbox,
  toHorseRoutes,
} from '../../../src/nest/tours/tour-horse-routes.helpers';
import { HORSE_ROUTE_SECTIONS_CAP, HORSE_ROUTES_RESULT_CAP, horseRouteSchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// HORSE-HELP-001 to HORSE-HELP-008

const at = (lat: number, lon: number) => ({ lat, lon });
const way = (
  id: number,
  nodes: number[],
  tags: Record<string, string> = {},
  geometry: Array<{ lat: number; lon: number } | null> = nodes.map((n) => at(47 + n * 0.001, 11)),
) => ({ type: 'way', id, tags, nodes, geometry });
const relation = (
  id: number,
  members: Array<{ type?: string; ref: number; role?: string }>,
  tags: Record<string, string> = { route: 'horse', name: 'Reitweg', ref: 'R1' },
) => ({ type: 'relation', id, tags, members: members.map((member) => ({ type: 'way', role: '', ...member })) });

describe('horse route helpers (HOR-01)', () => {
  it('HORSE-HELP-001: asks for the routes in the box, their members and their ways in it with tags and nodes', () => {
    expect(buildHorseRoutesQuery({ south: 47.1, west: 11.2, north: 47.4, east: 11.6 })).toBe(
      [
        '[out:json][timeout:25];',
        'rel["route"="horse"](47.1,11.2,47.4,11.6)->.routes;',
        'way(r.routes)(47.1,11.2,47.4,11.6)->.ways;',
        `.routes out body qt ${HORSE_ROUTES_RESULT_CAP + 1};`,
        `.ways out body geom qt ${HORSE_ROUTE_WAYS_CAP + 1};`,
      ].join('\n'),
    );
  });

  it('HORSE-HELP-002: grows a box to the 0.05 degree grid, clamped to the globe, and keys it by its edges', () => {
    const box = snapHorseRouteBbox({ south: 47.12, west: 11.21, north: 47.18, east: 11.29 });
    expect(box).toEqual({ south: 47.1, west: 11.2, north: 47.2, east: 11.3 });
    expect(horseRouteBboxKey(box)).toBe('47.1,11.2,47.2,11.3');
    expect(snapHorseRouteBbox({ south: -89.99, west: -179.99, north: 89.99, east: 179.99 })).toEqual({
      south: -90,
      west: -180,
      north: 90,
      east: 180,
    });
  });

  it('HORSE-HELP-003: reads horse=* as tagged, any other value as other and none as unknown', () => {
    const tagged = ['designated', ' Yes ', 'permissive', 'destination', 'discouraged', 'private', 'no'];
    expect(tagged.map((value) => horseAccessOf(value))).toEqual([
      'designated',
      'yes',
      'permissive',
      'destination',
      'discouraged',
      'private',
      'no',
    ]);
    expect(horseAccessOf('customers')).toBe('other');
    expect(horseAccessOf('')).toBe('unknown');
    expect(horseAccessOf(undefined)).toBe('unknown');
  });

  it('HORSE-HELP-004: a route with its sections, the access of its ways and its own name and ref', () => {
    const { routes, truncated } = toHorseRoutes([
      relation(7, [{ ref: 1 }, { ref: 2, role: 'forward' }]),
      way(1, [1, 2, 3], { horse: 'designated' }),
      way(2, [3, 4], { horse: 'no' }),
    ]);
    expect(truncated).toBe(false);
    expect(routes).toHaveLength(1);
    const route = routes[0];
    expect(horseRouteSchema.parse(route)).toEqual(route);
    expect(route).toMatchObject({
      id: 'relation/7',
      name: 'Reitweg',
      ref: 'R1',
      osmUrl: 'https://www.openstreetmap.org/relation/7',
      continues: false,
    });
    expect(route?.sections).toHaveLength(1);
    expect(route?.sections[0]).toMatchObject({ number: 1, signposted: null });
    expect(route?.sections[0]?.access.map((share) => share.value)).toEqual(['designated', 'no']);
  });

  it('HORSE-HELP-005: says a route goes on past the box, and leaves out one with no way in it', () => {
    const { routes } = toHorseRoutes([
      relation(7, [{ ref: 1 }, { ref: 99 }]),
      relation(8, [{ ref: 98 }]),
      way(1, [1, 2]),
    ]);
    expect(routes.map((route) => [route.id, route.continues])).toEqual([['relation/7', true]]);
  });

  it('HORSE-HELP-006: reads each way once, skips other members, unplaced points and elements of another shape', () => {
    const { routes } = toHorseRoutes([
      relation(7, [{ ref: 1 }, { ref: 1, role: 'backward' }, { type: 'node', ref: 5 }, { ref: 2 }], {
        route: 'horse',
        name: '  ',
      }),
      way(1, [1, 2, 3], {}, [at(47, 11), null, at(47.002, 11)]),
      way(2, [10, 11], { horse: 'yes' }),
      { type: 'way', id: 3 },
      { type: 'node', id: 4, lat: 47, lon: 11 },
      null,
    ]);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({ name: null, ref: null, continues: false });
    // The way with an unplaced middle point has no step left; only the second way gives a section.
    expect(routes[0]?.sections.map((section) => section.access[0]?.value)).toEqual(['yes']);
  });

  it('HORSE-HELP-007: an answer past the caps says it was cut', () => {
    const many = Array.from({ length: HORSE_ROUTES_RESULT_CAP + 1 }, (_, index) => relation(index + 1, [{ ref: 1 }]));
    const cut = toHorseRoutes([...many, way(1, [1, 2])]);
    expect(cut.truncated).toBe(true);
    expect(cut.routes).toHaveLength(HORSE_ROUTES_RESULT_CAP);
  });

  it('HORSE-HELP-008: a route with more sections than an answer carries is cut to the cap and said to be', () => {
    const count = HORSE_ROUTE_SECTIONS_CAP + 1;
    const members = Array.from({ length: count }, (_, index) => ({ ref: index + 1 }));
    // Each way two nodes of its own, apart from the others: as many sections as ways.
    const ways = members.map(({ ref }) => way(ref, [ref * 10, ref * 10 + 1]));
    const { routes, truncated } = toHorseRoutes([relation(7, members), ...ways]);
    expect(truncated).toBe(true);
    expect(routes[0]?.sections).toHaveLength(HORSE_ROUTE_SECTIONS_CAP);
    expect(routes[0]?.sections.map((section) => section.number).slice(0, 3)).toEqual([1, 2, 3]);
  });
});
