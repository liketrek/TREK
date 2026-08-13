// FE-MOB-MVAC-001 to FE-MOB-MVAC-029
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { useMVacay } from '../../../../src/mobile/screens/vacay/useMVacay';
import { useVacayStore } from '../../../../src/store/vacayStore';
import { useAuthStore } from '../../../../src/store/authStore';
import type { VacayEntry, VacayPlan, VacayStat, VacayUser } from '../../../../src/types';

const navigateMock = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const mocks = vi.hoisted(() => ({ vacay: {} as Record<string, unknown> }));

vi.mock('../../../../src/pages/vacay/useVacay', () => ({
  useVacay: () => mocks.vacay,
}));

const toasts: { type: string; message: string }[] = [];

const alice: VacayUser = { id: 1, username: 'alice', color: '#3b82f6' };
const bob: VacayUser = { id: 2, username: 'bob', color: '#ec4899' };

function buildPlan(over: Partial<VacayPlan> = {}): VacayPlan {
  return {
    id: 1,
    holidays_enabled: false,
    holidays_region: null,
    holiday_calendars: [],
    block_weekends: true,
    carry_over_enabled: false,
    company_holidays_enabled: true,
    ...over,
  };
}

function buildStat(over: Partial<VacayStat> = {}): VacayStat {
  return {
    user_id: 1, person_name: 'alice', person_color: '#3b82f6', year: 2026,
    vacation_days: 30, carried_over: 0, total_available: 30, used: 4, remaining: 26,
    ...over,
  };
}

function buildVacay(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    years: [2025, 2026],
    selectedYear: 2026,
    setSelectedYear: vi.fn((_year: number) => undefined),
    loading: false,
    incomingInvites: [],
    acceptInvite: vi.fn(async (_planId: number) => {}),
    declineInvite: vi.fn(async (_planId: number) => {}),
    plan: buildPlan(),
    handleAddNextYear: vi.fn(() => undefined),
    handleAddPrevYear: vi.fn(() => undefined),
    ...over,
  };
}

function tripsRespond(trips: { start_date?: string | null; end_date?: string | null }[]) {
  server.use(http.get('/api/trips', () => HttpResponse.json({ trips })));
}

beforeEach(() => {
  resetAllStores();
  navigateMock.mockClear();
  toasts.length = 0;
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message });
    return 1;
  }) as Window['__addToast'];
  mocks.vacay = buildVacay();
  tripsRespond([]);
  useAuthStore.setState({ user: { id: 1, username: 'alice', email: 'a@t.app', role: 'user' } as never });
  useVacayStore.setState({
    users: [alice, bob],
    entries: [],
    companyHolidays: [],
    stats: [buildStat()],
    holidays: {},
    sharedCalendars: [],
    incomingShares: [],
    selectedUserId: null,
    isFused: false,
  });
});

afterEach(() => {
  delete window.__addToast;
});

async function mount() {
  const view = renderHook(() => useMVacay());
  await waitFor(() => expect(view.result.current.selectedUserId).toBe(1));
  return view;
}

