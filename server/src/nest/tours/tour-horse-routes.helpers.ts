import { routeSections, type RouteEdge } from './horse-route-sections';
import {
  HORSE_ROUTE_SECTIONS_CAP,
  HORSE_ROUTES_RESULT_CAP,
  type FerrataBbox,
  type HorseAccess,
  type HorseRoute,
} from '@trek/shared';

import { z } from 'zod';

/**
 * HOR-01, the pure half of the horse route lookup: the Overpass query, the
 * box it asks for, and the routes read out of the elements it answers with.
 * Kept free of I/O so the service and its tests share it.
 */

/** How long Overpass itself may work on one query, in seconds (`[timeout:N]`). */
const HORSE_ROUTES_QUERY_TIMEOUT_S = 25;

/** The most member ways one query asks for; one more is asked, which is how a cut answer is told. */
export const HORSE_ROUTE_WAYS_CAP = 4000;

/** The grid a box is grown outwards to, so nearby views share one answer. */
const GRID_DEG = 0.05;
const NAME_MAX = 255;
const REF_MAX = 64;

const snapDown = (v: number) => Math.floor(v / GRID_DEG + 1e-9) * GRID_DEG;
const snapUp = (v: number) => Math.ceil(v / GRID_DEG - 1e-9) * GRID_DEG;
const fixed = (v: number) => Number(v.toFixed(2));

/** The box grown outwards to the 0.05 degree grid and clamped to the globe. */
export function snapHorseRouteBbox(bbox: FerrataBbox): FerrataBbox {
  return {
    south: fixed(Math.max(-90, snapDown(bbox.south))),
    west: fixed(Math.max(-180, snapDown(bbox.west))),
    north: fixed(Math.min(90, snapUp(bbox.north))),
    east: fixed(Math.min(180, snapUp(bbox.east))),
  };
}

/** The key a box is remembered under: its snapped edges. */
export function horseRouteBboxKey(bbox: FerrataBbox): string {
  return [bbox.south, bbox.west, bbox.north, bbox.east].join(',');
}

/**
 * The `route=horse` relations that reach into the box, with their members,
 * and those of their ways that lie in it, with their tags, nodes and line. A
 * way crossing the edge comes whole; a member way outside the box is left out
 * and the route is said to go on.
 */
export function buildHorseRoutesQuery(bbox: FerrataBbox): string {
  const box = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
  return [
    `[out:json][timeout:${HORSE_ROUTES_QUERY_TIMEOUT_S}];`,
    `rel["route"="horse"]${box}->.routes;`,
    `way(r.routes)${box}->.ways;`,
    `.routes out body qt ${HORSE_ROUTES_RESULT_CAP + 1};`,
    `.ways out body geom qt ${HORSE_ROUTE_WAYS_CAP + 1};`,
  ].join('\n');
}

const osmId = z.number().int().positive();
const tags = z.record(z.string(), z.string()).optional();
const point = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });

const wayElementSchema = z.object({
  type: z.literal('way'),
  id: osmId,
  tags,
  nodes: z.array(osmId).max(20000),
  // A point Overpass could not place comes back as null; its steps are left out.
  geometry: z.array(point.nullable()).max(20000),
});
const relationElementSchema = z.object({
  type: z.literal('relation'),
  id: osmId,
  tags,
  members: z.array(z.object({ type: z.string(), ref: z.number().int(), role: z.string().optional() })).max(20000),
});
const elementSchema = z.discriminatedUnion('type', [wayElementSchema, relationElementSchema]);
type WayElement = z.infer<typeof wayElementSchema>;
type RelationElement = z.infer<typeof relationElementSchema>;

const KNOWN_ACCESS = new Set<HorseAccess>([
  'designated',
  'yes',
  'permissive',
  'destination',
  'discouraged',
  'private',
  'no',
]);

/** `horse=*` as tagged: a common value as it is, any other `other`, none `unknown`. */
export function horseAccessOf(tag: string | undefined): HorseAccess {
  const value = tag?.trim().toLowerCase() ?? '';
  if (value === '') return 'unknown';
  return KNOWN_ACCESS.has(value as HorseAccess) ? (value as HorseAccess) : 'other';
}

