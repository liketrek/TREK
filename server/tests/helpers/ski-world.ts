/**
 * Ski areas drawn by a test: nodes set in metres east and north of an origin,
 * runs, trails and lifts between them, written out as SGR1 exactly as the
 * Places host's writer lays it out (`winter/sgr.py`): magic, head, sections
 * padded to 8 bytes, string pool, CRC-32 over everything after the head. The
 * golden file pins the reader against the real writer; this builds the
 * networks the router tests need without a planet.
 */
import { decodeSkiGraph } from '../../src/nest/ski-routing/ski-graph';
import {
  DIFF_UNKNOWN,
  ELE_MISSING,
  Kind,
  Lift,
  NO_STRING,
  NodeFlag,
  Use,
  type SkiGraphData,
} from '../../src/nest/ski-routing/ski-graph.contract';

import { crc32, gzipSync } from 'node:zlib';

const M_PER_DEG = 111_195;

export interface WorldNode {
  x: number;
  y: number;
  ele: number | null;
  osm: number;
  flags: number;
}

export interface WorldEdge {
  a: number;
  b: number;
  kind: number;
  fwd: number;
  back: number;
  diff: number;
  groom: number;
  lift: number;
  liftSec: number;
  liftCap: number;
  flags: number;
  name: string | null;
  ref: string | null;
  way: number;
  via: Array<[number, number]>;
}

export type EdgeOptions = Partial<Omit<WorldEdge, 'a' | 'b'>>;

interface WorldPoint {
  x: number;
  y: number;
  ele: number | null;
}

