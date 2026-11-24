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
