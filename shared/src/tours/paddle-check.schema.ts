import { paddleObstacleKindSchema } from '../paddle/paddle-obstacles.schema';

import { z } from 'zod';

/**
 * PAD-06 and PAD-09: the obstacle checklist of a paddle tour and the check
 * bench that sums it up. The server works out every entry, its status and
 * the basis a decision is bound to; a client sends back the basis of the
 * entry the user saw. Nothing here is a safety or legal clearance: an entry
 * is "decided" when the paddler made a choice, and a ban in the data counts
 * whatever was decided.
 */

export const OBSTACLE_DECISIONS = ['pass', 'portage', 'reroute', 'not_affected'] as const;
export const obstacleDecisionSchema = z.enum(OBSTACLE_DECISIONS);
export type ObstacleDecision = z.infer<typeof obstacleDecisionSchema>;

/** An OpenStreetMap object as the paddle data names it. */
export const osmRefSchema = z.string().regex(/^(node|way)\/\d{1,15}$/);
/** What a decision is about: one object, or the parts of one lock together (`lock:<smallest ref>`). */
export const obstacleKeySchema = z.string().regex(/^(lock:)?(node|way)\/\d{1,15}$/);

/** The longest route basis: four passages of nine samples. */
export const ROUTE_TOKEN_MAX = 1200;
/** The route near an obstacle as it was when decided: its relation, then the samples around each passage. */
export const routeTokenSchema = z
  .string()
  .max(ROUTE_TOKEN_MAX)
  .regex(/^p1:[on]:[-0-9,|;wp_]+$/);
/** The obstacle's material data as it was when decided: a hash and its position, or `gone` once kept without it. */
export const sourceTokenSchema = z.string().regex(/^(s1:[0-9a-f]{16}:-?\d{1,7},-?\d{1,8}|gone)$/);
export const obstacleBasisSchema = z.object({ route: routeTokenSchema, source: sourceTokenSchema });
export type ObstacleBasis = z.infer<typeof obstacleBasisSchema>;

/**
 * One change to the checklist: `decide` stores a decision against the basis
 * the user saw, `note` changes only the note, `clear` removes the decision,
 * `keep` keeps a decision about an object the data no longer holds.
 */
export const obstacleReviewOpSchema = z
  .object({
    key: obstacleKeySchema,
    op: z.enum(['decide', 'note', 'clear', 'keep']),
    decision: obstacleDecisionSchema.nullable(),
    note: z.string().trim().max(500).nullable(),
    basis: obstacleBasisSchema.nullable(),
  })
  .superRefine((op, ctx) => {
    const decides = op.op === 'decide';
    if (decides && (op.decision === null || op.basis === null)) {
      ctx.addIssue({ code: 'custom', path: ['decision'], message: 'a decision needs its choice and its basis' });
    }
    if (!decides && (op.decision !== null || op.basis !== null)) {
      ctx.addIssue({ code: 'custom', path: ['decision'], message: 'only a decision carries a choice and a basis' });
    }
    if ((op.op === 'clear' || op.op === 'keep') && op.note !== null) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'removing or keeping a decision carries no note' });
    }
  });
export type ObstacleReviewOp = z.infer<typeof obstacleReviewOpSchema>;

/** PUT /api/trips/:tripId/tours/:placeId/obstacle-reviews: changes to a paddle tour's checklist, at most one per obstacle. */
export const tourObstacleReviewsRequestSchema = z
  .object({ ops: z.array(obstacleReviewOpSchema).min(1).max(100) })
  .superRefine((body, ctx) => {
    const keys = body.ops.map((op) => op.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: 'custom', path: ['ops'], message: 'each obstacle at most once' });
    }
  });
export type TourObstacleReviewsRequest = z.infer<typeof tourObstacleReviewsRequestSchema>;

const latLng = z.tuple([z.number().finite(), z.number().finite()]);
/** [[south, west], [north, east]]. */
const bounds = z.tuple([latLng, latLng]);
const count = z.number().int().nonnegative();

/** What an object's tags say about paddling there, canoe read first (mirrors `PaddleAccess`). */
export const paddleAccessSchema = z.object({
  value: z.string().nullable(),
  source: z.enum(['canoe', 'boat', 'access']).nullable(),
  condition: z.string().nullable(),
  forbidden: z.boolean(),
  private: z.boolean(),
});

/**
 * Where an entry stands. Counted on the bench: open, decided, todo (a choice
 * whose plan is missing: no portage drawn yet, the route still passes),
 * review (the route or the data changed since) and gone (the data no longer
 * holds it). Shown apart as earlier decisions: kept, off_route, unknown.
 */
export const obstacleEntryStatusSchema = z.enum([
  'open',
  'decided',
  'todo',
  'review',
  'gone',
  'kept',
  'off_route',
  'unknown',
]);
export type ObstacleEntryStatus = z.infer<typeof obstacleEntryStatusSchema>;