/** The length of a line of points in metres. */
function lineLength(points: readonly WorldPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as WorldPoint;
    const b = points[i] as WorldPoint;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/** Both directions downhill-only runs carry: a skier down, a ski tourer down. */
export const RUN_DOWN = Use.DOWNHILL | Use.SKITOUR_DOWN;
export const NORDIC_BOTH = Use.NORDIC_CLASSIC | Use.NORDIC_SKATING;

export class SkiWorld {
  readonly nodes: WorldNode[] = [];
  readonly edges: WorldEdge[] = [];
  private nextOsm = 1;
  private nextSynthetic = -1;
  private nextWay = 1;

  constructor(
    readonly origin = { lat: 46, lng: 7 },
    readonly head: { areaId: string; build: string; name: string; colourScheme?: string } = {
      areaId: 'w:1',
      build: '2026-11-02',
      name: 'Testalp',
    },
  ) {}

  /** A point `x` metres east and `y` metres north of the origin. */
  at(x: number, y: number): { lat: number; lng: number } {
    return {
      lat: this.origin.lat + y / M_PER_DEG,
      lng: this.origin.lng + x / (M_PER_DEG * Math.cos((this.origin.lat * Math.PI) / 180)),
    };
  }

  node(x: number, y: number, ele: number | null, options: { flags?: number; osm?: number } = {}): number {
    const synthetic = options.flags !== undefined && (options.flags & NodeFlag.LIFT_INTERNAL) !== 0;
    const osm = options.osm ?? (synthetic ? this.nextSynthetic-- : this.nextOsm++);
    this.nodes.push({ x, y, ele, osm, flags: options.flags ?? 0 });
    return this.nodes.length - 1;
  }

  edge(a: number, b: number, options: EdgeOptions = {}): number {
    this.edges.push({
      a,
      b,
      kind: Kind.RUN,
      fwd: 0,
      back: 0,
      diff: DIFF_UNKNOWN,
      groom: 0,
      lift: Lift.NONE,
      liftSec: 0,
      liftCap: 0,
      flags: 0,
      name: null,
      ref: null,
      way: this.nextWay++,
      via: [],
      ...options,
    });
    return this.edges.length - 1;
  }

  /** A run skied from a to b only. */
  run(a: number, b: number, diff: number, options: EdgeOptions = {}): number {
    return this.edge(a, b, { kind: Kind.RUN, fwd: RUN_DOWN, back: 0, diff, ...options });
  }

  /** A cross-country trail, both ways, groomed as given. */
  nordic(a: number, b: number, options: EdgeOptions = {}): number {
    return this.edge(a, b, { kind: Kind.NORDIC, fwd: NORDIC_BOTH, back: NORDIC_BOTH, groom: 3, ...options });
  }

  /** A short link the data does not hold, walked or skied either way. */
  link(a: number, b: number, options: EdgeOptions = {}): number {
    const uses = Use.WALK | Use.DOWNHILL | Use.SKITOUR_DOWN;
    return this.edge(a, b, { kind: Kind.LINK, fwd: uses, back: uses, way: 0, ...options });
  }

  /**
   * A lift from a bottom ground node to a top one: its own two ride nodes, a
   * board edge at the bottom, the ride, an alight edge at the top, as the
   * writer lays a lift out. `down` lets it be ridden down as well.
   */
  lift(
    bottom: number,
    top: number,
    options: { type?: number; name?: string; sec?: number; cap?: number; down?: boolean } = {},
  ): { ride: number; board: number; alight: number } {
    const lift = options.type ?? Lift.CHAIR_DETACHABLE;
    const name = options.name ?? null;
    const from = this.nodes[bottom] as WorldNode;
    const to = this.nodes[top] as WorldNode;
    const rideBottom = this.node(from.x, from.y, from.ele, { flags: NodeFlag.LIFT_INTERNAL });
    const rideTop = this.node(to.x, to.y, to.ele, { flags: NodeFlag.LIFT_INTERNAL });
    from.flags |= NodeFlag.STATION;
    to.flags |= NodeFlag.STATION;
    const down = options.down ? Use.LIFT_DOWN : 0;
    const way = this.nextWay++;
    const common = { lift, name, liftCap: options.cap ?? 0, way };
    const board = this.edge(bottom, rideBottom, { ...common, kind: Kind.BOARD, fwd: Use.WALK | Use.LIFT_UP });
    const kind = lift === Lift.FUNICULAR || lift === Lift.RACK ? Kind.RAIL : Kind.LIFT;
    const liftSec = options.sec ?? 0;
    const ride = this.edge(rideBottom, rideTop, { ...common, kind, fwd: Use.LIFT_UP, back: down, liftSec });
    const alight = this.edge(rideTop, top, { ...common, kind: Kind.ALIGHT, fwd: Use.WALK | Use.LIFT_UP });
    if (options.down) {
      // Ridden down: boarded at the top, left at the bottom.
      this.edge(top, rideTop, { ...common, kind: Kind.BOARD, fwd: Use.WALK | Use.LIFT_DOWN });
      this.edge(rideBottom, bottom, { ...common, kind: Kind.ALIGHT, fwd: Use.WALK | Use.LIFT_DOWN });
    }
    return { ride, board, alight };
  }

  /** An edge's points, its heights straight between its ends where both are known. */
  private line(e: WorldEdge): WorldPoint[] {
    const a = this.nodes[e.a] as WorldNode;
    const b = this.nodes[e.b] as WorldNode;
    const points: WorldPoint[] = [a, ...e.via.map(([x, y]) => ({ x, y, ele: null })), b];
    return points.map((p, i) => {
      if (i === 0 || i === points.length - 1) return { x: p.x, y: p.y, ele: p.ele };
      const share = i / (points.length - 1);
      return { x: p.x, y: p.y, ele: a.ele !== null && b.ele !== null ? a.ele + (b.ele - a.ele) * share : null };
    });
  }

  private point(x: number, y: number): [number, number] {
    const { lat, lng } = this.at(x, y);
    return [lat, lng];
  }

  /** The graph as the reader would hand it over, through the bytes, so the writer's layout is exercised. */
  graph(): SkiGraphData {
    return decodeSkiGraph(this.sgr());
  }

  gz(): Buffer {
    return gzipSync(this.sgr());
  }

  /** The SGR1 bytes of the world. */
  sgr(): Buffer {
    const pool: Buffer[] = [];
    const offsets = new Map<string, number>();
    let poolBytes = 0;
    const sid = (text: string | null): number => {
      if (!text) return NO_STRING;
      const known = offsets.get(text);
      if (known !== undefined) return known;
      const bytes = Buffer.from(`${text}\0`, 'utf8');
      offsets.set(text, poolBytes);
      pool.push(bytes);
      poolBytes += bytes.length;
      return poolBytes - bytes.length;
    };
    const ele = (value: number | null) => (value === null ? ELE_MISSING : Math.round(value));
    const n = this.nodes.length;
    const m = this.edges.length;
    const geometry = this.edges.map((e) => this.line(e));
    const g = geometry.reduce((sum, points) => sum + points.length, 0);

    const sections: Buffer[] = [];
    const add = (view: ArrayBufferView) => {
      const raw = Buffer.from(view.buffer, view.byteOffset, view.byteLength);
      sections.push(raw, Buffer.alloc((8 - (raw.length % 8)) % 8));
    };
    add(Int32Array.from(this.nodes, (p) => Math.round(this.point(p.x, p.y)[0] * 1e7)));
    add(Int32Array.from(this.nodes, (p) => Math.round(this.point(p.x, p.y)[1] * 1e7)));
    add(Int16Array.from(this.nodes, (p) => ele(p.ele)));
    add(Uint16Array.from(this.nodes, (p) => p.flags | (p.ele === null ? NodeFlag.ELE_MISSING : 0)));
    add(Float64Array.from(this.nodes, (p) => p.osm));
    add(Uint32Array.from(this.edges, (e) => e.a));
    add(Uint32Array.from(this.edges, (e) => e.b));
    add(Float32Array.from(geometry, (points) => lineLength(points)));
    const rise = (e: WorldEdge, up: boolean) => {
      const a = (this.nodes[e.a] as WorldNode).ele;
      const b = (this.nodes[e.b] as WorldNode).ele;
      if (a === null || b === null) return 0;
      return Math.max(0, Math.round(up ? b - a : a - b));
    };
    add(Uint16Array.from(this.edges, (e) => rise(e, true)));
    add(Uint16Array.from(this.edges, (e) => rise(e, false)));
    add(Uint8Array.from(this.edges, (e) => e.kind));
    add(Uint16Array.from(this.edges, (e) => e.fwd));
    add(Uint16Array.from(this.edges, (e) => e.back));
    add(Uint8Array.from(this.edges, (e) => e.diff));
    add(Uint8Array.from(this.edges, (e) => e.groom));
    add(Uint8Array.from(this.edges, (e) => e.lift));
    add(Uint16Array.from(this.edges, (e) => e.liftSec));
    add(Uint16Array.from(this.edges, (e) => e.liftCap));
    add(Uint32Array.from(this.edges, (e) => e.flags));
    add(Uint32Array.from(this.edges, (e) => sid(e.name)));
    add(Uint32Array.from(this.edges, (e) => sid(e.ref)));
    add(Float64Array.from(this.edges, (e) => e.way));
    const offsetsOfGeometry = new Uint32Array(m + 1);
    for (let i = 0; i < m; i++) {
      offsetsOfGeometry[i + 1] = (offsetsOfGeometry[i] as number) + (geometry[i] as WorldPoint[]).length;
    }
    add(offsetsOfGeometry);
    const flat = geometry.flat();
    add(Int32Array.from(flat, (p) => Math.round(this.point(p.x, p.y)[0] * 1e7)));
    add(Int32Array.from(flat, (p) => Math.round(this.point(p.x, p.y)[1] * 1e7)));
    add(Int16Array.from(flat, (p) => ele(p.ele)));
    const strings = Buffer.concat(pool);
    sections.push(strings, Buffer.alloc((8 - (strings.length % 8)) % 8));
    const body = Buffer.concat(sections);

    const lats = this.nodes.map((p) => this.point(p.x, p.y)[0]);
    const lngs = this.nodes.map((p) => this.point(p.x, p.y)[1]);
    const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
    const header = {
      format: 1,
      build: this.head.build,
      areaId: this.head.areaId,
      name: this.head.name,
      kind: 'resort',
      country: null,
      colourScheme: this.head.colourScheme ?? 'europe',
      bbox,
      counts: { runsKm: 0, nordicKm: 0, lifts: 0, skitourKm: 0, hikeKm: 0 },
      nodeCount: n,
      edgeCount: m,
      geomCount: g,
      stringBytes: strings.length,
      crc32: crc32(body) >>> 0,
    };
    const json = Buffer.from(JSON.stringify(header), 'utf8');
    const prefix = Buffer.concat([Buffer.from('SGR1', 'latin1'), Buffer.alloc(4), json]);
    prefix.writeUInt32LE(json.length, 4);
    return Buffer.concat([prefix, Buffer.alloc((8 - (prefix.length % 8)) % 8), body]);
  }
}
