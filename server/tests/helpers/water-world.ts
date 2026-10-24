/**
 * A small piece of the world for the water routing tests (PAD-11), drawn in
 * metres east and north of an origin and written as an OpenStreetMap extract
 * with the PBF fixture writer: rivers, weirs, portages, lakes, as many as a
 * test needs, so no binary map is checked in.
 */
import { pbfFile, type FixtureNode, type FixtureRelation, type FixtureWay } from './osm-pbf-fixture';

/** Metres per degree of latitude, as the router's own geometry takes it. */
const M_PER_DEG = 111_195;

export type Metres = [east: number, north: number];

export class WaterWorld {
  private readonly nodes: FixtureNode[] = [];
  private readonly ways: FixtureWay[] = [];
  private readonly relations: FixtureRelation[] = [];
  private nextNode = 1;
  private nextWay = 1;

  constructor(private readonly origin = { lat: 49, lng: 12 }) {}

  /** The position `east` and `north` metres from the origin. */
  at(east: number, north: number): { lat: number; lng: number } {
    const cos = Math.cos((this.origin.lat * Math.PI) / 180);
    return { lat: this.origin.lat + north / M_PER_DEG, lng: this.origin.lng + east / (M_PER_DEG * cos) };
  }

  /** A node there, tagged or not; its id. */
  node([east, north]: Metres, tags?: Record<string, string>): number {
    const { lat, lng } = this.at(east, north);
    const id = this.nextNode++;
    this.nodes.push({ id, lat, lon: lng, ...(tags ? { tags } : {}) });
    return id;
  }

  /** Tags an existing node, as OSM tags a weir on a node of its river. */
  tag(id: number, tags: Record<string, string>): void {
    const node = this.nodes.find((candidate) => candidate.id === id);
    if (!node) throw new Error(`no node ${id}`);
    node.tags = { ...node.tags, ...tags };
  }

  /** A way through existing nodes; its id. */
  way(refs: number[], tags: Record<string, string> = {}): number {
    const id = this.nextWay++;
    this.ways.push({ id, refs, tags });
    return id;
  }

  /** A way through new nodes at these spots, every `step` metres along straight runs; its id and nodes. */
  line(points: Metres[], tags: Record<string, string>, step = 100): { id: number; refs: number[] } {
    const refs: number[] = [];
    points.forEach((point, index) => {
      const next = points[index + 1];
      refs.push(this.node(point));
      if (!next) return;
      const length = Math.hypot(next[0] - point[0], next[1] - point[1]);
      const parts = Math.max(1, Math.round(length / step));
      for (let i = 1; i < parts; i++) {
        const t = i / parts;
        refs.push(this.node([point[0] + (next[0] - point[0]) * t, point[1] + (next[1] - point[1]) * t]));
      }
    });
    return { id: this.way(refs, tags), refs };
  }

  /** A closed way round these corners (the first is repeated at the end); its id. */
  ring(corners: Metres[], tags: Record<string, string> = {}, step = 100): number {
    const { refs } = this.line([...corners, corners[0] as Metres], {}, step);
    // The closing node is the first one, as OSM draws a closed way.
    refs[refs.length - 1] = refs[0] as number;
    const way = this.ways.at(-1) as FixtureWay;
    way.refs = refs;
    way.tags = tags;
    return way.id;
  }

  relation(members: FixtureRelation['members'], tags: Record<string, string>): number {
    const id = this.relations.length + 1;
    this.relations.push({ id, members, tags });
    return id;
  }

  /** The extract: nodes, ways and relations in blocks of their own, as Geofabrik writes them. */
  pbf(timestamp = 1_760_000_000): Buffer {
    return pbfFile([{ dense: this.nodes }, { ways: this.ways }, { relations: this.relations }], { timestamp });
  }
}

/** The length of a line of [lat, lng] in metres, flat earth as the tests' scale allows. */
export function lineMetres(line: ReadonlyArray<readonly [number, number]>): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    const [aLat, aLng] = line[i - 1] as [number, number];
    const [bLat, bLng] = line[i] as [number, number];
    const cos = Math.cos((aLat * Math.PI) / 180);
    total += Math.hypot((bLat - aLat) * M_PER_DEG, (bLng - aLng) * M_PER_DEG * cos);
  }
  return total;
}
