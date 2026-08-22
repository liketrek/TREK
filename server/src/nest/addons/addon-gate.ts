import type { McpContext } from '../../nest-mcp';
import type { AddonsService } from './addons.service';
import { ADDON_IDS } from '../../addons';

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
 */
export interface HasAddons {
  readonly addons: AddonsService;
}

/** Gate an MCP entry on an addon being enabled. */
export function addonGate(addonId: string) {
  return (_ctx: McpContext, self: HasAddons): boolean => self.addons.isAddonEnabled(addonId);
}

/**
 * Gate on one of collab's sub-feature flags. Every collab entry rides both the
 * addon toggle and its own flag — notes, polls or chat.
 */
export function collabFeatureGate(feature: 'chat' | 'notes' | 'polls') {
  return (_ctx: McpContext, self: HasAddons): boolean =>
    self.addons.isAddonEnabled(ADDON_IDS.COLLAB) && self.addons.getCollabFeatures()[feature];
}
