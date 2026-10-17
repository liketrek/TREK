import { PLANNER_TRIP_VIEWS_KEY, compactPlannerTripViews, type PlannerTripViewFlag } from '@trek/shared';
import { useCallback, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

function readSession(key: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw === '1' ? true : raw === '0' ? false : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, on: boolean): void {
  try {
    sessionStorage.setItem(key, on ? '1' : '0');
  } catch {
    /* the account row still has it */
  }
}

interface TabCopy {
  key: string;
  on: boolean | null;
  /** A switch made here that the account row has not taken yet. */
  pending: boolean;
}

/**
 * One of the planner's remembered view switches: road trip mode, the Dawarich
 * trail or the route overview (#2639). The account keeps them per trip, so they
 * are back in another browser or on another device. The tab keeps a copy of
 * its own that answers until the account's settings have arrived, so a reload
 * does not open on the plain view and then jump. Once they are here they
 * decide, because a switch flipped on another device is newer than this tab.
 */
export function usePlannerTripView(tripId: number, flag: PlannerTripViewFlag): [boolean, () => void] {
  const sessionKey = `trip-${flag}-${tripId}`;
  const saved = useSettingsStore((s) => s.settings.planner_trip_views?.[String(tripId)]?.[flag] === true);
  const loaded = useSettingsStore((s) => s.isLoaded);
  const [local, setLocal] = useState<TabCopy>(() => ({ key: sessionKey, on: readSession(sessionKey), pending: false }));
  // A different trip in the same planner reads its own copy instead of keeping this one.
  const copy = local.key === sessionKey ? local : { key: sessionKey, on: readSession(sessionKey), pending: false };
  const shown = loaded && !copy.pending ? saved : (copy.on ?? saved);

  const toggle = useCallback(() => {
    const next = !shown;
    setLocal({ key: sessionKey, on: next, pending: true });
    writeSession(sessionKey, next);
    void remember(tripId, flag, next).finally(() => {
      setLocal((prev) => (prev.key === sessionKey && prev.on === next ? { ...prev, pending: false } : prev));
    });
  }, [shown, sessionKey, tripId, flag]);

  return [shown, toggle];
}

async function remember(tripId: number, flag: PlannerTripViewFlag, on: boolean): Promise<void> {
  const store = useSettingsStore.getState();
  // The row holds every trip, so it is only written over once the account's
  // own copy is here; otherwise one switch would erase all the others. The
  // store takes the new value before the request goes out, so an offline save
  // still shows for the rest of the session.
  if (!store.isLoaded) await store.loadSettings();
  const { settings, isLoaded, updateSetting } = useSettingsStore.getState();
  if (!isLoaded) return;
  const views = { ...settings.planner_trip_views };
  views[String(tripId)] = { ...views[String(tripId)], [flag]: on };
  try {
    await updateSetting(PLANNER_TRIP_VIEWS_KEY, compactPlannerTripViews(views));
  } catch {
    // Offline or refused: the store and the tab copy keep the switch for this session.
  }
}
