import { routeSections, type RouteEdge } from '../../../src/nest/tours/horse-route-sections';
import { HORSE_ROUTE_SECTION_MAX_POINTS, type HorseAccess } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// HORSE-SECT-001 to HORSE-SECT-007

/** Node n lies n thousandths of a degree north of 47° N, about 111 m apart. */
const coords = (count: number) =>
  new Map<number, [number, number]>(Array.from({ length: count }, (_, n) => [n + 1, [47 + n * 0.001, 11]]));

/** The steps of a way along the nodes given, in that order. */
function way(nodes: number[], order: number, extra: { access?: HorseAccess; signed?: 1 | -1 | 0 } = {}): RouteEdge[] {
  return nodes.slice(1).map((to, index) => ({
    from: nodes[index] as number,
    to,
    access: extra.access ?? 'unknown',
    signed: extra.signed ?? 0,
    order,
  }));
}

const firstPoints = (sections: ReturnType<typeof routeSections>) =>
  sections.map((section) => [section.geometry[0], section.geometry[section.geometry.length - 1]]);

describe('routeSections (HOR-01)', () => {
  it('HORSE-SECT-001: ways that meet end to end are one section, with the access of each along it', () => {
    const sections = routeSections(
      [...way([1, 2, 3], 0, { access: 'designated' }), ...way([3, 4, 5], 1, { access: 'private' })],
      coords(5),
    );
    expect(sections).toHaveLength(1);
    expect(sections[0]?.geometry).toEqual([
      [47, 11],
      [47.001, 11],
      [47.002, 11],
      [47.003, 11],
      [47.004, 11],
    ]);
    expect(sections[0]?.lengthM).toBeCloseTo(445, -1);
    expect(sections[0]?.access.map((share) => share.value).sort()).toEqual(['designated', 'private']);
    expect(sections[0]?.access.reduce((sum, share) => sum + share.length_m, 0)).toBeCloseTo(445, -1);
    expect(sections[0]?.signposted).toBeNull();
  });

  it('HORSE-SECT-002: a fork ends a section, and each branch is one of its own', () => {
    const sections = routeSections([...way([1, 2, 3], 0), ...way([3, 4], 1), ...way([3, 5], 2)], coords(5));
    expect(sections).toHaveLength(3);
    for (const section of sections) {
      const ends = [section.geometry[0], section.geometry[section.geometry.length - 1]];
      expect(ends).toContainEqual([47.002, 11]);
    }
  });

  it('HORSE-SECT-003: a gap stays a gap, never joined by a line of its own', () => {
    const sections = routeSections([...way([1, 2], 0), ...way([4, 5], 1)], coords(5));
    expect(firstPoints(sections)).toEqual([
      [
        [47, 11],
        [47.001, 11],
      ],
      [
        [47.003, 11],
        [47.004, 11],
      ],
    ]);
  });

  it('HORSE-SECT-004: a ring without a fork is walked once round', () => {
    const ring = new Map<number, [number, number]>([
      [1, [47, 11]],
      [2, [47.001, 11]],
      [3, [47.001, 11.001]],
    ]);
    const sections = routeSections(way([1, 2, 3, 1], 0), ring);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.geometry).toHaveLength(4);
    expect(sections[0]?.geometry[0]).toEqual(sections[0]?.geometry[3]);
  });

  it('HORSE-SECT-005: says the signposted direction only where all of the section is signposted one way', () => {
    expect(routeSections(way([1, 2, 3], 0, { signed: 1 }), coords(3))[0]?.signposted).toBe('with');
    expect(routeSections(way([1, 2, 3], 0, { signed: -1 }), coords(3))[0]?.signposted).toBe('against');
    const mixed = [...way([1, 2], 0, { signed: 1 }), ...way([2, 3], 1)];
    expect(routeSections(mixed, coords(3))[0]?.signposted).toBeNull();
    // A way listed against the walk still reads the right way round.
    const turned = [...way([1, 2], 0, { signed: 1 }), ...way([3, 2], 1, { signed: -1 })];
    expect(routeSections(turned, coords(3))[0]?.signposted).toBe('with');
  });

  it('HORSE-SECT-006: a stretch longer than a fixed leg takes is cut into pieces that meet end to end', () => {
    const count = HORSE_ROUTE_SECTION_MAX_POINTS + 10;
    const nodes = Array.from({ length: count }, (_, n) => n + 1);
    const places = new Map<number, [number, number]>(nodes.map((n) => [n, [47 + n * 0.00001, 11]]));
    const sections = routeSections(way(nodes, 0), places);
    expect(sections.map((section) => section.geometry.length)).toEqual([HORSE_ROUTE_SECTION_MAX_POINTS, 11]);
    expect(sections[1]?.geometry[0]).toEqual(sections[0]?.geometry[HORSE_ROUTE_SECTION_MAX_POINTS - 1]);
  });

  it('HORSE-SECT-007: sections follow the order the route lists its ways, and one of no length is left out', () => {
    const places = new Map<number, [number, number]>([
      [1, [47, 11]],
      [2, [47.001, 11]],
      [3, [47.1, 11]],
      [4, [47.101, 11]],
      [5, [47.2, 11]],
      [6, [47.2, 11]],
    ]);
    const sections = routeSections([...way([3, 4], 0), ...way([1, 2], 1), ...way([5, 6], 2)], places);
    expect(sections.map((section) => section.order)).toEqual([0, 1]);
    expect(sections[0]?.geometry[0]).toEqual([47.1, 11]);
  });
});
