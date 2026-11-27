import { useEffect, useState } from 'react';

import { offlineDb } from '../../db/offlineDb';
import { isTripOfflineEnabled, isTripPinned } from '../../sync/offlinePrefs';
import { isDateEligible } from '../../sync/tripSyncManager';
import type { Trip } from '../../types';

/** Where a trip stands on this device (#1580), as the trip's own menu says it. */
export type TripOfflineState = { kind: 'saved'; at: number } | { kind: 'pending' } | { kind: 'off' };

/**
 * The trip's state from what decides it: switched off, or kept by neither the
 * date rule nor a pin, it is not on the device; synced before, it is, as of then;
 * otherwise the next sync brings it.
 */
export function tripOfflineState(
  enabled: boolean,
  kept: boolean,
  lastSyncedAt: number | null | undefined
): TripOfflineState {
  if (!enabled || !kept) return { kind: 'off' };
  if (lastSyncedAt) return { kind: 'saved', at: lastSyncedAt };
  return { kind: 'pending' };
}

/**
 * The offline state of one trip, read again each time `active` turns on (the
 * menu opening), so it shows the last sync rather than the one before it.
 */
export function useTripOfflineStatus(trip: Trip | null | undefined, active: boolean): TripOfflineState | null {
  const [state, setState] = useState<TripOfflineState | null>(null);
  useEffect(() => {
    if (!active || !trip) return;
    let cancelled = false;
    const enabled = isTripOfflineEnabled(trip.id);
    const kept = isTripPinned(trip.id) || isDateEligible(trip);
    void offlineDb.syncMeta.get(trip.id).then(
      (meta) => {
        if (!cancelled) setState(tripOfflineState(enabled, kept, meta?.lastSyncedAt));
      },
      // An unreadable store says nothing about the trip: the line stays away.
      () => {
        if (!cancelled) setState(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [trip, active]);
  return state;
}
