import type { TripAddon } from '@trek/shared';
import { useCallback, useEffect, useMemo } from 'react';

import { useTranslation } from '../../i18n';
import { useAddonStore } from '../../store/addonStore';
import { tripAddonsEntry, useTripAddonsStore } from '../../store/tripAddonsStore';
import { onNetworkModeChange } from '../../sync/networkMode';
import { getApiErrorMessage } from '../../types';
import { refusedOffline } from '../../utils/needsConnection';
import { tripAddonEnabled } from '../../utils/tripAddons';
import { useToast } from '../shared/Toast';

const NONE: TripAddon[] = [];

/**
 * The trip addons of one trip, each on or off for it, for the trip planner and
 * the trip's settings. Reads the trip's list when the trip changes and again
 * when the connection comes back; a change another member's owner made arrives
 * live through useTripAddonsSync.
 *
 * - `addons`: every trip addon as the trip sees it, in the admin's order; empty
 *   until the first read answered (or offline with nothing kept).
 * - `isEnabled(id)`: whether an addon applies here; before the list is known,
 *   and for an addon it does not name, the instance switch.
 * - `setOverride(id, enabled)`: the owner switches one addon for the trip,
 *   `null` going back to the instance setting. Online only: offline it says so
 *   and answers false. Answers whether the server took the change.
 */
export function useTripAddons(tripId: number | null | undefined) {
  const toast = useToast();
  const { t } = useTranslation();
  const validId = tripId != null && Number.isSafeInteger(tripId) && tripId > 0 ? tripId : null;
  const entry = useTripAddonsStore((state) => tripAddonsEntry(state, validId));
  // The instance list, so isEnabled answers anew once it is read.
  const instanceAddons = useAddonStore((state) => state.addons);

  useEffect(() => {
    if (validId == null) return;
    const load = () => void useTripAddonsStore.getState().load(validId);
    load();
    return onNetworkModeChange(load);
  }, [validId]);

  const isEnabled = useCallback(
    (addonId: string) =>
      tripAddonEnabled(
        entry?.addons,
        addonId,
        instanceAddons.some((addon) => addon.id === addonId && addon.enabled)
      ),
    [entry?.addons, instanceAddons]
  );

  const setOverride = useCallback(
    async (addonId: string, enabled: boolean | null): Promise<boolean> => {
      if (validId == null || refusedOffline(toast, t)) return false;
      try {
        await useTripAddonsStore.getState().setOverride(validId, addonId, enabled);
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('trip.addons.saveFailed')));
        return false;
      }
    },
    [validId, toast, t]
  );

  return useMemo(
    () => ({
      addons: entry?.addons ?? NONE,
      loading: validId != null && (!entry || entry.status === 'loading'),
      /** A list is held, or the first read failed; until then isEnabled is the instance switch. */
      loaded: !!entry && (entry.addons != null || entry.status !== 'loading'),
      isEnabled,
      setOverride,
    }),
    [entry, validId, isEnabled, setOverride]
  );
}
