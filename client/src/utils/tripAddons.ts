import type { TripAddon } from '@trek/shared';

/**
 * Whether an addon applies to one trip.
 *
 * The trip's own list says it for every trip addon (lists, costs, files, collab,
 * road trip, tours), the owner's choice or the instance switch, whichever the
 * server worked out. An addon the list does not name (an integration such as
 * Dawarich, or any addon while the list is not known yet) follows the
 * instance switch the caller passes in.
 */
export function tripAddonEnabled(
  tripAddons: readonly TripAddon[] | null | undefined,
  addonId: string,
  instanceEnabled: boolean
): boolean {
  const own = tripAddons?.find((addon) => addon.id === addonId);
  return own ? own.enabled : instanceEnabled;
}

/** The trip addon a core trip tab belongs to; a plugin page that replaces the tab follows it. */
const TRIP_TAB_ADDON: Readonly<Record<string, string>> = {
  listen: 'packing',
  finanzplan: 'budget',
  dateien: 'documents',
  collab: 'collab',
};

/**
 * Whether a plugin's trip page shows on a trip. A page that replaces core tabs
 * stands in for them, so it shows while the addon of at least one of those tabs
 * is on for the trip; a page that replaces none (or only tabs no addon owns)
 * always shows.
 */
export function pluginPageShown(
  replaces: readonly string[] | undefined,
  addonOn: (addonId: string) => boolean
): boolean {
  const owned = (replaces ?? []).flatMap((tab) => (TRIP_TAB_ADDON[tab] ? [TRIP_TAB_ADDON[tab]] : []));
  return owned.length === 0 || owned.some(addonOn);
}
