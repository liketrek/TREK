import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ADDON = 'trek:require-addon';

export interface RequireAddonMeta {
  addonId: string;
  /** Leads the 404 body: `${label} addon is not enabled`. */
  label: string;
}

/**
 * Gate a controller (or a single handler) on a global addon toggle. When the
 * admin has the addon off, the route answers 404 as if it did not exist.
 *
 * Pair it with AddonGuard, and list that guard BEFORE JwtAuthGuard:
 *
 *   @UseGuards(AddonGuard, JwtAuthGuard)
 *   @RequireAddon(ADDON_IDS.JOURNEY, 'Journey')
 *
 * The order is the contract, not a preference — a disabled addon has to answer
 * 404 to anonymous callers too, so the addon check has to run before the 401.
 */
export const RequireAddon = (addonId: string, label: string) =>
  SetMetadata<string, RequireAddonMeta>(REQUIRE_ADDON, { addonId, label });
