import type { Ferrata, FerrataBbox, FerrataGrade } from '@trek/shared';

import { ferrataGradeLabel, ferrataPositions } from './ferrataModel';

/**
 * OpenStreetMap maps one via ferrata as many short ways: the approach, each
 * pitch, a bridge, the exit. This turns those segments back into the routes a
 * climber means, so the layer counts, highlights and describes one ferrata
 * rather than a dozen pieces of it. Pure and React-free.
 *
 * Segments belong together when they share their route relation's name, or,
 * with no relation, their own name, and lie close to each other: a chain of
 * segments joins as long as each one comes within the reach of the next.
 * Unnamed segments stay on their own; nothing says two of them are one route.
 */

/** How close two segments of the same name have to come to read as one ferrata. */
export const FERRATA_NAME_REACH_M = 300;
/**
 * The same for a route relation's name. A relation is one route by definition,
 * so the reach is wider; it only keeps two distant routes that happen to share
 * a name apart.
 */
const FERRATA_ROUTE_REACH_M = 2000;

export interface FerrataGroup {
  /** Stable for as long as the group keeps its lowest way: `group/<way id>`. */
  id: string;
  name: string | null;
  routeName: string | null;
  /** The OSM ways it is made of, in the order they arrived. */
  segments: readonly Ferrata[];
  /** The easiest and the hardest numeric grade among the segments, or null when none has one. */
  grades: { min: FerrataGrade; max: FerrataGrade } | null;
  /** A grade as tagged when no segment has a numeric one (a letter scale such as "C/D"). */
  rawGrade: string | null;
  /** The summed length of every segment, in metres. */
  lengthM: number;
  bbox: FerrataBbox;
  /** Where its label goes: halfway along its longest segment, as [lat, lng]. */
  midpoint: [number, number];
}

const EARTH_RADIUS_M = 6_371_000;
const RAD = Math.PI / 180;

function distanceM([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const dLat = (lat2 - lat1) * RAD;
  const dLng = (lng2 - lng1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

function lengthOf(points: readonly [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += distanceM(points[i - 1], points[i]);
  return total;
}

/**
 * The box around the points, the ones that are not finite numbers skipped, or
 * null when none is left.
 */
export function ferrataPointsBbox(points: Iterable<readonly [number, number]>): FerrataBbox | null {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const [lat, lng] of points) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }
  return south <= north && west <= east ? { south, west, north, east } : null;
}

/** A segment's box; the schema guarantees it at least two placed points. */
function bboxOf(points: readonly [number, number][]): FerrataBbox {
  return ferrataPointsBbox(points) ?? { south: 0, west: 0, north: 0, east: 0 };
}

/** Whether two boxes share any point, edges included. */
export function ferrataBboxesMeet(a: FerrataBbox, b: FerrataBbox): boolean {
  return a.south <= b.north && b.south <= a.north && a.west <= b.east && b.west <= a.east;
}

/** The point halfway along a line, by length. */
function halfway(points: readonly [number, number][]): [number, number] {
  const half = lengthOf(points) / 2;
  let walked = 0;
  for (let i = 1; i < points.length; i += 1) {
    const step = distanceM(points[i - 1], points[i]);
    if (walked + step >= half && step > 0) {
      const t = (half - walked) / step;
      const [lat1, lng1] = points[i - 1];
      const [lat2, lng2] = points[i];
      return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
    }
    walked += step;
  }
  return points[0] ?? [0, 0];
}

interface Segment {
  ferrata: Ferrata;
  points: [number, number][];
  bbox: FerrataBbox;
  lengthM: number;
}

/** Whether two boxes come within `reach` metres of each other, a cheap test before any point is compared. */
function boxesWithin(a: FerrataBbox, b: FerrataBbox, reach: number): boolean {
  const latPad = reach / (EARTH_RADIUS_M * RAD);
  const lngPad = latPad / Math.max(0.01, Math.cos(((a.south + a.north) / 2) * RAD));
  return (
    a.south - latPad <= b.north && b.south - latPad <= a.north && a.west - lngPad <= b.east && b.west - lngPad <= a.east
  );
}

/** Whether an end of either segment comes within `reach` of a point of the other: they touch or nearly do. */
function segmentsMeet(a: Segment, b: Segment, reach: number): boolean {
  if (!boxesWithin(a.bbox, b.bbox, reach)) return false;
  const near = (ends: Segment, line: Segment) => {
    const tips = [ends.points[0], ends.points[ends.points.length - 1]];
    return tips.some((tip) => tip !== undefined && line.points.some((point) => distanceM(tip, point) <= reach));
  };
  return near(a, b) || near(b, a);
}

/** What segments group by, or null for one that stays alone. Case and outer spaces do not tell two names apart. */
function groupKey(ferrata: Ferrata): { key: string; reach: number } | null {
  const route = ferrata.routeName?.trim().toLocaleLowerCase();
  if (route) return { key: `route:${route}`, reach: FERRATA_ROUTE_REACH_M };
  const name = ferrata.name?.trim().toLocaleLowerCase();
  if (name) return { key: `name:${name}`, reach: FERRATA_NAME_REACH_M };
  return null;
}

/** Segments of one key joined into chains: any two that meet end up in one set. */
function chains(segments: Segment[], reach: number): Segment[][] {
  const parent = segments.map((_, index) => index);
  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    parent[i] = root;
    return root;
  };
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      if (find(i) !== find(j) && segmentsMeet(segments[i], segments[j], reach)) parent[find(j)] = find(i);
    }
  }
  const sets = new Map<number, Segment[]>();
  segments.forEach((segment, index) => {
    const root = find(index);
    const set = sets.get(root);
    if (set) set.push(segment);
    else sets.set(root, [segment]);
  });
  return [...sets.values()];
}

