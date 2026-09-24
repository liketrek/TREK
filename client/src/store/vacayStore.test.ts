// FE-STORE-VCY-001 to FE-STORE-VCY-023
// Complements tests/unit/stores/vacayStore.test.ts: optimistic toggles and their
// rollbacks, the leave-year window plumbing and the holiday-marker merge rules.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/helpers/msw/server';
import { resetAllStores } from '../../tests/helpers/store';
import { useVacayStore } from './vacayStore';
import { useAuthStore } from './authStore';
import type { HolidayInfo, VacayEntry, VacayPlan, VacayYearSettings } from '../types';

const FISCAL_JULY: VacayYearSettings = {
  year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null,
};

function buildPlan(over: Partial<VacayPlan> = {}): VacayPlan {
  return {
    id: 1,
    holidays_enabled: true,
    school_holidays_enabled: false,
    holidays_region: null,
    holiday_calendars: [],
    block_weekends: true,
    carry_over_enabled: false,
    company_holidays_enabled: false,
    ...over,
  };
}

function markersOn(date: string): HolidayInfo[] {
  const value = useVacayStore.getState().holidays[date];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

beforeEach(() => {
  resetAllStores();
  useAuthStore.setState({ user: { id: 1, username: 'alice', email: 'a@t.app', role: 'user' } as never });
});

describe('vacayStore optimistic updates', () => {
  it('FE-STORE-VCY-001: toggling an empty day adds an entry with the person color', async () => {
    let resolveToggle = (): void => {};
    const gate = new Promise<void>(res => { resolveToggle = res; });
    server.use(http.post('/api/addons/vacay/entries/toggle', async () => {
      await gate;
      return HttpResponse.json({ success: true });
    }));
    useVacayStore.setState({
      selectedYear: 2025,
      users: [{ id: 1, username: 'alice', color: '#3b82f6' }],
      entries: [],
    });

    const pending = useVacayStore.getState().toggleEntry('2025-06-20');
    // The cell reacts before the round trip finishes.
    expect(useVacayStore.getState().entries).toEqual([
      { date: '2025-06-20', user_id: 1, fraction: 1, kind: 'vacation', person_color: '#3b82f6', person_name: 'alice' },
    ]);

    resolveToggle();
    await pending;
    // Reconciled from the server afterwards.
    expect(useVacayStore.getState().entries).toHaveLength(2);
  });

  it('FE-STORE-VCY-002: toggling the same fraction and kind again clears the day', async () => {
    const entries: VacayEntry[] = [
      { date: '2025-06-20', user_id: 1, fraction: 1, kind: 'vacation' },
      { date: '2025-06-21', user_id: 1 },
    ];
    useVacayStore.setState({ selectedYear: 2025, entries });

    let seen: VacayEntry[] = [];
    server.use(http.post('/api/addons/vacay/entries/toggle', () => {
      seen = useVacayStore.getState().entries;
      return HttpResponse.json({ success: true });
    }));

    await useVacayStore.getState().toggleEntry('2025-06-20', 1, 1, 'vacation');
    expect(seen.map(e => e.date)).toEqual(['2025-06-21']);
  });

  it('FE-STORE-VCY-003: a legacy entry without fraction or kind counts as a full vacation day', async () => {
    useVacayStore.setState({ selectedYear: 2025, entries: [{ date: '2025-06-20', user_id: 1 }] });

    let seen: VacayEntry[] = [];
    server.use(http.post('/api/addons/vacay/entries/toggle', () => {
      seen = useVacayStore.getState().entries;
      return HttpResponse.json({ success: true });
    }));

    await useVacayStore.getState().toggleEntry('2025-06-20', 1, 1, 'vacation');
    expect(seen).toEqual([]);
  });

  it('FE-STORE-VCY-004: a different fraction or kind converts the day instead of clearing it', async () => {
    useVacayStore.setState({
      selectedYear: 2025,
      entries: [{ date: '2025-06-20', user_id: 1, fraction: 1, kind: 'vacation' }],
    });

    let seen: VacayEntry[] = [];
    server.use(http.post('/api/addons/vacay/entries/toggle', () => {
      seen = useVacayStore.getState().entries;
      return HttpResponse.json({ success: true });
    }));

    await useVacayStore.getState().toggleEntry('2025-06-20', 1, 0.5, 'comp');
    expect(seen).toEqual([{ date: '2025-06-20', user_id: 1, fraction: 0.5, kind: 'comp' }]);
  });

  it('FE-STORE-VCY-005: a rejected toggle restores the previous entries and rethrows', async () => {
    const entries: VacayEntry[] = [{ date: '2025-06-20', user_id: 1 }];
    const stats = [{
      user_id: 1, person_name: 'alice', person_color: '#3b82f6', year: 2025,
      vacation_days: 30, carried_over: 0, total_available: 30, used: 1, remaining: 29,
    }];
    useVacayStore.setState({ selectedYear: 2025, entries, stats });
    server.use(http.post('/api/addons/vacay/entries/toggle', () =>
      HttpResponse.json({ error: 'locked' }, { status: 403 })));

    await expect(useVacayStore.getState().toggleEntry('2025-06-21', 1)).rejects.toThrow();
    expect(useVacayStore.getState().entries).toEqual(entries);
    expect(useVacayStore.getState().stats).toEqual(stats);
  });

  it('FE-STORE-VCY-006: toggling for an unknown person still records the entry', async () => {
    useVacayStore.setState({ selectedYear: 2025, users: [], entries: [] });

    let seen: VacayEntry[] = [];
    server.use(http.post('/api/addons/vacay/entries/toggle', () => {
      seen = useVacayStore.getState().entries;
      return HttpResponse.json({ success: true });
    }));

    await useVacayStore.getState().toggleEntry('2025-06-20', 4);
    expect(seen).toEqual([
      { date: '2025-06-20', user_id: 4, fraction: 1, kind: 'vacation', person_color: undefined, person_name: undefined },
    ]);
  });

  it('FE-STORE-VCY-007: company-holiday toggles add and remove the day optimistically', async () => {
    useVacayStore.setState({ selectedYear: 2025, companyHolidays: [{ date: '2025-12-24' }] });

    const seen: { date: string; note?: string }[][] = [];
    server.use(http.post('/api/addons/vacay/entries/company-holiday', () => {
      seen.push(useVacayStore.getState().companyHolidays);
      return HttpResponse.json({ success: true });
    }));

    await useVacayStore.getState().toggleCompanyHoliday('2025-12-24');
    await useVacayStore.getState().toggleCompanyHoliday('2025-12-25');

    expect(seen[0]).toEqual([]);
    expect(seen[1]).toEqual([{ date: '2025-12-25' }]);
  });

  it('FE-STORE-VCY-008: a rejected company-holiday toggle rolls the day back', async () => {
    const companyHolidays = [{ date: '2025-12-24' }];
    useVacayStore.setState({ selectedYear: 2025, companyHolidays });
    server.use(http.post('/api/addons/vacay/entries/company-holiday', () =>
      HttpResponse.json({ error: 'nope' }, { status: 500 })));

    await expect(useVacayStore.getState().toggleCompanyHoliday('2025-12-25')).rejects.toThrow();
    expect(useVacayStore.getState().companyHolidays).toEqual(companyHolidays);
  });
});

describe('vacayStore leave-year window', () => {
  it('FE-STORE-VCY-009: an empty year list falls back to the current period', async () => {
    useVacayStore.setState({ yearSettings: FISCAL_JULY });
    server.use(http.get('/api/addons/vacay/years', () => HttpResponse.json({ years: [] })));

    await useVacayStore.getState().loadYears();
    const now = new Date();
    const expected = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

    expect(useVacayStore.getState().years).toEqual([]);
    expect(useVacayStore.getState().selectedYear).toBe(expected);
  });

  it('FE-STORE-VCY-010: updating the year settings reloads everything the window feeds', async () => {
    useVacayStore.setState({ selectedYear: 2026, plan: buildPlan({ holidays_enabled: false }) });
    const hits: string[] = [];
    server.use(
      http.get('/api/addons/vacay/entries/:year', ({ params }) => {
        hits.push(`entries:${params.year as string}`);
        return HttpResponse.json({ entries: [], companyHolidays: [] });
      }),
      http.get('/api/addons/vacay/stats/:year', ({ params }) => {
        hits.push(`stats:${params.year as string}`);
        return HttpResponse.json({ stats: [] });
      }),
      http.get('/api/addons/vacay/shares/calendars/:year', ({ params }) => {
        hits.push(`shared:${params.year as string}`);
        return HttpResponse.json({ calendars: [] });
      }),
    );

    await useVacayStore.getState().updateYearSettings({
      year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null,
    });

    expect(useVacayStore.getState().yearSettings.year_type).toBe('fiscal');
    expect(useVacayStore.getState().yearSettings.year_start_month).toBe(7);
    expect(hits).toEqual(['entries:2026', 'stats:2026', 'shared:2026']);
  });

  it('FE-STORE-VCY-011: a settings response without a body falls back to the calendar year', async () => {
    useVacayStore.setState({ yearSettings: FISCAL_JULY });
    server.use(http.put('/api/addons/vacay/year-settings', () => HttpResponse.json({})));

    await useVacayStore.getState().updateYearSettings({
      year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null,
    });

    expect(useVacayStore.getState().yearSettings).toEqual({
      year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null,
    });
  });
});

describe('vacayStore holiday markers', () => {
  it('FE-STORE-VCY-012: two calendars on the same day keep both markers', async () => {
    useVacayStore.setState({
      selectedYear: 2026,
      plan: buildPlan({
        holiday_calendars: [
          { id: 1, plan_id: 1, region: 'DE', label: 'DE', color: '#fecaca', sort_order: 0 },
          { id: 2, plan_id: 1, region: 'FR', label: 'FR', color: '#bbf7d0', sort_order: 1 },
        ],
      }),
    });
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', () => HttpResponse.json([
      { date: '2026-12-25', name: 'Christmas', localName: 'Weihnachten', global: true, counties: null },
    ])));

    await useVacayStore.getState().loadHolidays(2026);
    expect(markersOn('2026-12-25').map(m => m.color)).toEqual(['#fecaca', '#bbf7d0']);
  });

  it('FE-STORE-VCY-013: a shifted year loads both calendar years without duplicating a marker', async () => {
    useVacayStore.setState({
      selectedYear: 2026,
      yearSettings: FISCAL_JULY,
      plan: buildPlan({
        holiday_calendars: [{ id: 1, plan_id: 1, region: 'DE', label: 'DE', color: '#fecaca', sort_order: 0 }],
      }),
    });
    const requested: string[] = [];
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', ({ params }) => {
      requested.push(params.year as string);
      return HttpResponse.json([
        { date: '2026-12-25', name: 'Christmas', localName: 'Weihnachten', global: true, counties: null },
        // Outside the Jul 2026 – Jun 2027 window, so it never reaches the map.
        { date: '2026-05-01', name: 'Labour Day', localName: 'Tag der Arbeit', global: true, counties: null },
      ]);
    }));

    await useVacayStore.getState().loadHolidays(2026);

    expect(requested).toEqual(['2026', '2027']);
    expect(markersOn('2026-12-25')).toHaveLength(1);
    expect(markersOn('2026-05-01')).toHaveLength(0);
  });

  it('FE-STORE-VCY-014: a country-level calendar is skipped when the data is region-split', async () => {
    useVacayStore.setState({
      selectedYear: 2026,
      plan: buildPlan({
        holiday_calendars: [{ id: 1, plan_id: 1, region: 'DE', label: 'DE', color: '#fecaca', sort_order: 0 }],
      }),
    });
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', () => HttpResponse.json([
      { date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false, counties: ['DE-BY'] },
    ])));

    await useVacayStore.getState().loadHolidays(2026);
    expect(useVacayStore.getState().holidays).toEqual({});
  });

  it('FE-STORE-VCY-015: school-holiday ranges expand into days and accept a plain name', async () => {
    useVacayStore.setState({
      selectedYear: 2026,
      plan: buildPlan({
        holidays_enabled: false,
        school_holidays_enabled: true,
        holiday_calendars: [{ id: 1, plan_id: 1, region: 'NL', label: 'NL', color: '#bbf7d0', sort_order: 0, type: 'school_holiday' }],
      }),
    });
    server.use(http.get('/api/addons/vacay/school-holidays/:year/:country', () => HttpResponse.json([
      { startDate: '2026-05-01', endDate: '2026-05-03', name: 'Meivakantie' },
      // No start date at all, and a range the date parser cannot read.
      { endDate: '2026-06-10', name: 'Broken' },
      { startDate: 'not-a-date', endDate: 'nope', name: 'Unparseable' },
    ])));

    await useVacayStore.getState().loadHolidays(2026);
    const holidays = useVacayStore.getState().holidays;

    expect(Object.keys(holidays).sort()).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
    expect(markersOn('2026-05-02')[0].name).toBe('Meivakantie');
  });

  it('FE-STORE-VCY-016: an unnamed school holiday gets the generic label', async () => {
    useVacayStore.setState({
      selectedYear: 2026,
      plan: buildPlan({
        holidays_enabled: false,
        school_holidays_enabled: true,
        holiday_calendars: [{ id: 1, plan_id: 1, region: 'NL', label: null, color: '#bbf7d0', sort_order: 0, type: 'school_holiday' }],
      }),
    });
    server.use(http.get('/api/addons/vacay/school-holidays/:year/:country', () => HttpResponse.json([
      { startDate: '2026-05-01', name: [] },
    ])));

    await useVacayStore.getState().loadHolidays(2026);
    expect(markersOn('2026-05-01')[0].name).toBe('School holidays');
  });

  it('FE-STORE-VCY-017: a failing holiday request leaves the other calendars intact', async () => {
    useVacayStore.setState({
      selectedYear: 2026,
      plan: buildPlan({
        holiday_calendars: [
          { id: 1, plan_id: 1, region: 'DE', label: 'DE', color: '#fecaca', sort_order: 0 },
          { id: 2, plan_id: 1, region: 'FR', label: 'FR', color: '#bbf7d0', sort_order: 1 },
        ],
      }),
    });
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', ({ params }) => {
      if (params.country === 'DE') return HttpResponse.json({ error: 'down' }, { status: 500 });
      return HttpResponse.json([
        { date: '2026-07-14', name: 'Bastille Day', localName: 'Fête nationale', global: true, counties: null },
      ]);
    }));

    await useVacayStore.getState().loadHolidays(2026);
    expect(markersOn('2026-07-14').map(m => m.color)).toEqual(['#bbf7d0']);
  });

  it('FE-STORE-VCY-018: disabled calendar types are not fetched at all', async () => {
    const fetched = vi.fn(() => undefined);
    useVacayStore.setState({
      selectedYear: 2026,
      plan: buildPlan({
        holidays_enabled: false,
        school_holidays_enabled: false,
        holiday_calendars: [
          { id: 1, plan_id: 1, region: 'DE', label: 'DE', color: '#fecaca', sort_order: 0 },
          { id: 2, plan_id: 1, region: 'NL', label: 'NL', color: '#bbf7d0', sort_order: 1, type: 'school_holiday' },
        ],
      }),
      holidays: { '2026-01-01': [{ name: 'stale', localName: 'stale', color: '#000', label: null }] },
    });
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', () => {
      fetched();
      return HttpResponse.json([]);
    }));

    await useVacayStore.getState().loadHolidays(2026);

    expect(fetched).not.toHaveBeenCalled();
    expect(useVacayStore.getState().holidays).toEqual({});
  });
});

