import { errorResult, type McpToolGate } from '../../nest-mcp';
import { toRowId } from '../common/row-id';
import type { TripAccessService } from '../trip-membership/trip-access.service';
import { addonsOfGate } from './addon-gate';
import { addonOffMessage, TRIP_ADDON_IDS } from './addons.constants';
import type { AddonsService } from './addons.service';

/** The trip a call names in its `tripId` argument, or null for a call about no one trip. */
function tripIdOf(args: unknown): number | null {
  if (!args || typeof args !== 'object' || !('tripId' in args)) return null;
  return toRowId((args as { tripId: unknown }).tripId);
}

/**
 * The per-call half of the addon gates. A tool's `when:` gate (addonGate,
 * collabFeatureGate, ...) runs once, when a session attaches its tools, and
 * registers a tool while its addon is on anywhere for the user. This gate runs
 * on every call of such a tool and asks again for the trip the call names: a
 * trip that has the addon off refuses with `<Label> addon is not enabled`, the
 * text REST answers with, and a trip that switched it on although the
 * instance has it off lets the call through. A call that names no trip is
 * asked about the trip its session is pinned to (`ctx.tripId`, the
 * assistant's trip chat), else about the user's trips as a whole.
 *
 * A trip the caller cannot see is left to the tool, which answers with its own
 * "not found": answering for the addon would tell a stranger what a trip's
 * owner chose, and so that the trip exists.
 *
 * Only trip addons are asked per call; an instance-wide addon (journey, vacay,
 * collections) has no trip side, and switching one off tears the sessions
 * down. Collab's sub-features (chat, notes, polls, links) stay instance-wide,
 * so only the addon itself is asked here.
 */
export function trekTripAddonToolGate(addons: AddonsService, trips: TripAccessService): McpToolGate {
  return async (tool, ctx, args) => {
    const ids = addonsOfGate(tool.when).filter((id) => TRIP_ADDON_IDS.has(id));
    if (ids.length === 0) return undefined;
    const tripId = tripIdOf(args) ?? ctx.tripId ?? null;
    if (tripId !== null && !(await trips.findAccessible(tripId, ctx.userId))) return undefined;
    const on = await Promise.all(
      ids.map((id) =>
        tripId === null ? addons.isEnabledForUserAnywhere(ctx.userId, id) : addons.isEnabledForTrip(tripId, id),
      ),
    );
    const off = ids.find((_id, i) => !on[i]);
    return off === undefined ? undefined : errorResult(addonOffMessage(off));
  };
}
