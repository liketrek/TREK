/**
 * PAD-11: what of an OpenStreetMap extract goes into the water network, read
 * in the same pass as the paddle obstacles. The elements arrive as the reader
 * gives them; the collector keeps a lean copy of the ones it wants and the
 * ids of the nodes and member ways it will need positions and lines for.
 *
 * - Centre lines: river, canal, fairway, tidal channel, flowline, link and
 *   canoe pass; a stream only where a boat tag allows it or it is 4 m wide or
 *   more; a ditch or drain only with canoe=yes. A fish pass never.
 * - Lakes: closed ways and multipolygons of natural=water (not the river and
 *   canal areas, which the centre lines already carry) and of
 *   landuse=reservoir.
 * - Barriers: weirs, dams and waterfalls, as nodes or as lines across a river.
 * - Portage ways, for carrying round a barrier.
 */

export interface CollectedWay {
  id: number;
  refs: number[];
  tags: Record<string, string>;
}

export interface CollectedBarrier {
  osmRef: string;
  kind: 'weir' | 'dam' | 'waterfall';
  name: string | null;
}

export interface CollectedArea {
  osmRef: string;
  name: string | null;
  /** A closed way's nodes, or a multipolygon's member ways with their roles. */
  ring?: number[];
  members?: Array<{ way: number; role: string }>;
}

export interface CollectedWater {
  centrelines: CollectedWay[];
  barrierNodes: Map<number, CollectedBarrier>;
  barrierWays: Array<CollectedWay & { barrier: CollectedBarrier }>;
  portageWays: CollectedWay[];
  areas: CollectedArea[];
  /** Member ways of the multipolygons, filled in by the second pass. */
  memberWays: Map<number, number[]>;
}

const CENTRELINES = new Set(['river', 'canal', 'fairway', 'tidal_channel', 'flowline', 'link', 'canoe_pass']);
const SMALL = new Set(['stream']);
const DITCHES = new Set(['ditch', 'drain']);
const BOAT_YES = new Set(['yes', 'designated', 'permissive']);
const BARRIERS = new Set(['weir', 'dam', 'waterfall']);
/** Water areas a centre line already carries, or that no one paddles. */
const NOT_LAKES = new Set(['river', 'canal', 'stream', 'ditch', 'drain', 'wastewater', 'stream_pool', 'moat']);
/** A centre line keeps these tags; the rest of OSM's stays behind. */
const LINE_TAGS = [
  'waterway',
  'whitewater:section_grade',
  'name',
  'canoe',
  'kayak',
  'boat',
  'access',
  'oneway:canoe',
  'oneway:boat',
  'intermittent',
  'tunnel',
  'lock',
  'lock_name',
];

function boatAllows(tags: Readonly<Record<string, string>>): boolean {
  return ['canoe', 'kayak', 'boat'].some((key) => BOAT_YES.has(tags[key] ?? ''));
}

function widthOf(tags: Readonly<Record<string, string>>): number {
  const parsed = Number.parseFloat((tags.width ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** The race of a mill or a power plant: water led to and from its wheel or turbine, nothing to paddle. */
const RACES = new Set(['headrace', 'tailrace', 'spillway']);

/** Whether a waterway line belongs in the network. */
function isNetworkLine(tags: Readonly<Record<string, string>>): boolean {
  const waterway = tags.waterway;
  if (waterway === undefined) return false;
  if ((RACES.has(tags.usage ?? '') || RACES.has(tags.canal ?? '')) && !boatAllows(tags)) return false;
  if (CENTRELINES.has(waterway)) return true;
  if (SMALL.has(waterway)) return boatAllows(tags) || widthOf(tags) >= 4;
  if (DITCHES.has(waterway)) return tags.canoe === 'yes';
  return false;
}

/** Whether an area is a lake (or pond, reservoir, oxbow) the network may cross. */
function isLakeArea(tags: Readonly<Record<string, string>>): boolean {
  if (tags.landuse === 'reservoir' || tags.landuse === 'basin')
    return tags.water === undefined || !NOT_LAKES.has(tags.water);
  return tags.natural === 'water' && !NOT_LAKES.has(tags.water ?? '');
}

function barrierOf(tags: Readonly<Record<string, string>>, osmRef: string): CollectedBarrier | null {
  const waterway = tags.waterway ?? '';
  if (!BARRIERS.has(waterway)) return null;
  return { osmRef, kind: waterway as CollectedBarrier['kind'], name: tags.name ?? null };
}

function isPortageWay(tags: Readonly<Record<string, string>>): boolean {
  return tags.canoe === 'portage' || tags.portage === 'yes' || tags.whitewater === 'portage_way';
}

function lineTags(tags: Readonly<Record<string, string>>): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const key of LINE_TAGS) {
    const value = tags[key];
    if (value !== undefined) kept[key] = value;
  }
  return kept;
}

export class WaterCollector {
  readonly water: CollectedWater = {
    centrelines: [],
    barrierNodes: new Map(),
    barrierWays: [],
    portageWays: [],
    areas: [],
    memberWays: new Map(),
  };

  /** Member ways of kept multipolygons, read in a second pass over the ways. */
  readonly neededWays = new Set<number>();

  /** `want` hears every node id a kept element runs through: their positions are needed. */
  constructor(private readonly want: (nodeId: number) => void) {}

  node(id: number, tags: Readonly<Record<string, string>>): void {
    const barrier = barrierOf(tags, `node/${id}`);
    if (barrier) {
      this.water.barrierNodes.set(id, barrier);
      this.want(id);
    }
  }

  way(id: number, refs: readonly number[], tags: Readonly<Record<string, string>>): void {
    if (isNetworkLine(tags)) {
      this.keep(this.water.centrelines, { id, refs: [...refs], tags: lineTags(tags) });
      return;
    }
    const barrier = barrierOf(tags, `way/${id}`);
    if (barrier) {
      this.water.barrierWays.push({ id, refs: [...refs], tags: {}, barrier });
      this.wantAll(refs);
      return;
    }
    if (isPortageWay(tags)) {
      this.keep(this.water.portageWays, {
        id,
        refs: [...refs],
        tags: { access: tags.access ?? '', name: tags.name ?? '' },
      });
      return;
    }
    const closed = refs.length >= 4 && refs[0] === refs[refs.length - 1];
    if (closed && isLakeArea(tags)) {
      this.water.areas.push({ osmRef: `way/${id}`, name: tags.name ?? null, ring: [...refs] });
      this.wantAll(refs);
    }
  }

  relation(
    id: number,
    members: ReadonlyArray<{ type: string; ref: number; role: string }>,
    tags: Readonly<Record<string, string>>,
  ): void {
    if (tags.type !== 'multipolygon' || !isLakeArea(tags)) return;
    const ways = members.filter((member) => member.type === 'way');
    if (ways.length === 0) return;
    this.water.areas.push({
      osmRef: `relation/${id}`,
      name: tags.name ?? null,
      members: ways.map((member) => ({ way: member.ref, role: member.role })),
    });
    for (const member of ways) this.neededWays.add(member.ref);
  }

  /** The second pass: a member way's nodes, kept whatever the way's own tags say. */
  memberWay(id: number, refs: readonly number[]): void {
    if (!this.neededWays.has(id)) return;
    this.water.memberWays.set(id, [...refs]);
    this.wantAll(refs);
  }

  private keep(list: CollectedWay[], way: CollectedWay): void {
    list.push(way);
    this.wantAll(way.refs);
  }

  private wantAll(refs: readonly number[]): void {
    for (const ref of refs) this.want(ref);
  }
}
