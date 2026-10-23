import type { JsonColumn } from '../utils/json-column';
import {
  travelTransfer,
  FERRATAS_RESULT_CAP,
  dawarichTrackSegmentSchema,
  ferrataSchema,
  hikingPreferencesSchema,
  obstacleSnapshotSchema,
  paddleGeometrySchema,
  paddleLockSchema,
  paddleRegionBoundarySchema,
  paddleRegionGraphStatsSchema,
  skiPlannedLegsSchema,
  skiRouteOptionsSchema,
  tourChangeSchema,
  tourFixedLegSchema,
  tourSourceHintChangeSchema,
  tourWaypointSchema,
  trackMarksSchema,
  type DawarichTrackSegment,
  type Ferrata,
  type GeometryPoint,
  type HikingPreferences,
  type ObstacleSnapshot,
  type PaddleGeometry,
  type PaddleLock,
  type PaddleRegionBoundary,
  type PaddleRegionGraphStats,
  type TourChange,
  type TourFixedLeg,
  type TourSourceHintChange,
  type TourWaypoint,
  type TrackMarks,
} from '@trek/shared';

import { z } from 'zod';

/**
 * The JSON-in-TEXT columns the services decode, one declaration each: the shape
 * the column holds and what a reader gets when a row is empty or broken. Read
 * them with `decodeJson`/`decodeJsonResult` and write server-built values with
 * `encodeJson` (`utils/json-column.ts`), never with a bare `JSON.parse` at the
 * call site.
 *
 * These are storage shapes, not API contracts: `reservations.metadata` goes out
 * as the stored string, and the scope lists are plain string arrays whose
 * values the OAuth layer checks against its own scope table.
 */

/** The free-form booking details (times, carrier, legs, the mirrored price). Old rows can hold a JSON string of the JSON. */
export const RESERVATION_METADATA: JsonColumn<Record<string, unknown>> = {
  column: 'reservations.metadata',
  schema: z.record(z.string(), z.unknown()),
  fallback: () => ({}),
  unwrapDoubleEncoded: true,
};

const stringList = z.array(z.string());

/** The scopes an OAuth token was issued with. A broken row grants nothing. */
export const OAUTH_TOKEN_SCOPES: JsonColumn<string[]> = {
  column: 'oauth_tokens.scopes',
  schema: stringList,
  fallback: () => [],
};

/** The scopes an OAuth client may ask for. A broken row allows nothing. */
export const OAUTH_CLIENT_ALLOWED_SCOPES: JsonColumn<string[]> = {
  column: 'oauth_clients.allowed_scopes',
  schema: stringList,
  fallback: () => [],
};

/** The redirect URIs an OAuth client registered. A broken row matches none. */
export const OAUTH_CLIENT_REDIRECT_URIS: JsonColumn<string[]> = {
  column: 'oauth_clients.redirect_uris',
  schema: stringList,
  fallback: () => [],
};

/** The scopes a user consented to for a client. A broken row counts as consent to nothing, so the user is asked again. */
export const OAUTH_CONSENT_SCOPES: JsonColumn<string[]> = {
  column: 'oauth_consents.scopes',
  schema: stringList,
  fallback: () => [],
};

/** A limited API token's scopes; the reader keeps the strings it knows. */
export const MCP_TOKEN_API_SCOPES: JsonColumn<unknown[]> = {
  column: 'mcp_tokens.api_scopes',
  schema: z.array(z.unknown()),
  fallback: () => [],
};

/** The hashed MFA backup codes; the reader keeps the strings. A broken row holds no codes. */
export const USER_MFA_BACKUP_CODES: JsonColumn<unknown[]> = {
  column: 'users.mfa_backup_codes',
  schema: z.array(z.unknown()),
  fallback: () => [],
};

/** A journey entry's tags. */
export const JOURNEY_ENTRY_TAGS: JsonColumn<string[]> = {
  column: 'journey_entries.tags',
  schema: z.array(z.string()),
  fallback: () => [],
};

/**
 * A journey entry's pros and cons (`{ pros, cons }`). Checked as an object
 * only: the lists inside go out as they were stored.
 */
export const JOURNEY_ENTRY_PROS_CONS: JsonColumn<Record<string, unknown> | null> = {
  column: 'journey_entries.pros_cons',
  schema: z.record(z.string(), z.unknown()).nullable(),
  fallback: () => null,
};

/** A poll's options: plain labels, or `{ label }` objects from older rows. Checked as a list only. */
export const COLLAB_POLL_OPTIONS: JsonColumn<unknown[]> = {
  column: 'collab_polls.options',
  schema: z.array(z.unknown()),
  fallback: () => [],
};

/**
 * An expense's itemized receipt (#1658): each line's price as typed and the user
 * ids in on it. The client writes it; the server only reads it to take a departed
 * guest off the lines, so every key it does not know is kept as it is.
 */