/** A member's role as the direction the route is signposted along its way: 1 with it, -1 against, 0 both. */
function signOfRole(role: string | undefined): 1 | -1 | 0 {
  if (role === 'forward') return 1;
  if (role === 'backward') return -1;
  return 0;
}

function cleanText(value: string | undefined, max: number): string | null {
  const text = value?.trim() ?? '';
  return text === '' ? null : text.slice(0, max);
}

/** The steps of one member way, each between two placed nodes, and the places of its nodes. */
function wayEdges(way: WayElement, role: string | undefined, order: number, coords: Map<number, [number, number]>) {
  const access = horseAccessOf(way.tags?.horse);
  const signed = signOfRole(role);
  const edges: RouteEdge[] = [];
  way.nodes.forEach((node, index) => {
    const place = way.geometry[index];
    if (place) coords.set(node, [place.lat, place.lon]);
    const next = way.nodes[index + 1];
    const nextPlace = way.geometry[index + 1];
    if (next === undefined || !place || !nextPlace || next === node) return;
    edges.push({ from: node, to: next, access, signed, order });
  });
  return edges;
}

/**
 * One relation as a route: its sections out of the member ways the answer
 * holds, each way once (the first time the route lists it), and whether it
 * has member ways the answer does not hold. Null when none of its ways is in
 * the box, so there is nothing of it to take; `cut` when it had more sections
 * than one answer carries.
 */
function toRoute(
  relation: RelationElement,
  ways: ReadonlyMap<number, WayElement>,
): { route: HorseRoute; cut: boolean } | null {
  const coords = new Map<number, [number, number]>();
  const edges: RouteEdge[] = [];
  const seen = new Set<number>();
  let continues = false;
  relation.members.forEach((member, order) => {
    if (member.type !== 'way' || seen.has(member.ref)) return;
    seen.add(member.ref);
    const way = ways.get(member.ref);
    if (!way) {
      continues = true;
      return;
    }
    edges.push(...wayEdges(way, member.role, order, coords));
  });
  const sections = routeSections(edges, coords);
  if (sections.length === 0) return null;
  const route: HorseRoute = {
    id: `relation/${relation.id}`,
    name: cleanText(relation.tags?.name, NAME_MAX),
    ref: cleanText(relation.tags?.ref, REF_MAX),
    osmUrl: `https://www.openstreetmap.org/relation/${relation.id}`,
    continues,
    sections: sections.slice(0, HORSE_ROUTE_SECTIONS_CAP).map((section, index) => ({
      number: index + 1,
      geometry: section.geometry,
      length_m: section.lengthM,
      access: section.access,
      signposted: section.signposted,
    })),
  };
  return { route, cut: sections.length > HORSE_ROUTE_SECTIONS_CAP };
}

/**
 * The routes out of the raw elements. An element of another shape is left
 * out rather than failing the whole answer. `truncated` says the answer was
 * cut: more relations or ways than were asked for, or a route with more
 * sections than one answer carries.
 */
export function toHorseRoutes(elements: unknown[]): { routes: HorseRoute[]; truncated: boolean } {
  const ways = new Map<number, WayElement>();
  const relations: RelationElement[] = [];
  for (const raw of elements) {
    const parsed = elementSchema.safeParse(raw);
    if (!parsed.success) continue;
    if (parsed.data.type === 'way') ways.set(parsed.data.id, parsed.data);
    else relations.push(parsed.data);
  }
  const cut = relations.length > HORSE_ROUTES_RESULT_CAP || ways.size > HORSE_ROUTE_WAYS_CAP;
  const routes: HorseRoute[] = [];
  let sectionsCut = false;
  for (const relation of relations.slice(0, HORSE_ROUTES_RESULT_CAP)) {
    const read = toRoute(relation, ways);
    if (!read) continue;
    sectionsCut ||= read.cut;
    routes.push(read.route);
  }
  return { routes, truncated: cut || sectionsCut };
}
