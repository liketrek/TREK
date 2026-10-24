import { recordOf, type Row } from './cards/card-values';
import type { TourRouteCard } from '@trek/shared';

/**
 * "Plan this" on the planner's other searches the assistant ran: a round
 * hike and another way for one leg of a hike, created as a hike through the
 * points the proposal answered (create_with), and a wanderer trail, imported
 * with the fingerprint its preview answered. What is created comes from the
 * stored proposal, never from the request.
 */

/** The proposing reads of this kind, and the tool each one is created through. */
export const WAY_CREATES: Readonly<Record<string, string>> = {
  propose_round_hike: 'create_hike',
  propose_hike_leg_way: 'create_hike',
  preview_wanderer_trail: 'import_wanderer_trail',
};

/** The fields of a round or a leg's way a hike is created with as the call asked them. */
const ASKED_FIELDS = ['name', 'max_hiking_difficulty', 'hiking_preferences', 'day_id', 'start_time'] as const;

/** A point of create_with as create_hike takes it: where it is, its name, its kind and a stage ending there. */
function pointOf(row: Row): Row | null {
  if (typeof row.lat !== 'number' || typeof row.lng !== 'number') return null;
  return {
    lat: row.lat,
    lng: row.lng,
    ...(typeof row.name === 'string' ? { name: row.name } : {}),
    ...(typeof row.poi_category === 'string' ? { poi_category: row.poi_category } : {}),
    ...(row.stage_end === true ? { stage_end: true } : {}),
  };
}

/** Whether `toolName` is one of these searches. */
export function isWayProposal(toolName: string): boolean {
  return Object.prototype.hasOwnProperty.call(WAY_CREATES, toolName);
}

/**
 * The change a taken way holds, or null when nothing can be created from it:
 * a way that was not planned, the way of a saved hike's leg (that hike is
 * changed with update_tour), a trail already in the trip as it is.
 */
export function wayTakeArgsOf(toolName: string, args: Row, result: Row, card: TourRouteCard): Row | null {
  const via = WAY_CREATES[toolName];
  if (via === 'import_wanderer_trail') {
    if (result.state === 'unchanged' || typeof args.trailId !== 'string' || typeof result.contentHash !== 'string') {
      return null;
    }
    return { via, trailId: args.trailId, contentHash: result.contentHash };
  }
  if (via !== 'create_hike' || !card.routed || card.placeId !== null) return null;
  const create = recordOf(result.create_with);
  const rows = Array.isArray(create.waypoints) ? create.waypoints.map(recordOf) : [];
  const waypoints = rows.map(pointOf);
  if (waypoints.length < 2 || waypoints.some((point) => point === null)) return null;
  const taken: Row = { via, waypoints, round_trip: create.round_trip === true };
  for (const key of ASKED_FIELDS) if (args[key] !== undefined) taken[key] = args[key];
  return taken;
}
