// FE-COMP-VACAYCAL-001 to -013: the calendar logging logic the desktop grid and the phone screen share.
import { act, renderHook, waitFor } from '@testing-library/react';

import { tripsApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useVacayStore } from '../../store/vacayStore';
import type { VacayEntry, VacayPlan, VacayYearSettings } from '../../types';
import { useDefaultVacayPerson, useVacayCalendarLogic, vacayWindowShape } from './useVacayCalendarLogic';
import { fmtDays } from './vacayFormat';

const CALENDAR: VacayYearSettings = { year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null };

const toggleEntry = vi.fn(async () => {});
const toggleCompanyHoliday = vi.fn(async () => {});

function plan(over: Partial<VacayPlan> = {}): VacayPlan {
  return {
    id: 1,
    holidays_enabled: false,
    holidays_region: null,
    holiday_calendars: [],
    block_weekends: true,
    carry_over_enabled: false,
    company_holidays_enabled: true,
    ...over,
  } as VacayPlan;
}

function entry(over: Partial<VacayEntry>): VacayEntry {
  return { date: '2026-03-02', user_id: 1, person_color: '#3b82f6', ...over } as VacayEntry;
}

type Options = Parameters<typeof useVacayCalendarLogic>[0];

function logic(over: Partial<Options> = {}) {
  const props: Options = { selectedYear: 2026, plan: plan(), ...over };
  return renderHook((p: Options) => useVacayCalendarLogic(p), { initialProps: props });
}

beforeEach(() => {
  toggleEntry.mockClear();
  toggleCompanyHoliday.mockClear();
  vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: [] } as never);
  useAuthStore.setState({ user: { id: 1, username: 'alice' } as never });
  useVacayStore.setState({
    selectedUserId: 1,
    entries: [],
    companyHolidays: [],
    users: [{ id: 1, username: 'alice', color: '#3b82f6' }],
    sharedCalendars: [],
    yearSettings: CALENDAR,
    toggleEntry,
    toggleCompanyHoliday,
  } as never);
});
afterEach(() => vi.restoreAllMocks());