/** -, none, + in that order within a level. */
const gradeRank = (grade: FerrataGrade) =>
  (grade.level ?? 0) * 3 + (grade.plus === '-' ? 0 : grade.plus === '+' ? 2 : 1);

function wayNumber(id: string): number {
  const n = Number(id.slice(id.indexOf('/') + 1));
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function toGroup(members: Segment[]): FerrataGroup {
  const segments = members.map((member) => member.ferrata);
  const graded = segments.map((segment) => segment.grade).filter((grade) => grade.level !== null);
  const sorted = [...graded].sort((a, b) => gradeRank(a) - gradeRank(b));
  const longest = members.reduce((best, member) => (member.lengthM > best.lengthM ? member : best), members[0]);
  // The name of the longest named segment speaks for the group.
  const named = [...members].sort((a, b) => b.lengthM - a.lengthM).find((member) => member.ferrata.name);
  const lowest = [...segments].sort((a, b) => wayNumber(a.id) - wayNumber(b.id))[0];
  return {
    id: `group/${lowest.id}`,
    name: named?.ferrata.name ?? null,
    routeName: segments.find((segment) => segment.routeName)?.routeName ?? null,
    segments,
    grades: sorted.length ? { min: sorted[0], max: sorted[sorted.length - 1] } : null,
    rawGrade: sorted.length ? null : (segments.find((segment) => segment.grade.raw)?.grade.raw ?? null),
    lengthM: members.reduce((sum, member) => sum + member.lengthM, 0),
    bbox: members.slice(1).reduce(
      (box, member) => ({
        south: Math.min(box.south, member.bbox.south),
        west: Math.min(box.west, member.bbox.west),
        north: Math.max(box.north, member.bbox.north),
        east: Math.max(box.east, member.bbox.east),
      }),
      members[0].bbox
    ),
    midpoint: halfway(longest.points),
  };
}

/** The segments as ferratas, in the order their first segment arrived. */
export function groupFerratas(ferratas: readonly Ferrata[]): FerrataGroup[] {
  const keyed = new Map<string, { reach: number; segments: Segment[] }>();
  const ordered: Array<Segment[] | string> = [];
  for (const ferrata of ferratas) {
    const points = ferrataPositions(ferrata);
    if (points.length < 2) continue;
    const segment: Segment = { ferrata, points, bbox: bboxOf(points), lengthM: lengthOf(points) };
    const key = groupKey(ferrata);
    if (!key) {
      ordered.push([segment]);
      continue;
    }
    const bucket = keyed.get(key.key);
    if (bucket) bucket.segments.push(segment);
    else {
      keyed.set(key.key, { reach: key.reach, segments: [segment] });
      ordered.push(key.key);
    }
  }
  return ordered.flatMap((entry) => {
    if (typeof entry !== 'string') return [toGroup(entry)];
    const bucket = keyed.get(entry);
    return bucket ? chains(bucket.segments, bucket.reach).map(toGroup) : [];
  });
}

/** The group a way belongs to, for a click or a selection that names one segment. */
export function ferrataGroupOf(groups: readonly FerrataGroup[], segmentId: string | null): FerrataGroup | null {
  if (!segmentId) return null;
  return groups.find((group) => group.segments.some((segment) => segment.id === segmentId)) ?? null;
}

/** How many ferratas reach into the area on screen. */
export function ferrataGroupsInView(groups: readonly FerrataGroup[], view: FerrataBbox | null): number {
  if (!view) return 0;
  return groups.reduce((count, group) => (ferrataBboxesMeet(group.bbox, view) ? count + 1 : count), 0);
}

/**
 * The group's grade on the K scale: the easiest and the hardest segment
 * (`K2`, `K4`), the same label twice when they agree, null when no segment has
 * a numeric grade.
 */
export function ferrataGradeRange(group: Pick<FerrataGroup, 'grades'>): { from: string; to: string } | null {
  if (!group.grades) return null;
  const from = ferrataGradeLabel(group.grades.min);
  const to = ferrataGradeLabel(group.grades.max);
  return from && to ? { from, to } : null;
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * What a ferrata is called on the map and on its card: its own name, else its
 * route's, else "unnamed"; and its grade, `K3` or `K2 to K4`, or without a
 * numeric grade the tag as written (a letter scale such as "C/D" still says
 * something), or null when there is none at all.
 */
export function ferrataLabel(
  group: Pick<FerrataGroup, 'name' | 'routeName' | 'grades' | 'rawGrade'>,
  t: Translate
): { name: string; grade: string | null } {
  const name = group.name ?? group.routeName ?? t('ferratas.unnamed');
  const range = ferrataGradeRange(group);
  if (!range) return { name, grade: group.rawGrade };
  return { name, grade: range.from === range.to ? range.from : t('ferratas.gradeRange', range) };
}