export const BUDGET_ITEM_TICKET: JsonColumn<{ items: { price?: string | number; parts?: number[] }[] } | null> = {
  column: 'budget_items.ticket_json',
  schema: z
    .object({
      items: z.array(
        z.looseObject({ price: z.union([z.string(), z.number()]).optional(), parts: z.array(z.number()).optional() }),
      ),
    })
    .loose(),
  fallback: () => null,
};

/** What one cell of the via ferrata grid holds: its ferratas, and whether the Overpass answer they came from was cut. */
export interface FerrataTilePayload {
  ferratas: Ferrata[];
  truncated: boolean;
}

/**
 * One via ferrata grid cell, as Overpass answered it. Checked against the wire
 * contract, so a stored row can go out as it is. A broken row reads as a cell
 * never fetched (null), and the next request asks Overpass for it again.
 */
export const FERRATA_TILE_PAYLOAD: JsonColumn<FerrataTilePayload | null> = {
  column: 'ferrata_tiles.payload',
  schema: z.object({ ferratas: z.array(ferrataSchema).max(FERRATAS_RESULT_CAP), truncated: z.boolean() }).nullable(),
  fallback: () => null,
};

/**
 * A tour leg taken as a fixed line (a via ferrata's own line from OSM, a
 * section of a horse route, a stretch drawn by hand) rather than routed. A row that does not decode reads as a routed leg, which the
 * editor then plans again.
 */
export const TOUR_WAYPOINT_FIXED_LEG: JsonColumn<TourFixedLeg | null> = {
  column: 'tour_waypoints.fixed_leg',
  schema: tourFixedLegSchema.nullable(),
  fallback: () => null,
};

/**
 * PAD-07: a lock at a control point of a paddle tour, with the times the
 * paddler expects there. A row that does not decode reads as no lock, so the
 * estimate names nothing it cannot read.
 */
export const TOUR_WAYPOINT_LOCK: JsonColumn<PaddleLock | null> = {
  column: 'tour_waypoints.lock',
  schema: paddleLockSchema.nullable(),
  fallback: () => null,
};

/**
 * PAD-03: portages and locks laid onto a recorded track. A row that does not
 * decode reads as no marks; the track itself is untouched either way.
 */
export const TOUR_TRACK_MARKS: JsonColumn<TrackMarks | null> = {
  column: 'tours.track_marks',
  schema: trackMarksSchema.nullable(),
  fallback: () => null,
};

/** MF-08: a hike's routing preferences. A broken row reads as none, so the hike routes as it would without. */
export const TOUR_HIKING_PREFERENCES: JsonColumn<HikingPreferences | null> = {
  column: 'tours.hiking_preferences',
  schema: hikingPreferencesSchema.nullable(),
  fallback: () => null,
};

/**
 * What a ski tour's legs were planned with: the piste router's options and the
 * piste data build they ran on. planned_legs names the legs the piste router
 * planned, by the index of the point each starts at; absent where the save did not say.
 */
const tourSkiRouteSchema = z.object({
  options: skiRouteOptionsSchema,
  build: z.string().nullable(),
  planned_legs: skiPlannedLegsSchema.optional(),
});

export type TourSkiRoute = z.infer<typeof tourSkiRouteSchema>;

/** A ski tour's piste router options. A broken row reads as none, and the planner offers the defaults. */
export const TOUR_SKI_ROUTE: JsonColumn<TourSkiRoute | null> = {
  column: 'tours.ski_options',
  schema: tourSkiRouteSchema.nullable(),
  fallback: () => null,
};

/** A paddle object's own geometry (PAD-05A). A broken row has none, and the object is left out rather than drawn anywhere. */
export const PADDLE_FEATURE_GEOMETRY: JsonColumn<PaddleGeometry | null> = {
  column: 'paddle_features.geometry',
  schema: paddleGeometrySchema.nullable(),
  fallback: () => null,
};

/** The OSM tags a paddle object was judged by. A broken row shows none. */
export const PADDLE_FEATURE_TAGS: JsonColumn<Record<string, string>> = {
  column: 'paddle_features.tags',
  schema: z.record(z.string(), z.string()),
  fallback: () => ({}),
};

/** The boundary of a region TREK reads paddle data for. A broken row has none, and the region counts by its box. */
export const PADDLE_REGION_BOUNDARY: JsonColumn<PaddleRegionBoundary | null> = {
  column: 'paddle_regions.boundary',
  schema: paddleRegionBoundarySchema.nullable(),
  fallback: () => null,
};

/** What a paddle region's water network holds (PAD-11). A broken row has none, and the region shows no network figures. */
export const PADDLE_REGION_GRAPH_STATS: JsonColumn<PaddleRegionGraphStats | null> = {
  column: 'paddle_water_graphs.stats',
  schema: paddleRegionGraphStatsSchema.nullable(),
  fallback: () => null,
};

/** What a paddle tour's obstacle decision keeps of its obstacle (PAD-06). A broken row has none, and the decision is left out. */
export const TOUR_OBSTACLE_SNAPSHOT: JsonColumn<ObstacleSnapshot | null> = {
  column: 'tour_obstacle_reviews.obstacle_snapshot',
  schema: obstacleSnapshotSchema.nullable(),
  fallback: () => null,
};

