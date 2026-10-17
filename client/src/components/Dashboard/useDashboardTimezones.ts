import { useEffect, useMemo, useState } from 'react';

import { useSettingsStore } from '../../store/settingsStore';

const DEFAULT_ZONES = ['Europe/London', 'Asia/Tokyo'];

// Fallback for the rare browser without Intl.supportedValuesOf.
const FALLBACK_ZONES = [
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

/** The city part of a zone id, so America/New_York reads New York. */
export function shortZone(tz: string): string {
  const city = tz.split('/').pop() || tz;
  return city.replace(/_/g, ' ');
}

/**
 * The dashboard's world clocks: the zone list lives in the user's settings, the
 * clocks tick every 30 seconds, `adding` toggles the zone picker.
 */
export function useDashboardTimezones(locale: string) {
  const home = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [now, setNow] = useState(() => new Date());
  const isLoaded = useSettingsStore((s) => s.isLoaded);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const stored = useSettingsStore((s) => s.settings.dashboard_timezones);
  // Unset (never chosen) falls back to home + defaults; an explicit list is honoured.
  const zones = stored ?? [home, ...DEFAULT_ZONES];
  const setZones = (next: string[]) => {
    updateSetting('dashboard_timezones', next).catch(() => {});
  };
  const [adding, setAdding] = useState(false);

  // A minute's resolution is plenty for clocks and keeps re-renders cheap.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // One-time migration of the pre-3.1.3 localStorage value into the user's settings,
  // so a (docker) upgrade no longer resets the widget (#1311).
  useEffect(() => {
    if (!isLoaded) return;
    const raw = localStorage.getItem('trek_dashboard_tz');
    if (!raw) return;
    let parsed: unknown;
    // A malformed/non-array value can never be written, so drop it now to avoid retrying forever.
    try {
      parsed = JSON.parse(raw);
    } catch {
      localStorage.removeItem('trek_dashboard_tz');
      return;
    }
    if (!Array.isArray(parsed)) {
      localStorage.removeItem('trek_dashboard_tz');
      return;
    }
    // Only drop the localStorage source once the server has durably stored the value, so a failed
    // write during a (docker) upgrade can't destroy the only copy (#1311). Retry next load.
    updateSetting('dashboard_timezones', parsed)
      .then(() => {
        localStorage.removeItem('trek_dashboard_tz');
      })
      .catch(() => {
        /* keep localStorage; retry on next load */
      });
  }, [isLoaded, updateSetting]);

  const allZones = useMemo<string[]>(() => {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    try {
      return supported ? supported('timeZone') : FALLBACK_ZONES;
    } catch {
      return FALLBACK_ZONES;
    }
  }, []);

  const addZone = (tz: string) => {
    if (tz && !zones.includes(tz)) setZones([...zones, tz]);
    setAdding(false);
  };
  const removeZone = (tz: string) => setZones(zones.filter((z) => z !== tz));

  const timeIn = (tz: string) =>
    now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
  const offsetLabel = (tz: string) => {
    const part = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName');
    return part?.value || '';
  };

  return { zones, adding, setAdding, allZones, addZone, removeZone, timeIn, offsetLabel };
}
