import { useCallback, useEffect, useMemo, useState } from 'react';

import { tripsApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useVacayStore } from '../../store/vacayStore';
import type { VacayEntry, VacayPlan, VacayYearSettings } from '../../types';
import { inGridWindow } from '../../vacay/yearWindow';
import { companyHolidaySets, leaveFractionFor } from './companyHolidays';
import { isWeekend } from './holidays';

export type VacayMode = 'vacation' | 'company';
type SharedDayMark = {
  color: string;
  name: string;
  fraction?: number;
  company?: boolean;
  kind?: 'vacation' | 'comp';
};

interface VacayCalendarLogicOptions {
  selectedYear: number;
  plan: VacayPlan | null | undefined;
}

/** The leave-year window's shape as a primitive, stable across deep-equal reloads. */
export function vacayWindowShape(s: VacayYearSettings): string {
  return `${s.year_type}|${s.year_start_month}|${s.year_start_day}|${s.hire_date}`;
}

function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Logging logic of the vacay calendar, shared by the desktop grid and the phone
 * screen: the log mode with its half-day and comp-day modifiers, the per-day maps
 * the cells render from, the trip dots, and what a click on a day logs.
 */
export function useVacayCalendarLogic({ selectedYear, plan }: VacayCalendarLogicOptions) {
  const selectedUserId = useVacayStore((s) => s.selectedUserId);
  const entries = useVacayStore((s) => s.entries);
  const companyHolidays = useVacayStore((s) => s.companyHolidays);
  const toggleEntry = useVacayStore((s) => s.toggleEntry);
  const toggleCompanyHoliday = useVacayStore((s) => s.toggleCompanyHoliday);
  const users = useVacayStore((s) => s.users);
  const sharedCalendars = useVacayStore((s) => s.sharedCalendars);
  const yearSettings = useVacayStore((s) => s.yearSettings);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [mode, setMode] = useState<VacayMode>('vacation');
  // Half-day is a per-person modifier on the vacation action, not a mode: with it
  // on, clicking a day logs (or converts) it as a 0.5 day for the selected person.
  const [halfDay, setHalfDay] = useState(false);
  // Comp/Flex day is a second per-person modifier (#1074), orthogonal to half-day:
  // with it on, clicking a day logs it as kind='comp' (does not cost the entitlement).
  const [compDay, setCompDay] = useState(false);
  const [tripDates, setTripDates] = useState<Set<string>>(new Set());

  // The trip dots reload only when the leave-year window changes shape: loadAll()
  // hands back a deep-equal settings object on every refresh, and that must not
  // request the trips again.
  const tripsKey = vacayWindowShape(yearSettings);
  useEffect(() => {
    const settings = useVacayStore.getState().yearSettings;
    let cancelled = false;
    void (async () => {
      try {
        const data = await tripsApi.list();
        const dates = new Set<string>();
        for (const trip of data.trips || []) {
          if (!trip.start_date || !trip.end_date) continue;
          const start = new Date(trip.start_date + 'T00:00:00');
          const end = new Date(trip.end_date + 'T00:00:00');
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Keep the days the grid shows, which is the leave-year window (#737)
            // rather than the calendar year once the window is shifted.
            const date = localDay(d);
            if (inGridWindow(date, selectedYear, settings)) dates.add(date);
          }
        }
        if (!cancelled) setTripDates(dates);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, tripsKey]);

  // Whole company holidays close a day to leave, half ones leave half of it (#2439).
  const { full: companyHolidaySet, half: companyHalfSet } = useMemo(
    () => companyHolidaySets(companyHolidays),
    [companyHolidays]
  );

  const entryMap = useMemo(() => {
    const map: Record<string, VacayEntry[]> = {};
    entries.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [entries]);

  // Shared read-only calendars (#444/#667) render as colored rings, not fills,
  // so they never mix into the members' split logic: merged stays merged,
  // shared stays a distinct overlay. Hidden ones stay out.
  const sharedMap = useMemo(() => {
    const map: Record<string, SharedDayMark[]> = {};
    sharedCalendars
      .filter((c) => !c.hidden)
      .forEach((cal) => {
        cal.entries.forEach((e) => {
          if (!map[e.date]) map[e.date] = [];
          map[e.date].push({ color: cal.color, name: cal.owner_name, fraction: e.fraction, kind: e.kind });
        });
        cal.companyHolidays.forEach((h) => {
          if (!map[h.date]) map[h.date] = [];
          map[h.date].push({ color: cal.color, name: cal.owner_name, company: true });
        });
      });
    return map;
  }, [sharedCalendars]);

  const blockWeekends = plan?.block_weekends !== false;
  const weekendDays = useMemo<number[]>(
    () => (plan?.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6]),
    [plan?.weekend_days]
  );
  const companyHolidaysEnabled = plan?.company_holidays_enabled !== false;

  const logDay = useCallback(
    async (dateStr: string) => {
      if (mode === 'company') {
        if (!companyHolidaysEnabled) return;
        await toggleCompanyHoliday(dateStr, halfDay ? 0.5 : 1);
        return;
      }
      if (blockWeekends && isWeekend(dateStr, weekendDays)) {
        // A day already logged when the weekend config changed under it (#1897) keeps
        // counting against the entitlement, so clearing it stays possible, with the
        // entry's own fraction/kind, since the server only allows the delete on a
        // blocked day, not a conversion. Logging a new one stays blocked.
        const own = entryMap[dateStr]?.find((e) => e.user_id === (selectedUserId ?? currentUserId));
        if (!own) return;
        await toggleEntry(
          dateStr,
          selectedUserId || undefined,
          (own.fraction ?? 1) === 0.5 ? 0.5 : 1,
          own.kind ?? 'vacation'
        );
        return;
      }
      if (companyHolidaysEnabled && companyHolidaySet.has(dateStr)) return;
      const fraction = companyHolidaysEnabled
        ? leaveFractionFor(dateStr, companyHalfSet, halfDay ? 0.5 : 1)
        : halfDay
          ? 0.5
          : 1;
      await toggleEntry(dateStr, selectedUserId || undefined, fraction, compDay ? 'comp' : 'vacation');
    },
    [
      mode,
      halfDay,
      compDay,
      toggleEntry,
      toggleCompanyHoliday,
      companyHolidaySet,
      companyHalfSet,
      blockWeekends,
      weekendDays,
      companyHolidaysEnabled,
      selectedUserId,
      currentUserId,
      entryMap,
    ]
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return {
    mode,
    setMode,
    halfDay,
    setHalfDay,
    compDay,
    setCompDay,
    tripDates,
    entryMap,
    sharedMap,
    companyHolidaySet,
    companyHalfSet,
    blockWeekends,
    weekendDays,
    companyHolidaysEnabled,
    selectedUser,
    logDay,
  };
}

/** Points the vacay views at the signed-in user until someone else is picked. */
export function useDefaultVacayPerson() {
  const currentUser = useAuthStore((s) => s.user);
  const selectedUserId = useVacayStore((s) => s.selectedUserId);
  const setSelectedUserId = useVacayStore((s) => s.setSelectedUserId);
  useEffect(() => {
    if (!selectedUserId && currentUser) setSelectedUserId(currentUser.id);
  }, [currentUser, selectedUserId, setSelectedUserId]);
}
