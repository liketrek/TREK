import { useEffect, useState } from 'react';

import apiClient from '../../api/client';
import { getIntlLanguage, useTranslation } from '../../i18n';
import { useVacayStore } from '../../store/vacayStore';
import type { VacayYearSettings } from '../../types';
import { windowMonths } from '../../vacay/yearWindow';
import { useToast } from '../shared/Toast';
import { fetchRegionOptions, fetchSchoolHolidayRegionOptions } from './holidayRegions';

interface RegionOption {
  value: string;
  label: string;
}

type CalendarType = 'public_holiday' | 'school_holiday';

/**
 * The plan side of the vacay settings, shared by the desktop panel and the phone
 * sheet: the public-holiday countries, the plan's calendars split by type, the
 * weekend days and dissolving a fusion. `loadCountries` holds the country request
 * back while the phone sheet is closed.
 */
export function useVacaySettings({ language, loadCountries }: { language: string; loadCountries: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  const plan = useVacayStore((s) => s.plan);
  const updatePlan = useVacayStore((s) => s.updatePlan);
  const dissolve = useVacayStore((s) => s.dissolve);
  const [countries, setCountries] = useState<RegionOption[]>([]);

  // Available countries with localized names
  useEffect(() => {
    if (!loadCountries) return;
    apiClient
      .get('/addons/vacay/holidays/countries')
      .then((r) => {
        let displayNames: Intl.DisplayNames | undefined;
        try {
          displayNames = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' });
        } catch {
          /* */
        }
        const list: RegionOption[] = r.data.map((c: { countryCode: string; name: string }) => ({
          value: c.countryCode,
          label: displayNames ? displayNames.of(c.countryCode) || c.name : c.name,
        }));
        list.sort((a, b) => a.label.localeCompare(b.label));
        setCountries(list);
      })
      .catch(() => {});
  }, [loadCountries, language]);

  // Public and school calendars live in the same holiday_calendars list, split by type
  // (a null type predates the school-holiday feature, so it counts as a public holiday).
  const calendars = plan?.holiday_calendars ?? [];
  const publicHolidayCalendars = calendars.filter((cal) => (cal.type ?? 'public_holiday') === 'public_holiday');
  const schoolHolidayCalendars = calendars.filter((cal) => cal.type === 'school_holiday');

  const weekendDays: number[] = plan?.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6];
  const toggleWeekendDay = (day: number) => {
    const next = weekendDays.includes(day) ? weekendDays.filter((d) => d !== day) : [...weekendDays, day];
    updatePlan({ weekend_days: next.join(',') });
  };

  const dissolveFusion = async (onDone: () => void) => {
    await dissolve();
    toast.success(t('vacay.dissolved'));
    onDone();
  };

  return { countries, publicHolidayCalendars, schoolHolidayCalendars, weekendDays, toggleWeekendDay, dissolveFusion };
}

/** Days a month can always offer: February caps at 28 so no window start is skipped in a common year. */
export function monthDayCap(month: number): number {
  if (month === 2) return 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * The viewer's own leave year (#737): calendar, fiscal or anniversary, saved with
 * the start day clamped to the month, and the window it spans for `selectedYear`.
 */
export function useLeaveYear(locale: string) {
  const yearSettings = useVacayStore((s) => s.yearSettings);
  const updateYearSettings = useVacayStore((s) => s.updateYearSettings);
  const selectedYear = useVacayStore((s) => s.selectedYear);

  const save = (patch: Partial<VacayYearSettings>) => {
    const next = { ...yearSettings, ...patch };
    updateYearSettings({
      year_type: next.year_type,
      year_start_month: next.year_start_month,
      year_start_day: Math.min(next.year_start_day, monthDayCap(next.year_start_month)),
      hire_date: next.hire_date,
    });
  };

  const months = windowMonths(selectedYear, yearSettings);
  const shortMonth = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
  const windowLabel = `${shortMonth.format(new Date(months[0].year, months[0].month, 1))} – ${shortMonth.format(new Date(months[11].year, months[11].month, 1))}`;

  return { yearSettings, type: yearSettings.year_type, selectedYear, save, windowLabel };
}

/** A calendar's stored region split into the country and the region within it (or ''). */
export function parseHolidayRegion(stored: string): { country: string; region: string } {
  const [baseRegion] = stored.split('|');
  return {
    country: baseRegion.split('-')[0] || '',
    region: stored.includes('|group:') || baseRegion.includes('-') ? stored : '',
  };
}

/**
 * Region options for a holiday-calendar country.
 *
 * The loaded list is tagged with the country it belongs to, so switching country
 * drops the previous list in the same render instead of leaving it selectable while
 * the next request is still running (#1813: picking a German region for the
 * Netherlands was possible that way). `loadingRegions` tells "not answered yet"
 * apart from "this country has no regions"; on the list alone both are empty.
 */
export function useRegionOptions(country: string, calendarType: CalendarType) {
  const [loaded, setLoaded] = useState<{ country: string; options: RegionOption[]; failed?: boolean }>({
    country: '',
    options: [],
  });

  useEffect(() => {
    if (!country) return;
    const load = calendarType === 'school_holiday' ? fetchSchoolHolidayRegionOptions : fetchRegionOptions;
    let stale = false;
    load(country)
      .then((options) => {
        if (!stale) setLoaded({ country, options });
      })
      .catch(() => {
        if (!stale) setLoaded({ country, options: [], failed: true });
      });
    return () => {
      stale = true;
    };
  }, [calendarType, country]);

  const ready = loaded.country === country;
  return {
    regions: ready ? loaded.options : [],
    regionError: ready && loaded.failed,
    loadingRegions: Boolean(country) && !ready,
  };
}

/** A new calendar can be added once its country's regions answered and the pick is one of them (or none exist). */
export function canAddHolidayCalendar(
  country: string,
  picked: string,
  { regions, loadingRegions, regionError }: ReturnType<typeof useRegionOptions>
): boolean {
  return (
    Boolean(country) &&
    !loadingRegions &&
    !regionError &&
    (regions.length === 0 || regions.some((option) => option.value === picked))
  );
}
