import { ADDON_IDS } from '../../addons';
import type { McpContext } from '../../nest-mcp';
import { addonOffMessage, TRIP_ADDON_IDS } from './addons.constants';
import type { AddonsService } from './addons.service';

/**
 * The `when:` gates for addon-scoped MCP surfaces.
 *
 * They used to close over `addons.bridge`, which builds its own AddonsService
 * outside the container. That was never a preference — a decorator's options
 * object is built while the class is being defined, so the closure had no
 * `this` to reach an injected service through, and nine domains hid an edge to
 * the addons domain from the module graph to answer one boolean.
 *
 * `src/nest-mcp` now hands the gate the declaring controller instance, so the
 * only thing a domain has to do is expose the service it already injects:
 *
 *     constructor(private readonly vacay: VacayService, readonly addons: AddonsService) {}
 *     const vacayAddonOn = addonGate(ADDON_IDS.VACAY);
 *
 * `addons` is public rather than private because the gate is a module-level
 * function in the same file, not a method — TypeScript's `private` is scoped to
 * the class body.
 *
 * A gate runs once per session, when the tools are attached. A session about
 * no one trip registers a tool while the instance has the addon on or any
 * trip of the user switched it on for itself; a session pinned to one trip
 * (`ctx.tripId`, the assistant's trip chat) asks that trip alone, so a trip
 * that has the addon off is never offered its tools. Each gate also names the addons it stands
 * for (`addonIds`), so the host's tool gate (`trekTripAddonToolGate`) can ask
 * again on every call, for the trip the call names.
 */
export interface HasAddons {
  readonly addons: AddonsService;
}

/** A `when:` gate that also names the addons it requires, for the per-call check. */
type AddonGatePredicate = ((ctx: McpContext, self: HasAddons) => Promise<boolean>) & {
  readonly addonIds: readonly string[];
};

/** A gate of one's own that rides on addons: the per-call check asks them for the trip the call names. */
export function gateOnAddons(
  addonIds: readonly string[],
  predicate: (ctx: McpContext, self: HasAddons) => Promise<boolean>,
): AddonGatePredicate {
  return Object.assign(predicate, { addonIds });
}

/**
 * A trip addon is on for a session pinned to one trip while that trip has it
 * on, and for any other session while the instance or one of the user's trips
 * has it on; any other addon is the instance switch.
 */
async function onForUser(ctx: McpContext, self: HasAddons, addonId: string): Promise<boolean> {
  if (!TRIP_ADDON_IDS.has(addonId)) return self.addons.isAddonEnabled(addonId);
  if (ctx.tripId !== undefined) return self.addons.isEnabledForTrip(ctx.tripId, addonId);
  return self.addons.isEnabledForUserAnywhere(ctx.userId, addonId);
}

/** Gate an MCP entry on an addon being on for the user somewhere. */
export function addonGate(addonId: string): AddonGatePredicate {
  return gateOnAddons([addonId], (ctx, self) => onForUser(ctx, self, addonId));
}

/**
 * Gate an MCP entry on the instance switch alone, for a surface that stays
 * bound to it although its addon is a trip addon (doc-sync: the document
 * providers follow the instance's Documents switch). Each call still asks the
 * trip it names, so a trip that has the addon off refuses it too.
 */
export function instanceAddonGate(addonId: string): AddonGatePredicate {
  return gateOnAddons([addonId], (_ctx, self) => self.addons.isAddonEnabled(addonId));
}

/** Gate an MCP entry on every one of several addons, such as a tour's packing link. */
export function allAddonsGate(...addonIds: string[]): AddonGatePredicate {
  return gateOnAddons(addonIds, async (ctx, self) =>
    (await Promise.all(addonIds.map((id) => onForUser(ctx, self, id)))).every(Boolean),
  );
}

/**
 * Gate on one of collab's sub-feature flags. Every collab entry rides both the
 * addon toggle and its own flag (notes, polls, chat or links). The flags stay
 * instance-wide; only the addon follows the trip.
 */
export function collabFeatureGate(feature: 'chat' | 'notes' | 'polls' | 'links'): AddonGatePredicate {
  return gateOnAddons(
    [ADDON_IDS.COLLAB],
    async (ctx, self) =>
      (await onForUser(ctx, self, ADDON_IDS.COLLAB)) && (await self.addons.getCollabFeatures())[feature],
  );
}

/** The addons an entry's `when:` gate stands for; none for a gate built some other way. */
export function addonsOfGate(when: unknown): readonly string[] {
  if (typeof when !== 'function') return [];
  const ids = (when as { addonIds?: unknown }).addonIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

/**
 * What a trip resource answers while its addon is off for that trip.
 * Resources are read outside the tool gate, so each asks for its trip itself,
 * after its access check, and answers with the text a tool or route would.
 */
export function addonOffResource(uri: URL, addonId: string) {
  return {
    contents: [
      { uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ error: addonOffMessage(addonId) }) },
    ],
  };
}