describe('useMVacay', () => {
  it('FE-MOB-MVAC-001: defaults the active person to the signed-in user', async () => {
    const { result } = await mount();

    expect(useVacayStore.getState().selectedUserId).toBe(1);
    expect(result.current.selectedUser?.username).toBe('alice');
    expect(result.current.selectedColor).toBe('#3b82f6');
    expect(result.current.selectedStat?.remaining).toBe(26);
    expect(result.current.tripDotColor).toBe('#3b82f6');
  });

  it('FE-MOB-MVAC-002: falls back to the shared person color when the member has none', async () => {
    act(() => { useVacayStore.setState({ users: [{ id: 1, username: 'alice', color: null }] }); });
    const { result } = await mount();

    expect(result.current.selectedColor).toBe('#6366f1');
    expect(result.current.tripDotColor).toBe('var(--m-st-info)');
  });

  it('FE-MOB-MVAC-003: collects every day covered by an own trip inside the window', async () => {
    tripsRespond([
      { start_date: '2026-03-30', end_date: '2026-04-02' },
      { start_date: '2025-12-30', end_date: '2025-12-31' },
      { start_date: null, end_date: '2026-05-01' },
    ]);
    const { result } = await mount();

    await waitFor(() => expect(result.current.tripDates.size).toBe(4));
    expect([...result.current.tripDates].sort()).toEqual([
      '2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02',
    ]);
    expect(result.current.tripDates.has('2025-12-30')).toBe(false);
  });

  it('FE-MOB-MVAC-004: leaves the trip overlay empty when the trip list fails', async () => {
    server.use(http.get('/api/trips', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    const { result } = await mount();

    await waitFor(() => expect(result.current.tripDates.size).toBe(0));
  });

  it('FE-MOB-MVAC-005: derives the plan flags from their defaults without a plan', async () => {
    mocks.vacay = buildVacay({ plan: null });
    const { result } = await mount();

    expect(result.current.blockWeekends).toBe(true);
    expect(result.current.companyHolidaysEnabled).toBe(true);
    expect(result.current.holidaysEnabled).toBe(false);
    expect(result.current.weekStart).toBe(1);
    expect(result.current.weekendDays).toEqual([0, 6]);
  });

  it('FE-MOB-MVAC-006: reads configured weekend days and week start off the plan', async () => {
    mocks.vacay = buildVacay({
      plan: buildPlan({
        weekend_days: '5,6', week_start: 0, block_weekends: false,
        company_holidays_enabled: false, holidays_enabled: true,
      }),
    });
    const { result } = await mount();

    expect(result.current.weekendDays).toEqual([5, 6]);
    expect(result.current.weekStart).toBe(0);
    expect(result.current.blockWeekends).toBe(false);
    expect(result.current.companyHolidaysEnabled).toBe(false);
    expect(result.current.holidaysEnabled).toBe(true);
  });

  it('FE-MOB-MVAC-007: groups entries per date and indexes the company holidays', async () => {
    const entries: VacayEntry[] = [
      { date: '2026-06-15', user_id: 1 },
      { date: '2026-06-15', user_id: 2, fraction: 0.5 },
      { date: '2026-06-16', user_id: 1, kind: 'comp' },
    ];
    act(() => { useVacayStore.setState({ entries, companyHolidays: [{ date: '2026-12-24' }] }); });
    const { result } = await mount();

    expect(result.current.dayCtx.entryMap['2026-06-15']).toHaveLength(2);
    expect(result.current.dayCtx.entryMap['2026-06-16']).toHaveLength(1);
    expect(result.current.dayCtx.companyHolidaySet.has('2026-12-24')).toBe(true);
  });

  it('FE-MOB-MVAC-008: overlays visible shared calendars only', async () => {
    act(() => {
      useVacayStore.setState({
        sharedCalendars: [
          {
            share_id: 1, owner_id: 3, owner_name: 'carol', color: '#f59e0b', hidden: false,
            entries: [{ date: '2026-07-01' }], companyHolidays: [{ date: '2026-07-02' }],
          },
          {
            share_id: 2, owner_id: 4, owner_name: 'dan', color: '#10b981', hidden: true,
            entries: [{ date: '2026-07-03' }], companyHolidays: [],
          },
        ],
      });
    });
    const { result } = await mount();

    expect(result.current.dayCtx.sharedMap?.['2026-07-01']).toEqual([{ color: '#f59e0b' }]);
    expect(result.current.dayCtx.sharedMap?.['2026-07-02']).toEqual([{ color: '#f59e0b' }]);
    expect(result.current.dayCtx.sharedMap?.['2026-07-03']).toBeUndefined();
  });

  it('FE-MOB-MVAC-009: spans Jan–Dec on a calendar leave year', async () => {
    const { result } = await mount();

    expect(result.current.isShiftedYear).toBe(false);
    expect(result.current.months).toHaveLength(12);
    expect(result.current.months[0]).toEqual({ year: 2026, month: 0 });
    expect(result.current.months[11]).toEqual({ year: 2026, month: 11 });
    expect(result.current.monthNamesShort[0]).toBe('Jan');
  });

  it('FE-MOB-MVAC-010: rolls into the next calendar year for a fiscal leave year', async () => {
    act(() => {
      useVacayStore.setState({
        yearSettings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null },
      });
    });
    const { result } = await mount();

    expect(result.current.isShiftedYear).toBe(true);
    expect(result.current.months[0]).toEqual({ year: 2026, month: 6 });
    expect(result.current.months[11]).toEqual({ year: 2027, month: 5 });
  });

  it('FE-MOB-MVAC-011: starts on the slot holding the current month', async () => {
    const { result } = await mount();

    expect(result.current.monthSlot).toBe(new Date().getMonth());
    expect(result.current.activeMonth.month).toBe(new Date().getMonth());
    expect(result.current.monthNameLong).toBe(
      new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, new Date().getMonth(), 1)),
    );
  });

  it('FE-MOB-MVAC-012: wraps the month stepper inside the twelve slots', async () => {
    const { result } = await mount();

    act(() => { result.current.setMonthSlot(11); });
    act(() => { result.current.nextMonth(); });
    expect(result.current.monthSlot).toBe(0);

    act(() => { result.current.prevMonth(); });
    expect(result.current.monthSlot).toBe(11);
  });

  it('FE-MOB-MVAC-013: only a fused plan allows selecting another member', async () => {
    const { result } = await mount();

    act(() => { result.current.selectPerson(2); });
    expect(useVacayStore.getState().selectedUserId).toBe(1);

    act(() => { useVacayStore.setState({ isFused: true }); });
    act(() => { result.current.selectPerson(2); });
    expect(useVacayStore.getState().selectedUserId).toBe(2);
    expect(result.current.selectedUser?.username).toBe('bob');
  });

  it('FE-MOB-MVAC-014: selecting yourself resets the logging mode to vacation', async () => {
    const { result } = await mount();

    act(() => { result.current.setMode('company'); });
    expect(result.current.mode).toBe('company');

    act(() => { result.current.selectPerson(1); });
    expect(result.current.mode).toBe('vacation');
  });

  it('FE-MOB-MVAC-015: the year overview never logs a day, it opens that month instead (#1811)', async () => {
    const toggleEntry = vi.fn(async (_date: string, _userId?: number, _fraction?: 0.5 | 1, _kind?: 'vacation' | 'comp') => {});
    act(() => { useVacayStore.setState({ toggleEntry }); });
    const { result } = await mount();
    act(() => { result.current.setMonthSlot(0); });

    expect(result.current.view).toBe('grid');
    await act(async () => { await result.current.handleDayTap('2026-06-15'); });

    expect(toggleEntry).not.toHaveBeenCalled();
    expect(result.current.view).toBe('edit');
    expect(result.current.monthSlot).toBe(5);
    expect(result.current.activeMonth).toEqual({ year: 2026, month: 5 });
  });

  it('FE-MOB-MVAC-016: logs the selected person with the half-day and comp modifiers', async () => {
    const toggleEntry = vi.fn(async (_date: string, _userId?: number, _fraction?: 0.5 | 1, _kind?: 'vacation' | 'comp') => {});
    act(() => { useVacayStore.setState({ toggleEntry }); });
    const { result } = await mount();

    act(() => { result.current.toggleView(); });
    expect(result.current.view).toBe('edit');

    await act(async () => { await result.current.handleDayTap('2026-06-15'); });
    expect(toggleEntry).toHaveBeenLastCalledWith('2026-06-15', 1, 1, 'vacation');

    act(() => { result.current.setHalfDay(true); result.current.setCompDay(true); });
    await act(async () => { await result.current.handleDayTap('2026-06-16'); });
    expect(toggleEntry).toHaveBeenLastCalledWith('2026-06-16', 1, 0.5, 'comp');
  });

  it('FE-MOB-MVAC-017: blocked weekends and company holidays swallow the tap', async () => {
    const toggleEntry = vi.fn(async (_date: string, _userId?: number, _fraction?: 0.5 | 1, _kind?: 'vacation' | 'comp') => {});
    act(() => { useVacayStore.setState({ toggleEntry, companyHolidays: [{ date: '2026-12-24' }] }); });
    const { result } = await mount();
    act(() => { result.current.toggleView(); });

    // 2026-06-13 is a Saturday.
    await act(async () => { await result.current.handleDayTap('2026-06-13'); });
    await act(async () => { await result.current.handleDayTap('2026-12-24'); });
    expect(toggleEntry).not.toHaveBeenCalled();

    await act(async () => { await result.current.handleDayTap('2026-06-15'); });
    expect(toggleEntry).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-MVAC-018: company mode toggles a company holiday and is inert while disabled', async () => {
    const toggleCompanyHoliday = vi.fn(async (_date: string) => {});
    act(() => { useVacayStore.setState({ toggleCompanyHoliday }); });
    mocks.vacay = buildVacay({ plan: buildPlan({ company_holidays_enabled: false }) });
    const { result, rerender } = await mount();

    act(() => { result.current.toggleView(); });
    act(() => { result.current.setMode('company'); });
    await act(async () => { await result.current.handleDayTap('2026-12-24'); });
    expect(toggleCompanyHoliday).not.toHaveBeenCalled();

    mocks.vacay = buildVacay({ plan: buildPlan({ company_holidays_enabled: true }) });
    act(() => { rerender(); });
    await act(async () => { await result.current.handleDayTap('2026-12-24'); });
    expect(toggleCompanyHoliday).toHaveBeenCalledWith('2026-12-24');
  });

  it('FE-MOB-MVAC-019: the entitlement stepper caps at 365 and never drops below used', async () => {
    const updateVacationDays = vi.fn(async (_year: number, _days: number, _target?: number) => {});
    act(() => { useVacayStore.setState({ updateVacationDays, stats: [buildStat({ vacation_days: 365 })] }); });
    const { result } = await mount();

    act(() => { result.current.allowInc(); });
    expect(updateVacationDays).toHaveBeenLastCalledWith(2026, 365, 1);

    act(() => { result.current.allowDec(); });
    expect(updateVacationDays).toHaveBeenLastCalledWith(2026, 364, 1);

    act(() => { useVacayStore.setState({ stats: [buildStat({ vacation_days: 10, used: 10, carried_over: 0 })] }); });
    act(() => { result.current.allowDec(); });
    expect(updateVacationDays).toHaveBeenCalledTimes(2);
  });

  it('FE-MOB-MVAC-020: carried-over days let the entitlement drop below what was used', async () => {
    const updateVacationDays = vi.fn(async (_year: number, _days: number, _target?: number) => {});
    act(() => {
      useVacayStore.setState({ updateVacationDays, stats: [buildStat({ vacation_days: 10, used: 12, carried_over: 5 })] });
    });
    const { result } = await mount();

    act(() => { result.current.allowDec(); });
    expect(updateVacationDays).toHaveBeenCalledWith(2026, 9, 1);
  });

  it('FE-MOB-MVAC-021: the stepper is inert without a stat row for the person', async () => {
    const updateVacationDays = vi.fn(async (_year: number, _days: number, _target?: number) => {});
    act(() => { useVacayStore.setState({ updateVacationDays, stats: [] }); });
    const { result } = await mount();

    act(() => { result.current.allowInc(); });
    act(() => { result.current.allowDec(); });
    expect(updateVacationDays).not.toHaveBeenCalled();
  });

  it('FE-MOB-MVAC-022: the year switcher steps inside the list before creating a year', async () => {
    const setSelectedYear = vi.fn((_year: number) => undefined);
    const handleAddPrevYear = vi.fn(() => undefined);
    const handleAddNextYear = vi.fn(() => undefined);
    mocks.vacay = buildVacay({ setSelectedYear, handleAddPrevYear, handleAddNextYear });
    const { result } = await mount();

    await act(async () => { await result.current.prevYear(); });
    expect(setSelectedYear).toHaveBeenLastCalledWith(2025);
    expect(handleAddPrevYear).not.toHaveBeenCalled();

    await act(async () => { await result.current.nextYear(); });
    expect(handleAddNextYear).toHaveBeenCalledTimes(1);
    expect(setSelectedYear).toHaveBeenLastCalledWith(2027);
  });

  it('FE-MOB-MVAC-022b: stepping forward inside the list never creates a year', async () => {
    const setSelectedYear = vi.fn((_year: number) => undefined);
    const handleAddNextYear = vi.fn(() => undefined);
    mocks.vacay = buildVacay({ selectedYear: 2025, setSelectedYear, handleAddNextYear });
    const { result } = await mount();

    await act(async () => { await result.current.nextYear(); });
    expect(setSelectedYear).toHaveBeenCalledWith(2026);
    expect(handleAddNextYear).not.toHaveBeenCalled();
  });

  it('FE-MOB-MVAC-023: stepping past the oldest year creates it first', async () => {
    const setSelectedYear = vi.fn((_year: number) => undefined);
    const handleAddPrevYear = vi.fn(() => undefined);
    mocks.vacay = buildVacay({ years: [2026], selectedYear: 2026, setSelectedYear, handleAddPrevYear });
    const { result } = await mount();

    await act(async () => { await result.current.prevYear(); });
    expect(handleAddPrevYear).toHaveBeenCalledTimes(1);
    expect(setSelectedYear).toHaveBeenCalledWith(2025);
  });

  it('FE-MOB-MVAC-024: a rejected share toggle surfaces the server message', async () => {
    const setShareHidden = vi.fn(async (_shareId: number, _hidden: boolean) => {
      throw { response: { data: { error: 'Share gone' } }, message: 'nope' };
    });
    act(() => { useVacayStore.setState({ setShareHidden }); });
    const { result } = await mount();

    await act(async () => { result.current.toggleShareHidden(7, true); });
    await waitFor(() => expect(toasts).toHaveLength(1));
    expect(toasts[0]).toEqual({ type: 'error', message: 'Share gone' });
    expect(setShareHidden).toHaveBeenCalledWith(7, true);
  });

  it('FE-MOB-MVAC-025: the back action returns to the dashboard', async () => {
    const { result } = await mount();

    act(() => { result.current.goBack(); });
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('FE-MOB-MVAC-026: a day stranded by a weekend-config change can still be cleared (#1897)', async () => {
    const toggleEntry = vi.fn(async (_date: string, _userId?: number, _fraction?: 0.5 | 1, _kind?: 'vacation' | 'comp') => {});
    // 2026-06-13 is a Saturday; alice logged it before Saturday became a weekend.
    const entry: VacayEntry = { date: '2026-06-13', user_id: 1, fraction: 0.5, kind: 'comp' };
    act(() => { useVacayStore.setState({ toggleEntry, entries: [entry] }); });
    const { result } = await mount();
    act(() => { result.current.toggleView(); });

    await act(async () => { await result.current.handleDayTap('2026-06-13'); });
    // Cleared with the entry's own fraction/kind, ignoring the toolbar modifiers —
    // the server only allows the delete on a blocked day, not a conversion.
    expect(toggleEntry).toHaveBeenCalledWith('2026-06-13', 1, 0.5, 'comp');

    // A weekend day nobody logged stays inert.
    await act(async () => { await result.current.handleDayTap('2026-06-14'); });
    expect(toggleEntry).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-MVAC-027: zooming out of the overview resolves the slot in the shifted window (#737)', async () => {
    act(() => {
      useVacayStore.setState({
        yearSettings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null },
      });
    });
    const { result } = await mount();
    act(() => { result.current.setMonthSlot(0); });

    // Slot 6 of a July window is January of the following calendar year.
    await act(async () => { await result.current.handleDayTap('2027-01-10'); });
    expect(result.current.monthSlot).toBe(6);
    expect(result.current.activeMonth).toEqual({ year: 2027, month: 0 });
  });

  it('FE-MOB-MVAC-028: a day outside the rendered window leaves the overview alone', async () => {
    act(() => {
      useVacayStore.setState({
        yearSettings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null },
      });
    });
    const { result } = await mount();
    act(() => { result.current.setMonthSlot(3); });

    // Jan 2026 has no card in the Jul 2026 - Jun 2027 window.
    await act(async () => { await result.current.handleDayTap('2026-01-10'); });
    expect(result.current.view).toBe('grid');
    expect(result.current.monthSlot).toBe(3);
  });

  it('FE-MOB-MVAC-029: the month chip opens its slot in the editor', async () => {
    const { result } = await mount();

    act(() => { result.current.openMonthSlot(9); });
    expect(result.current.view).toBe('edit');
    expect(result.current.monthSlot).toBe(9);
  });
});
