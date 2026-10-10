import { useEffect, useRef, useState } from 'react';

import { adminApi } from '../../api/client';
import type { useToast } from '../shared/Toast';

export type Preferences = Record<string, Record<string, boolean>>;

export interface AdminPreferenceMatrix {
  event_types: string[];
  channels?: { id: string; active: boolean }[];
  implemented_combos: Record<string, string[] | undefined>;
  preferences: Preferences;
}

// Admin-scoped events only ever go out over the built-in channels (plugin channels are
// user-scoped), so this list stays explicit rather than server-driven.
const BUILTIN_CHANNELS = ['inapp', 'email', 'webhook', 'ntfy'] as const;

/** The built-in channels that are active and implemented for at least one event. */
export function visibleAdminChannels(matrix: AdminPreferenceMatrix): string[] {
  const isActive = (id: string) => matrix.channels?.some((c) => c.id === id && c.active) ?? false;
  return BUILTIN_CHANNELS.filter(
    (ch) => isActive(ch) && matrix.event_types.some((evt) => matrix.implemented_combos[evt]?.includes(ch))
  );
}

/**
 * The per event and per channel admin notification matrix behind both shells: loaded once
 * on mount, and each toggle saved straight away. The desktop panel and the phone card
 * render their own markup over it.
 */
export function useAdminNotificationMatrix(t: (k: string) => string, toast: ReturnType<typeof useToast>) {
  const [matrix, setMatrix] = useState<AdminPreferenceMatrix | null>(null);
  const [saving, setSaving] = useState(false);
  // Toggles fire faster than React re-renders, so the live preferences are mirrored in a
  // ref. Reading state out of the render closure would let a second toggle undo the first.
  const prefsRef = useRef<Preferences | null>(null);

  const writePrefs = (prefs: Preferences) => {
    prefsRef.current = prefs;
    setMatrix((m) => (m ? { ...m, preferences: prefs } : m));
  };

  useEffect(() => {
    adminApi
      .getNotificationPreferences()
      .then((data: AdminPreferenceMatrix) => {
        prefsRef.current = data.preferences;
        setMatrix(data);
      })
      .catch(() => {
        /* the shells stay on their loading state */
      });
  }, []);

  const toggle = async (eventType: string, channel: string) => {
    if (!matrix) return;
    const before = prefsRef.current ?? matrix.preferences;
    const current = before[eventType]?.[channel] ?? true;
    const updated = { ...before, [eventType]: { ...before[eventType], [channel]: !current } };
    writePrefs(updated);
    setSaving(true);
    try {
      await adminApi.updateNotificationPreferences(updated);
    } catch {
      // Revert this cell only: a toggle that already went through keeps its value.
      const latest = prefsRef.current ?? updated;
      writePrefs({ ...latest, [eventType]: { ...latest[eventType], [channel]: current } });
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return { matrix, saving, visibleChannels: matrix ? visibleAdminChannels(matrix) : [], toggle };
}