describe('vacayStore year selection', () => {
  it('FE-STORE-VCY-019: the first load opens on the current period, not on the highest year', async () => {
    const current = new Date().getFullYear();
    server.use(http.get('/api/addons/vacay/years', () =>
      HttpResponse.json({ years: [current - 1, current, current + 4] })));

    await useVacayStore.getState().loadYears();

    expect(useVacayStore.getState().selectedYear).toBe(current);
  });

  it('FE-STORE-VCY-020: with no year for the current period the closest one is opened', async () => {
    const current = new Date().getFullYear();
    server.use(http.get('/api/addons/vacay/years', () =>
      HttpResponse.json({ years: [current - 3, current + 1] })));

    await useVacayStore.getState().loadYears();

    expect(useVacayStore.getState().selectedYear).toBe(current + 1);
  });

  it('FE-STORE-VCY-021: a reload keeps the year the viewer is looking at', async () => {
    const current = new Date().getFullYear();
    useVacayStore.setState({ years: [current, current + 1], selectedYear: current + 1 });
    server.use(http.get('/api/addons/vacay/years', () =>
      HttpResponse.json({ years: [current, current + 1] })));

    await useVacayStore.getState().loadYears();

    expect(useVacayStore.getState().selectedYear).toBe(current + 1);
  });

  it('FE-STORE-VCY-022: a reload that lost the selected year falls back to the current period', async () => {
    const current = new Date().getFullYear();
    useVacayStore.setState({ years: [current, current + 1], selectedYear: current + 1 });
    server.use(http.get('/api/addons/vacay/years', () =>
      HttpResponse.json({ years: [current] })));

    await useVacayStore.getState().loadYears();

    expect(useVacayStore.getState().selectedYear).toBe(current);
  });

  it('FE-STORE-VCY-023: removing the open year drops back to the current period', async () => {
    const current = new Date().getFullYear();
    useVacayStore.setState({ years: [current, current + 1], selectedYear: current + 1 });
    server.use(
      http.delete('/api/addons/vacay/years/:year', () => HttpResponse.json({ years: [current] })),
      http.get('/api/addons/vacay/stats/:year', () => HttpResponse.json({ stats: [] })),
    );

    await useVacayStore.getState().removeYear(current + 1);

    expect(useVacayStore.getState().selectedYear).toBe(current);
  });
});