describe('useVacayCalendarLogic', () => {
  it('FE-COMP-VACAYCAL-001: a weekday logs a full vacation day for the selected person', async () => {
    const { result } = logic();
    await act(() => result.current.logDay('2026-03-04'));
    expect(toggleEntry).toHaveBeenCalledWith('2026-03-04', 1, 1, 'vacation');
  });

  it('FE-COMP-VACAYCAL-002: the half-day and comp modifiers shape the logged day', async () => {
    const { result } = logic();
    act(() => {
      result.current.setHalfDay(true);
      result.current.setCompDay(true);
    });
    await act(() => result.current.logDay('2026-03-04'));
    expect(toggleEntry).toHaveBeenCalledWith('2026-03-04', 1, 0.5, 'comp');
  });

  it('FE-COMP-VACAYCAL-003: company mode toggles a company holiday, or nothing while they are off', async () => {
    const { result, rerender } = logic();
    act(() => result.current.setMode('company'));
    act(() => result.current.setHalfDay(true));
    await act(() => result.current.logDay('2026-03-04'));
    expect(toggleCompanyHoliday).toHaveBeenCalledWith('2026-03-04', 0.5);

    rerender({ selectedYear: 2026, plan: plan({ company_holidays_enabled: false }) });
    await act(() => result.current.logDay('2026-03-05'));
    expect(toggleCompanyHoliday).toHaveBeenCalledTimes(1);
    expect(result.current.companyHolidaysEnabled).toBe(false);
  });

  it('FE-COMP-VACAYCAL-004: a blocked weekend only clears a day already logged, with its own fraction and kind', async () => {
    const { result } = logic();
    await act(() => result.current.logDay('2026-03-07'));
    expect(toggleEntry).not.toHaveBeenCalled();

    useVacayStore.setState({ entries: [entry({ date: '2026-03-07', fraction: 0.5, kind: 'comp' })] } as never);
    await waitFor(() => expect(result.current.entryMap['2026-03-07']).toHaveLength(1));
    await act(() => result.current.logDay('2026-03-07'));
    expect(toggleEntry).toHaveBeenCalledWith('2026-03-07', 1, 0.5, 'comp');
  });

  it('FE-COMP-VACAYCAL-005: weekends log normally when the plan does not block them, with its own weekend days', async () => {
    const { result } = logic({ plan: plan({ block_weekends: false, weekend_days: '5' } as Partial<VacayPlan>) });
    expect(result.current.weekendDays).toEqual([5]);
    expect(result.current.blockWeekends).toBe(false);
    await act(() => result.current.logDay('2026-03-07'));
    expect(toggleEntry).toHaveBeenCalledWith('2026-03-07', 1, 1, 'vacation');
  });

  it('FE-COMP-VACAYCAL-006: a whole company holiday is closed, a half one leaves half a day', async () => {
    useVacayStore.setState({
      companyHolidays: [
        { date: '2026-03-04', fraction: 1 },
        { date: '2026-03-05', fraction: 0.5 },
      ],
    } as never);
    const { result } = logic();
    await act(() => result.current.logDay('2026-03-04'));
    expect(toggleEntry).not.toHaveBeenCalled();
    await act(() => result.current.logDay('2026-03-05'));
    expect(toggleEntry).toHaveBeenCalledWith('2026-03-05', 1, 0.5, 'vacation');
  });

  it('FE-COMP-VACAYCAL-007: company holidays switched off do not block a day', async () => {
    useVacayStore.setState({ companyHolidays: [{ date: '2026-03-04', fraction: 1 }] } as never);
    const { result } = logic({ plan: plan({ company_holidays_enabled: false }) });
    await act(() => result.current.logDay('2026-03-04'));
    expect(toggleEntry).toHaveBeenCalledWith('2026-03-04', 1, 1, 'vacation');
  });

  it('FE-COMP-VACAYCAL-008: the entry map groups by day and the shared map skips hidden calendars', () => {
    useVacayStore.setState({
      entries: [entry({ user_id: 1 }), entry({ user_id: 2 })],
      sharedCalendars: [
        {
          color: '#f00',
          owner_name: 'Carol',
          hidden: false,
          entries: [{ date: '2026-03-02', fraction: 0.5, kind: 'comp' }],
          companyHolidays: [{ date: '2026-03-03' }],
        },
        { color: '#0f0', owner_name: 'Dan', hidden: true, entries: [{ date: '2026-03-02' }], companyHolidays: [] },
      ],
    } as never);
    const { result } = logic();
    expect(result.current.entryMap['2026-03-02']).toHaveLength(2);
    expect(result.current.sharedMap).toEqual({
      '2026-03-02': [{ color: '#f00', name: 'Carol', fraction: 0.5, kind: 'comp' }],
      '2026-03-03': [{ color: '#f00', name: 'Carol', company: true }],
    });
    expect(result.current.selectedUser).toEqual({ id: 1, username: 'alice', color: '#3b82f6' });
  });

  it('FE-COMP-VACAYCAL-009: trip dots cover the days of dated trips inside the year window', async () => {
    vi.spyOn(tripsApi, 'list').mockResolvedValue({
      trips: [
        { start_date: '2025-12-30', end_date: '2026-01-02' },
        { start_date: null, end_date: null },
      ],
    } as never);
    const { result } = logic();
    await waitFor(() => expect(result.current.tripDates.size).toBe(2));
    expect([...result.current.tripDates]).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('FE-COMP-VACAYCAL-010: the desktop grid does not request the trips again for a deep-equal settings reload', async () => {
    const list = vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: [] } as never);
    logic();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    act(() => useVacayStore.setState({ yearSettings: { ...CALENDAR } }));
    await act(async () => {});
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-VACAYCAL-011: the trips reload only when the window shape changes', async () => {
    const list = vi.spyOn(tripsApi, 'list').mockResolvedValue({ trips: [] } as never);
    logic();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    act(() => useVacayStore.setState({ yearSettings: { ...CALENDAR } }));
    await Promise.resolve();
    expect(list).toHaveBeenCalledTimes(1);
    act(() => useVacayStore.setState({ yearSettings: { ...CALENDAR, year_type: 'fiscal', year_start_month: 7 } }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });
});

describe('useDefaultVacayPerson', () => {
  it('FE-COMP-VACAYCAL-012: picks the signed-in user only while nobody is selected', () => {
    useVacayStore.setState({ selectedUserId: null });
    renderHook(() => useDefaultVacayPerson());
    expect(useVacayStore.getState().selectedUserId).toBe(1);

    useVacayStore.setState({ selectedUserId: 2 });
    renderHook(() => useDefaultVacayPerson());
    expect(useVacayStore.getState().selectedUserId).toBe(2);
  });
});

describe('vacay helpers', () => {
  it('FE-COMP-VACAYCAL-013: the window shape and the day format', () => {
    expect(vacayWindowShape({ year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null })).toBe(
      'fiscal|7|1|null'
    );
    expect(fmtDays(3)).toBe('3');
    expect(fmtDays(2.5)).toBe('2.5');
  });
});