export const obstacleDecisionRecordSchema = z.object({
  decision: obstacleDecisionSchema,
  note: z.string().nullable(),
  decided_at: z.string(),
  decided_by: z.number().int().nullable(),
});
export type ObstacleDecisionRecord = z.infer<typeof obstacleDecisionRecordSchema>;

/** The most entries one checklist carries; an area holding more answers as cut short. */
export const PADDLE_CHECK_MAX_ENTRIES = 300;
/** The most own portages and locks one checklist lists. */
export const PADDLE_CHECK_MAX_OWN = 100;
/** The most objects one entry names, and the most obstacles one portage lists as carried round. */
export const OBSTACLE_REFS_MAX = 30;

export const tourObstacleEntrySchema = z.object({
  key: obstacleKeySchema,
  /** The objects it stands for, the one nearest the route first: the map selects that one. */
  refs: z.array(osmRefSchema).min(1).max(OBSTACLE_REFS_MAX),
  kind: paddleObstacleKindSchema,
  name: z.string().nullable(),
  at: latLng,
  bounds,
  /** How it stands to the route; null for an earlier decision the route no longer meets. */
  relation: z.enum(['on_route', 'near']).nullable(),
  along_m: z.number().nullable(),
  distance_m: z.number().nullable(),
  passages: z.number().int().min(0).max(4),
  access: paddleAccessSchema,
  advice: z.literal('sup_lock_portage').nullable(),
  /** Whether the paddler's own portages carry round every passage of the route by it. */
  portage: z.enum(['planned', 'partial', 'none']),
  /** The latest check on site the data records (OSM `check_date`), as written; null when it records none. */
  local_check: z.string().nullable(),
  /** The date the data is current to. */
  data_as_of: z.string().nullable(),
  status: obstacleEntryStatusSchema,
  changed: z.array(z.enum(['route', 'source'])).max(2),
  /** What a decision now is bound to; null where nothing can be decided. */
  basis: obstacleBasisSchema.nullable(),
  decision: obstacleDecisionRecordSchema.nullable(),
});
export type TourObstacleEntry = z.infer<typeof tourObstacleEntrySchema>;

/** The paddler's own portages and locks, listed beside the data's objects: their own plan, never a fact from a source. */
export const tourOwnEntrySchema = z.object({
  kind: z.enum(['portage', 'lock']),
  /** The control point it belongs to on a planned tour; null on a recorded track. */
  index: z.number().int().nullable(),
  from_m: z.number(),
  to_m: z.number(),
  at: latLng,
  bounds,
  /** The obstacles a portage carries round. */
  covers: z.array(obstacleKeySchema).max(OBSTACLE_REFS_MAX),
  bypassed: z.boolean(),
  advice: z.literal('sup_lock_portage').nullable(),
  /** A carrying way the data records as forbidden or private. */
  conflict: z.enum(['forbidden', 'private']).nullable(),
});
export type TourOwnEntry = z.infer<typeof tourOwnEntrySchema>;

/** How far the obstacle data reaches over the route: covered, in part, not at all, cut short, or not readable now. */
export const paddleCheckDataSchema = z.enum(['covered', 'partial', 'none', 'limited', 'unavailable']);
export type PaddleCheckData = z.infer<typeof paddleCheckDataSchema>;

/** PAD-09: the check bench of a paddle tour in the tours list and the day plan. */
export const paddleCheckSchema = z.object({
  data: paddleCheckDataSchema,
  /** The date the obstacle data is current to (the oldest region read). */
  data_as_of: z.string().nullable(),
  /** When TREK read that data from its source, never a check on site. */
  read_at: z.string().nullable(),
  entries: count,
  open: count,
  review: count,
  decided: count,
  /** Bans and private ground on the route the data records, whatever was decided. */
  bans: count,
  own: count,
  /** Changes whenever the checklist would read differently. */
  revision: z.string().min(1).max(64),
});
export type PaddleCheck = z.infer<typeof paddleCheckSchema>;

/** PAD-06: the checklist of a paddle tour, in its detail. */
export const tourObstacleCheckSchema = z.object({
  revision: z.string().min(1).max(64),
  evaluated_at: z.string(),
  entries: z.array(tourObstacleEntrySchema).max(PADDLE_CHECK_MAX_ENTRIES),
  own: z.array(tourOwnEntrySchema).max(PADDLE_CHECK_MAX_OWN),
});
export type TourObstacleCheck = z.infer<typeof tourObstacleCheckSchema>;

/** What a decision keeps of its obstacle, so it still says what it was about once the data holds it no more. */
export const obstacleSnapshotSchema = z.object({
  v: z.literal(1),
  kind: paddleObstacleKindSchema,
  name: z.string().nullable(),
  refs: z.array(osmRefSchema).min(1).max(OBSTACLE_REFS_MAX),
  at: latLng,
  bounds,
  relation: z.enum(['on_route', 'near']),
  along_m: z.number(),
  region_id: z.string().nullable(),
  data_as_of: z.string().nullable(),
});
export type ObstacleSnapshot = z.infer<typeof obstacleSnapshotSchema>;
