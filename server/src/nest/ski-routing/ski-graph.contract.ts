/**
 * SGR1, the graph of one ski area as the Places host writes it
 * (trek-places-api `winter/sgr.py`, codes in `winter/model.py`). Every number
 * here is part of that contract: a change to an existing value is a new
 * format, never a fix. The golden file `tests/fixtures/ski/golden-v1.sgr` is
 * the same bytes the writer's own test pins.
 */

export const SGR_MAGIC = 'SGR1';
export const SGR_FORMAT = 1;

/** What an edge may be used for, per direction (`edgeFwdUses` a to b, `edgeBackUses` b to a). */
export const Use = {
  DOWNHILL: 1 << 0,
  LIFT_UP: 1 << 1,
  LIFT_DOWN: 1 << 2,
  NORDIC_CLASSIC: 1 << 3,
  NORDIC_SKATING: 1 << 4,
  SKITOUR_UP: 1 << 5,
  SKITOUR_DOWN: 1 << 6,
  SNOWSHOE: 1 << 7,
  WINTER_HIKE: 1 << 8,
  WALK: 1 << 9,
} as const;

export const Kind = {
  RUN: 0,
  LIFT: 1,
  RAIL: 2,
  BOARD: 3,
  ALIGHT: 4,
  NORDIC: 5,
  SKITOUR: 6,
  HIKE: 7,
  SLED_WALKUP: 8,
  CONNECTION: 9,
  AREA: 10,
  LINK: 11,
  CROSSING: 12,
  WALK: 13,
} as const;

/** `edgeDiff`: novice to extreme, 255 where the data gives none. */
export const DIFFICULTY_NAMES = [
  'novice',
  'easy',
  'intermediate',
  'advanced',
  'expert',
  'freeride',
  'extreme',
] as const;
export const DIFF_UNKNOWN = 255;
export const DIFF_EXPERT = 4;

/** `edgeGroom` bits. */
export const Groom = {
  CLASSIC: 1 << 0,
  SKATING: 1 << 1,
  SCOOTER: 1 << 2,
  BACKCOUNTRY: 1 << 3,
  MOGUL: 1 << 4,
  ASSUMED: 1 << 7,
} as const;

/** `edgeLift`, as OpenStreetMap names each type. */
export const LIFT_NAMES = [
  'none',
  'cable_car',
  'gondola',
  'mixed_lift',
  'chair_detachable',
  'chair_fixed',
  'drag_lift',
  't-bar',
  'j-bar',
  'platter',
  'rope_tow',
  'magic_carpet',
  'funicular',
  'rack_railway',
] as const;

export const Lift = {
  NONE: 0,
  CABLE_CAR: 1,
  GONDOLA: 2,
  MIXED: 3,
  CHAIR_DETACHABLE: 4,
  CHAIR_FIXED: 5,
  DRAG: 6,
  TBAR: 7,
  JBAR: 8,
  PLATTER: 9,
  ROPE_TOW: 10,
  MAGIC_CARPET: 11,
  FUNICULAR: 12,
  RACK: 13,
} as const;

/** `nodeFlags` bits. */
export const NodeFlag = {
  STATION: 1 << 0,
  PORTAL: 1 << 1,
  DISMOUNT_YES: 1 << 2,
  DISMOUNT_SOMETIMES: 1 << 3,
  LIFT_INTERNAL: 1 << 4,
  BOUNDARY: 1 << 5,
  ELE_MISSING: 1 << 6,
  AREA_INTERIOR: 1 << 7,
} as const;

/**
 * `edgeFlags` bits. Bits 17 and 18 are the writer's beyond the first draft of
 * the format: an area edge whose polygon holds a mapped run (cost x1.3), and a
 * way tagged `piste:type=yes`, usable as a connection only (cost x1.5).
 */
export const EdgeFlag = {
  DIR_FROM_DEM: 1 << 0,
  DIR_CONFLICT: 1 << 1,
  RELATION_INHERITED: 1 << 2,
  TECHNIQUE_ASSUMED: 1 << 3,
  INFERRED_LINK: 1 << 4,
  INFERRED_CROSSING: 1 << 5,
  AREA_DERIVED: 1 << 6,
  TUNNEL: 1 << 7,
  LIT: 1 << 8,
  SKITOUR_UPHILL_OK: 1 << 9,
  HIGHWAY_SHARED: 1 << 10,
  FLAT_FOR_BOARD: 1 << 11,
  RIDE_DOWN: 1 << 12,
  HEATED: 1 << 13,
  BUBBLE: 1 << 14,
  NORDIC_SOFT_ONEWAY: 1 << 15,
  HALO: 1 << 16,
  AREA_HAS_RUN: 1 << 17,
  TYPE_UNKNOWN: 1 << 18,
} as const;

/** A height the terrain data does not have. */
export const ELE_MISSING = -32768;
/** A string offset that names no string. */
export const NO_STRING = 0xffffffff;

/** The head of an SGR1 file, as JSON. */
export interface SkiGraphHeader {
  format: number;
  build: string | null;
  areaId: string | null;
  name: string | null;
  kind: string | null;
  country: string | null;
  colourScheme: string | null;
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number] | null;
  counts: Record<string, number> | null;
  nodeCount: number;
  edgeCount: number;
  geomCount: number;
  stringBytes: number;
  crc32: number;
}

/** One area's graph as decoded: the file's arrays, as typed arrays, and its string pool. */
export interface SkiGraphData {
  header: SkiGraphHeader;
  nodeLatE7: Int32Array;
  nodeLngE7: Int32Array;
  nodeEle: Int16Array;
  nodeFlags: Uint16Array;
  nodeOsm: Float64Array;
  edgeA: Uint32Array;
  edgeB: Uint32Array;
  edgeLen: Float32Array;
  edgeUp: Uint16Array;
  edgeDown: Uint16Array;
  edgeKind: Uint8Array;
  edgeFwdUses: Uint16Array;
  edgeBackUses: Uint16Array;
  edgeDiff: Uint8Array;
  edgeGroom: Uint8Array;
  edgeLift: Uint8Array;
  edgeLiftSec: Uint16Array;
  edgeLiftCap: Uint16Array;
  edgeFlags: Uint32Array;
  edgeName: Uint32Array;
  edgeRef: Uint32Array;
  edgeWay: Float64Array;
  edgeGeomOff: Uint32Array;
  geomLatE7: Int32Array;
  geomLngE7: Int32Array;
  geomEle: Int16Array;
  /** The string pool: UTF-8, each string ended by a NUL, addressed by its byte offset. */
  strings: Uint8Array;
}
