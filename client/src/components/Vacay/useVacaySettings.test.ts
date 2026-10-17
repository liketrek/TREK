// FE-COMP-VACAYSET-001 to -011: the vacay settings logic the desktop panel and the phone sheet share.
import { act, renderHook, waitFor } from '@testing-library/react';

import apiClient from '../../api/client';
import { useVacayStore } from '../../store/vacayStore';
import type { VacayPlan, VacayYearSettings } from '../../types';
import {
  canAddHolidayCalendar,
  monthDayCap,
  parseHolidayRegion,
  useLeaveYear,
  useRegionOptions,
  useVacaySettings,
} from './useVacaySettings';

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  getIntlLanguage: (language: string) => language,
}));
const regionsApi = vi.hoisted(() => ({
  fetchRegionOptions: vi.fn<(country: string) => Promise<{ value: string; label: string }[]>>(),
  fetchSchoolHolidayRegionOptions: vi.fn<(country: string) => Promise<{ value: string; label: string }[]>>(),
}));
vi.mock('./holidayRegions', () => regionsApi);

const updatePlan = vi.fn(async () => {});
const dissolve = vi.fn(async () => {});
const updateYearSettings = vi.fn(async () => {});

const CALENDAR: VacayYearSettings = { year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null };

function plan(over: Partial<VacayPlan> = {}): VacayPlan {
  return { id: 1, block_weekends: true, holiday_calendars: [], ...over } as VacayPlan;
}

beforeEach(() => {
  updatePlan.mockClear();
  dissolve.mockClear();
  updateYearSettings.mockClear();
  toast.success.mockReset();
  useVacayStore.setState({
    plan: plan(),
    updatePlan,
    dissolve,
    updateYearSettings,
    yearSettings: CALENDAR,
    selectedYear: 2026,
  } as never);
});
afterEach(() => vi.restoreAllMocks());

describe('useVacaySettings', () => {
  it('FE-COMP-VACAYSET-001: loads the countries sorted by their localized name', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [
        { countryCode: 'DE', name: 'Germany' },
        { countryCode: 'AT', name: 'Austria' },
      ],
    });
    const { result } = renderHook(() => useVacaySettings({ language: 'en', loadCountries: true }));
    await waitFor(() => expect(result.current.countries).toHaveLength(2));
    expect(get).toHaveBeenCalledWith('/addons/vacay/holidays/countries');
    expect(result.current.countries).toEqual([
      { value: 'AT', label: 'Austria' },
      { value: 'DE', label: 'Germany' },
    ]);
  });

  it('FE-COMP-VACAYSET-002: holds the country request back until the sheet opens', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    const { rerender } = renderHook(
      (p: { open: boolean }) => useVacaySettings({ language: 'en', loadCountries: p.open }),
      {
        initialProps: { open: false },
      }
    );
    expect(get).not.toHaveBeenCalled();
    rerender({ open: true });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
  });

  it('FE-COMP-VACAYSET-003: splits the calendars by type, an untyped one counting as public', () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });
    useVacayStore.setState({
      plan: plan({
        holiday_calendars: [
          { id: 1, region: 'DE' },
          { id: 2, region: 'FR', type: 'public_holiday' },
          { id: 3, region: 'DE-BY', type: 'school_holiday' },
        ],
      } as never),
    });
    const { result } = renderHook(() => useVacaySettings({ language: 'en', loadCountries: false }));
    expect(result.current.publicHolidayCalendars.map((c) => c.id)).toEqual([1, 2]);
    expect(result.current.schoolHolidayCalendars.map((c) => c.id)).toEqual([3]);
  });

  it('FE-COMP-VACAYSET-004: toggles a weekend day in and out of the default Saturday and Sunday', () => {
    const { result, rerender } = renderHook(() => useVacaySettings({ language: 'en', loadCountries: false }));
    expect(result.current.weekendDays).toEqual([0, 6]);
    act(() => result.current.toggleWeekendDay(5));
    expect(updatePlan).toHaveBeenLastCalledWith({ weekend_days: '0,6,5' });
    act(() => result.current.toggleWeekendDay(0));
    expect(updatePlan).toHaveBeenLastCalledWith({ weekend_days: '6' });

    useVacayStore.setState({ plan: plan({ weekend_days: '5,6' }) });
    rerender();
    expect(result.current.weekendDays).toEqual([5, 6]);
  });

  it('FE-COMP-VACAYSET-005: dissolving toasts and then hands over', async () => {
    const order: string[] = [];
    toast.success.mockImplementation(() => order.push('toast'));
    const { result } = renderHook(() => useVacaySettings({ language: 'en', loadCountries: false }));
    await act(() => result.current.dissolveFusion(() => order.push('done')));
    expect(dissolve).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('vacay.dissolved');
    expect(order).toEqual(['toast', 'done']);
  });

  it('FE-COMP-VACAYSET-006: works without a plan loaded yet', () => {
    useVacayStore.setState({ plan: null });
    const { result } = renderHook(() => useVacaySettings({ language: 'en', loadCountries: false }));
    expect(result.current.publicHolidayCalendars).toEqual([]);
    expect(result.current.weekendDays).toEqual([0, 6]);
  });
});

