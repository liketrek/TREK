import { readPbfFile, type OsmWay } from './osm-pbf.reader';
import { keptTags, paddleKindOf, paddleNameOf } from './paddle-tags';
import { compareCodeUnits, type PaddleGeometry, type PaddleObstacleKind } from '@trek/shared';

import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';

/**
 * PAD-05A: the paddle objects of one regional extract, read in two passes.
 * The first keeps every tagged node that is one, and the ways that are, with
 * the ids of their nodes; the second looks those nodes' positions up. Only
 * the nodes a kept way needs are held, so a region is read in bounded memory.
 */

/** A way longer than this keeps every n-th node so its line stays readable; its ends are always kept. */
const MAX_WAY_NODES = 2000;
/** Lock chambers and gates closer than this, in metres, belong to one lock. */
const LOCK_GROUP_M = 250;

export interface ExtractedFeature {
  osm_ref: string;
  kind: PaddleObstacleKind;
  name: string | null;
  geometry: PaddleGeometry;
  tags: Record<string, string>;
  tag_hash: string;
  group_key: string | null;
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

interface PendingWay {
  way: OsmWay;
  kind: PaddleObstacleKind;
}

function hashOf(tags: Record<string, string>, geometry: PaddleGeometry): string {
  const sorted = Object.keys(tags)
    .sort(compareCodeUnits)
    .map((key) => [key, tags[key]]);
  const rounded = JSON.stringify(geometry, (_key, value: unknown) =>
    typeof value === 'number' ? Math.round(value * 1e6) / 1e6 : value,
  );
  return createHash('sha256').update(JSON.stringify(sorted)).update(rounded).digest('hex').slice(0, 16);
}

function boxOf(
  points: ReadonlyArray<readonly [number, number]>,
): Pick<ExtractedFeature, 'min_lat' | 'min_lng' | 'max_lat' | 'max_lng'> {
  let minLat = 90;
  let minLng = 180;
  let maxLat = -90;
  let maxLng = -180;
  for (const [lng, lat] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  return { min_lat: minLat, min_lng: minLng, max_lat: maxLat, max_lng: maxLng };
}

function thinned(refs: readonly number[]): number[] {
  if (refs.length <= MAX_WAY_NODES) return [...refs];
  const step = Math.ceil(refs.length / MAX_WAY_NODES);
  const kept = refs.filter((_, index) => index % step === 0);
  const last = refs[refs.length - 1];
  if (last !== undefined && kept[kept.length - 1] !== last) kept.push(last);
  return kept;
}

function build(
  osmRef: string,
  kind: PaddleObstacleKind,
  rawTags: Record<string, string>,
  geometry: PaddleGeometry,
  points: ReadonlyArray<readonly [number, number]>,
): ExtractedFeature {
  const tags = keptTags(rawTags);
  return {
    osm_ref: osmRef,
    kind,
    name: paddleNameOf(rawTags),
    geometry,
    tags,
    tag_hash: hashOf(tags, geometry),
    group_key: null,
    ...boxOf(points),
  };
}

function wayFeature(
  pending: PendingWay,
  coords: ReadonlyMap<number, readonly [number, number]>,
): ExtractedFeature | null {
  const points = pending.way.refs.flatMap((ref) => {
    const at = coords.get(ref);
    return at ? [at] : [];
  });
  if (points.length < 2) return null;
  const first = points[0] as readonly [number, number];
  const last = points[points.length - 1] as readonly [number, number];
  const closed = points.length >= 4 && first[0] === last[0] && first[1] === last[1];
  const line = points.map(([lng, lat]) => [lng, lat] as [number, number]);
  const geometry: PaddleGeometry = closed
    ? { type: 'Polygon', coordinates: [line] }
    : { type: 'LineString', coordinates: line };
  return build(`way/${pending.way.id}`, pending.kind, pending.way.tags, geometry, points);
}

function centreOf(feature: ExtractedFeature): [number, number] {
  return [(feature.min_lat + feature.max_lat) / 2, (feature.min_lng + feature.max_lng) / 2];
}

function metresBetween(a: [number, number], b: [number, number]): number {
  const cos = Math.cos((((a[0] + b[0]) / 2) * Math.PI) / 180);
  return Math.hypot((b[0] - a[0]) * 111_195, (b[1] - a[1]) * 111_195 * cos);
}

/**
 * The chambers and gates of one lock share a key, so the checklist asks
 * about the lock once and not about each gate. Parts closer than
 * LOCK_GROUP_M join a group; separate locks stay apart.
 */
export function groupLockParts(features: ExtractedFeature[]): void {
  const parts = features.filter((feature) => feature.kind === 'lock' || feature.kind === 'lock_gate');
  const parent = new Map<ExtractedFeature, ExtractedFeature>(parts.map((part) => [part, part]));
  const root = (part: ExtractedFeature): ExtractedFeature => {
    let current = part;
    while (parent.get(current) !== current) current = parent.get(current) as ExtractedFeature;
    return current;
  };
  // Sorted by longitude, so each part is only compared with its neighbours within reach.
  const sorted = [...parts].sort((a, b) => centreOf(a)[1] - centreOf(b)[1]);
  sorted.forEach((part, index) => {
    const centre = centreOf(part);
    for (let j = index + 1; j < sorted.length; j++) {
      const other = sorted[j] as ExtractedFeature;
      const otherCentre = centreOf(other);
      if ((otherCentre[1] - centre[1]) * 111_195 * Math.cos((centre[0] * Math.PI) / 180) > LOCK_GROUP_M) break;
      if (metresBetween(centre, otherCentre) <= LOCK_GROUP_M) parent.set(root(other), root(part));
    }
  });
  const groups = new Map<ExtractedFeature, ExtractedFeature[]>();
  for (const part of parts) groups.set(root(part), [...(groups.get(root(part)) ?? []), part]);
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const key = `lock:${members.map((member) => member.osm_ref).sort(compareCodeUnits)[0]}`;
    for (const member of members) member.group_key = key;
  }
}

/**
 * Every paddle object of the extract at `path`, and the date its data is
 * current to. `onProgress` hears the share of the work done: the first pass
 * is the first half, the lookup of the ways' nodes the second.
 */
export async function extractPaddleFeatures(
  path: string,
  onProgress?: (fraction: number) => void,
): Promise<{ timestamp: number | null; features: ExtractedFeature[] }> {
  const { size } = await stat(path);
  const progressOf = (pass: number) => (bytesRead: number) =>
    onProgress?.(size > 0 ? (pass + Math.min(1, bytesRead / size)) / 2 : 1);
  const features: ExtractedFeature[] = [];
  const pending: PendingWay[] = [];
  const needed = new Set<number>();
  const { timestamp } = await readPbfFile(
    path,
    {
      node: (node) => {
        if (Object.keys(node.tags).length === 0) return;
        const kind = paddleKindOf(node.tags);
        if (!kind) return;
        const point: [number, number] = [node.lon, node.lat];
        features.push(build(`node/${node.id}`, kind, node.tags, { type: 'Point', coordinates: point }, [point]));
      },
      way: (way) => {
        const kind = paddleKindOf(way.tags);
        if (!kind) return;
        const refs = thinned(way.refs);
        pending.push({ way: { ...way, refs }, kind });
        for (const ref of refs) needed.add(ref);
      },
    },
    progressOf(0),
  );
  if (pending.length > 0) {
    const coords = new Map<number, readonly [number, number]>();
    await readPbfFile(
      path,
      {
        node: (node) => {
          if (needed.has(node.id)) coords.set(node.id, [node.lon, node.lat]);
        },
      },
      progressOf(1),
    );
    for (const way of pending) {
      const feature = wayFeature(way, coords);
      if (feature) features.push(feature);
    }
  }
  onProgress?.(1);
  groupLockParts(features);
  return { timestamp, features };
}