/**
 * MCP-T03: the changes a saved step confirmed, as they were prepared. A broken
 * row reads as none, so a step never claims changes it cannot show.
 */
export const TOUR_CHANGE_STEP_CHANGES: JsonColumn<TourChange[]> = {
  column: 'tour_change_steps.changes',
  schema: z.array(tourChangeSchema),
  fallback: () => [],
};

/**
 * A point of a saved line: latitude, longitude and the height where it has one.
 * Checked by hand rather than as a union of tuples: the server compiles without
 * strictNullChecks, where a tuple schema reads as one of optional elements and
 * would not hand back the GeometryPoint the restore writes.
 */
const savedLinePoint = z.custom<GeometryPoint>(
  (value) =>
    Array.isArray(value) &&
    (value.length === 2 || value.length === 3) &&
    value.every((n: unknown) => typeof n === 'number'),
);

/** A tour as it was before a saved step (MCP-T03), as its JSON column holds it. */
const tourChangeStepBeforeSchema = z.object({
  route_geometry: z.array(savedLinePoint).nullable(),
  waypoints: z.array(tourWaypointSchema),
  distance: z.number().nullable(),
  duration: z.number().nullable(),
  elevation_gain: z.number().nullable(),
  elevation_loss: z.number().nullable(),
});
export type TourChangeStepBefore = z.infer<typeof tourChangeStepBeforeSchema>;

/**
 * MCP-T03: a tour as it was before a saved step changed it: its line (null
 * while it had none), its points with their keys, and the measures the save
 * replaced, null where they were not known. A broken row reads as no earlier
 * state, so nothing is ever restored from a guess.
 */
export const TOUR_CHANGE_STEP_BEFORE: JsonColumn<TourChangeStepBefore | null> = {
  column: 'tour_change_steps.before_state',
  schema: tourChangeStepBeforeSchema.nullable(),
  fallback: () => null,
};

/**
 * LIB-03: the control points of a tour kept in a collection, in route order,
 * as they were when it was saved. A broken row reads as none and is logged;
 * the line is kept in a column of its own and stays as it was.
 */
export const COLLECTION_TOUR_WAYPOINTS: JsonColumn<TourWaypoint[]> = {
  column: 'collection_tours.waypoints',
  schema: z.array(tourWaypointSchema),
  fallback: () => [],
};

/**
 * WAN-02: the parts of a trail the background watch found proven changed in
 * its record, for one snapshot's hint. A broken row names none; the hint's
 * state still says that something changed.
 */
export const TOUR_SOURCE_HINT_CHANGES: JsonColumn<TourSourceHintChange[]> = {
  column: 'tour_source_hints.changes',
  schema: z.array(tourSourceHintChangeSchema),
  fallback: () => [],
};

/**
 * JRN-01: the pieces of a day's recorded route a journey keeps, each with its
 * mode and times. A broken row reads as none, so a day never draws a line it
 * cannot vouch for.
 */
export const JOURNEY_RECORDED_DAY_SEGMENTS: JsonColumn<DawarichTrackSegment[]> = {
  column: 'journey_recorded_days.segments',
  schema: z.array(dawarichTrackSegmentSchema),
  fallback: () => [],
};

/** Transfer data never falls back to an empty graph/receipt (that could cause a duplicate apply). */
export const TRANSFER_GRAPH = {
  column: 'travel_transfer_graphs.graph',
  schema: travelTransfer.graphSchema,
  fallback: (): never => {
    throw new Error('Corrupt transfer graph');
  },
};
export const TRANSFER_ORIGINALS = {
  column: 'travel_transfer_graphs.originals',
  schema: z.record(travelTransfer.token, travelTransfer.digest),
  fallback: (): never => {
    throw new Error('Corrupt transfer originals');
  },
};
export const TRANSFER_RECEIPT = {
  column: 'travel_transfer_operations.receipt',
  schema: z.strictObject({
    request: travelTransfer.digest,
    response: z.strictObject({
      state: z.literal('applied'),
      payload_digest: travelTransfer.digest,
      trip_id: travelTransfer.token,
      revision: travelTransfer.token,
    }),
  }),
  fallback: (): never => {
    throw new Error('Corrupt transfer receipt');
  },
};

/** Server-owned row bindings. Incoming source metadata is never an authority for local IDs. */
export const TRANSFER_NATIVE_MAP = {
  column: 'travel_transfer_graphs.native_map',
  schema: z.record(
    travelTransfer.token,
    z.strictObject({
      table: z.string(),
      key: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
      baseline: travelTransfer.recordSchema,
    }),
  ),
  fallback: (): never => {
    throw new Error('Corrupt native transfer mappings');
  },
};
export type TransferNativeMap = z.infer<typeof TRANSFER_NATIVE_MAP.schema>;