describe('useLeaveYear', () => {
  it('FE-COMP-VACAYSET-007: saves the whole year settings with the start day clamped to the month', () => {
    useVacayStore.setState({ yearSettings: { ...CALENDAR, year_type: 'fiscal', year_start_day: 31 } });
    const { result } = renderHook(() => useLeaveYear('en-GB'));
    expect(result.current.type).toBe('fiscal');
    act(() => result.current.save({ year_start_month: 2 }));
    expect(updateYearSettings).toHaveBeenCalledWith({
      year_type: 'fiscal',
      year_start_month: 2,
      year_start_day: 28,
      hire_date: null,
    });
  });

  it('FE-COMP-VACAYSET-008: labels the window the selected year spans', () => {
    useVacayStore.setState({ yearSettings: { ...CALENDAR, year_type: 'fiscal', year_start_month: 7 } });
    const { result } = renderHook(() => useLeaveYear('en-GB'));
    expect(result.current.windowLabel).toBe('Jul 2026 – Jun 2027');
    expect(result.current.selectedYear).toBe(2026);
  });
});

describe('useRegionOptions', () => {
  it('FE-COMP-VACAYSET-009: loads the regions per country and type and flags a failure', async () => {
    const pub = regionsApi.fetchRegionOptions.mockResolvedValue([{ value: 'DE-BY', label: 'Bavaria' }]);
    const school = regionsApi.fetchSchoolHolidayRegionOptions.mockRejectedValue(new Error('down'));

    const empty = renderHook(() => useRegionOptions('', 'public_holiday'));
    expect(empty.result.current).toMatchObject({ regions: [], loadingRegions: false });
    expect(empty.result.current.regionError).toBeFalsy();
    expect(pub).not.toHaveBeenCalled();

    const publicHook = renderHook(() => useRegionOptions('DE', 'public_holiday'));
    expect(publicHook.result.current.loadingRegions).toBe(true);
    await waitFor(() => expect(publicHook.result.current.regions).toEqual([{ value: 'DE-BY', label: 'Bavaria' }]));
    expect(pub).toHaveBeenCalledWith('DE');

    const schoolHook = renderHook(() => useRegionOptions('DE', 'school_holiday'));
    await waitFor(() => expect(schoolHook.result.current.regionError).toBe(true));
    expect(school).toHaveBeenCalledWith('DE');
    expect(schoolHook.result.current.loadingRegions).toBe(false);
  });
});

describe('settings helpers', () => {
  it('FE-COMP-VACAYSET-010: reads the country and region off a stored region', () => {
    expect(parseHolidayRegion('')).toEqual({ country: '', region: '' });
    expect(parseHolidayRegion('DE')).toEqual({ country: 'DE', region: '' });
    expect(parseHolidayRegion('DE-BY')).toEqual({ country: 'DE', region: 'DE-BY' });
    expect(parseHolidayRegion('NL|group:north')).toEqual({ country: 'NL', region: 'NL|group:north' });
    expect(monthDayCap(2)).toBe(28);
    expect(monthDayCap(4)).toBe(30);
    expect(monthDayCap(12)).toBe(31);
  });

  it('FE-COMP-VACAYSET-011: a calendar can be added once the regions answered and the pick fits them', () => {
    const regions = [{ value: 'DE-BY', label: 'Bavaria' }];
    const ready = { regions, loadingRegions: false, regionError: false };
    expect(canAddHolidayCalendar('', '', { regions: [], loadingRegions: false, regionError: false })).toBe(false);
    expect(canAddHolidayCalendar('DE', 'DE', { ...ready, loadingRegions: true })).toBe(false);
    expect(canAddHolidayCalendar('DE', 'DE', { regions: [], loadingRegions: false, regionError: true })).toBe(false);
    expect(canAddHolidayCalendar('DE', 'DE', ready)).toBe(false);
    expect(canAddHolidayCalendar('DE', 'DE-BY', ready)).toBe(true);
    expect(canAddHolidayCalendar('FR', 'FR', { regions: [], loadingRegions: false, regionError: false })).toBe(true);
  });
});
