// FE-MOB-MVACSET-001 to FE-MOB-MVACSET-030
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, fireEvent, waitFor, within } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores } from '../../../helpers/store';
import { useVacayStore } from '../../../../src/store/vacayStore';
import MVacaySettingsSheet from '../../../../src/mobile/screens/vacay/MVacaySettingsSheet';
import type { VacayHolidayCalendar, VacayPlan } from '../../../../src/types';

const toasts: { type: string; message: string }[] = [];

function buildPlan(over: Partial<VacayPlan> = {}): VacayPlan {
  return {
    id: 1,
    holidays_enabled: false,
    school_holidays_enabled: false,
    holidays_region: null,
    holiday_calendars: [],
    block_weekends: true,
    carry_over_enabled: false,
    company_holidays_enabled: false,
    ...over,
  };
}

/** The countries endpoint answers with nager's `{ countryCode, name }` rows. */
function countriesRespond(rows: { countryCode: string; name: string }[]) {
  server.use(http.get('/api/addons/vacay/holidays/countries', () => HttpResponse.json(rows)));
}

/** Regional public holidays — `counties` is what turns the region picker on. */
function regionalHolidays() {
  server.use(http.get('/api/addons/vacay/holidays/:year/:country', () => HttpResponse.json([
    { date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false, counties: ['DE-BY', 'DE-NW'] },
  ])));
}

function seedPlan(plan: VacayPlan, extra: Record<string, unknown> = {}) {
  useVacayStore.setState({ plan, ...extra });
}

beforeEach(() => {
  resetAllStores();
  toasts.length = 0;
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message });
    return 1;
  }) as Window['__addToast'];
  countriesRespond([
    { countryCode: 'NL', name: 'Netherlands' },
    { countryCode: 'DE', name: 'Germany' },
  ]);
  seedPlan(buildPlan());
});

afterEach(() => {
  delete window.__addToast;
});

function renderSheet(onClose = vi.fn(() => undefined)) {
  const view = render(<MVacaySettingsSheet open onClose={onClose} />);
  return { ...view, onClose };
}

/** Country picker options only appear once the countries request resolved. */
async function waitForCountries() {
  await waitFor(() => expect(screen.getAllByRole('option', { name: 'Germany' }).length).toBeGreaterThan(0));
}

describe('MVacaySettingsSheet', () => {
  it('FE-MOB-MVACSET-001: renders nothing without a plan', () => {
    useVacayStore.setState({ plan: null });
    render(<MVacaySettingsSheet open onClose={() => {}} />);

    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSET-002: renders nothing while closed', () => {
    render(<MVacaySettingsSheet open={false} onClose={() => {}} />);

    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSET-003: the close icon dismisses the sheet', () => {
    const { onClose } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-MVACSET-004: shows the weekend-day chips only while weekends are blocked', () => {
    renderSheet();

    expect(screen.getByText('Weekend days')).toBeInTheDocument();
    const sat = screen.getByRole('button', { name: 'Sat' });
    expect(sat.className).toContain('bg-m-act');
    expect(screen.getByRole('button', { name: 'Wed' }).className).not.toContain('bg-m-act');
  });

  it('FE-MOB-MVACSET-005: toggling block-weekends writes the inverted flag', () => {
    const updatePlan = vi.fn(async (_updates: Partial<VacayPlan>) => {});
    seedPlan(buildPlan(), { updatePlan });
    renderSheet();

    fireEvent.click(screen.getByRole('switch', { name: 'Block Weekends' }));
    expect(updatePlan).toHaveBeenCalledWith({ block_weekends: false });
  });

  it('FE-MOB-MVACSET-006: an unblocked plan hides the weekend-day chips', () => {
    seedPlan(buildPlan({ block_weekends: false }));
    renderSheet();

    expect(screen.queryByText('Weekend days')).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSET-007: weekend chips add and remove their day from the plan', () => {
    const updatePlan = vi.fn(async (_updates: Partial<VacayPlan>) => {});
    seedPlan(buildPlan({ weekend_days: '0,6' }), { updatePlan });
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Fri' }));
    expect(updatePlan).toHaveBeenLastCalledWith({ weekend_days: '0,6,5' });

    // 'Sun' is also a week-start button; the weekend chips come first in the DOM.
    fireEvent.click(screen.getAllByRole('button', { name: 'Sun' })[0]);
    expect(updatePlan).toHaveBeenLastCalledWith({ weekend_days: '6' });
  });

  it('FE-MOB-MVACSET-008: the week-start buttons mark the active day and save the other', () => {
    const updatePlan = vi.fn(async (_updates: Partial<VacayPlan>) => {});
    seedPlan(buildPlan({ block_weekends: false }), { updatePlan });
    renderSheet();

    expect(screen.getByRole('button', { name: 'Mon' }).className).toContain('bg-m-act');
    fireEvent.click(screen.getByRole('button', { name: 'Sun' }));
    expect(updatePlan).toHaveBeenCalledWith({ week_start: 0 });
  });

  it('FE-MOB-MVACSET-009: carry-over and company holidays toggle their plan flags', () => {
    const updatePlan = vi.fn(async (_updates: Partial<VacayPlan>) => {});
    seedPlan(buildPlan({ carry_over_enabled: true }), { updatePlan });
    renderSheet();

    fireEvent.click(screen.getByRole('switch', { name: 'Carry Over' }));
    expect(updatePlan).toHaveBeenLastCalledWith({ carry_over_enabled: false });

    fireEvent.click(screen.getByRole('switch', { name: 'Company Holidays' }));
    expect(updatePlan).toHaveBeenLastCalledWith({ company_holidays_enabled: true });
  });

  it('FE-MOB-MVACSET-010: the calendar leave year shows its Jan–Dec window', () => {
    useVacayStore.setState({ selectedYear: 2026 });
    renderSheet();

    expect(screen.getByText('2026: Jan 2026 – Dec 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calendar' }).className).toContain('bg-m-act');
    expect(screen.queryByRole('combobox', { name: 'Start month' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hire date')).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSET-011: switching to a fiscal year saves the type and reveals month/day', () => {
    const updateYearSettings = vi.fn(async () => {});
    useVacayStore.setState({
      selectedYear: 2026,
      updateYearSettings,
      yearSettings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null },
    });
    renderSheet();

    expect(screen.getByText('2026: Jul 2026 – Jun 2027')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Start month' })).toHaveValue('7');
    expect(screen.getByRole('combobox', { name: 'Day' })).toHaveValue('1');

    fireEvent.change(screen.getByRole('combobox', { name: 'Start month' }), { target: { value: '4' } });
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'fiscal', year_start_month: 4, year_start_day: 1, hire_date: null,
    });
  });

  it('FE-MOB-MVACSET-012: a start day past the new month cap is clamped on save', () => {
    const updateYearSettings = vi.fn(async () => {});
    useVacayStore.setState({
      updateYearSettings,
      yearSettings: { year_type: 'fiscal', year_start_month: 1, year_start_day: 31, hire_date: null },
    });
    renderSheet();

    // February only ever has 28 guaranteed days.
    fireEvent.change(screen.getByRole('combobox', { name: 'Start month' }), { target: { value: '2' } });
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'fiscal', year_start_month: 2, year_start_day: 28, hire_date: null,
    });
    expect(screen.getAllByRole('option', { name: '31' })).toHaveLength(1);
  });

  it('FE-MOB-MVACSET-013: the day select saves the picked day', () => {
    const updateYearSettings = vi.fn(async () => {});
    useVacayStore.setState({
      updateYearSettings,
      yearSettings: { year_type: 'fiscal', year_start_month: 4, year_start_day: 1, hire_date: null },
    });
    renderSheet();

    fireEvent.change(screen.getByRole('combobox', { name: 'Day' }), { target: { value: '15' } });
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'fiscal', year_start_month: 4, year_start_day: 15, hire_date: null,
    });
  });

  it('FE-MOB-MVACSET-014: the anniversary year is driven by the hire date field', () => {
    const updateYearSettings = vi.fn(async () => {});
    useVacayStore.setState({
      updateYearSettings,
      yearSettings: { year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: '2020-09-14' },
    });
    renderSheet();

    const hire = screen.getByLabelText('Hire date');
    expect(hire).toHaveValue('2020-09-14');

    fireEvent.change(hire, { target: { value: '2021-03-02' } });
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: '2021-03-02',
    });

    fireEvent.change(hire, { target: { value: '' } });
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: null,
    });
  });

  it('FE-MOB-MVACSET-015: picking a year type saves it', () => {
    const updateYearSettings = vi.fn(async () => {});
    useVacayStore.setState({ updateYearSettings });
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Hire date' }));
    expect(updateYearSettings).toHaveBeenCalledWith({
      year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: null,
    });
  });

  it('FE-MOB-MVACSET-016: public-holiday calendars stay hidden until the toggle is on', () => {
    const updatePlan = vi.fn(async (_updates: Partial<VacayPlan>) => {});
    seedPlan(buildPlan(), { updatePlan });
    renderSheet();

    expect(screen.queryByRole('button', { name: 'Add calendar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Public Holidays' }));
    expect(updatePlan).toHaveBeenCalledWith({ holidays_enabled: true });
  });

  it('FE-MOB-MVACSET-017: an enabled plan lists its public calendars and the add button', async () => {
    const calendars: VacayHolidayCalendar[] = [
      { id: 1, plan_id: 1, region: 'DE', label: 'Germany', color: '#fecaca', sort_order: 0 },
      { id: 2, plan_id: 1, region: 'NL|group:NL-NO', label: 'Noord', color: '#bbf7d0', sort_order: 1, type: 'school_holiday' },
    ];
    seedPlan(buildPlan({ holidays_enabled: true, holiday_calendars: calendars }));
    renderSheet();
    await waitForCountries();

    // Only the public calendar renders under the public-holiday section.
    const labels = screen.getAllByPlaceholderText('Label (optional)');
    expect(labels).toHaveLength(1);
    expect(labels[0]).toHaveValue('Germany');
    expect(screen.getAllByRole('button', { name: 'Add calendar' })).toHaveLength(1);
  });

  it('FE-MOB-MVACSET-018: editing a calendar label writes it back on blur only when it changed', async () => {
    const updateHolidayCalendar = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
    seedPlan(
      buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: 'Germany', color: '#fecaca', sort_order: 0 }],
      }),
      { updateHolidayCalendar },
    );
    renderSheet();

    const input = screen.getByDisplayValue('Germany');
    fireEvent.blur(input);
    expect(updateHolidayCalendar).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '  Deutschland  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(updateHolidayCalendar).toHaveBeenCalledWith(3, { label: 'Deutschland' });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(updateHolidayCalendar).toHaveBeenLastCalledWith(3, { label: null });
  });

  it('FE-MOB-MVACSET-019: the swatch palette recolors a calendar and closes again', () => {
    const updateHolidayCalendar = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
    seedPlan(
      buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      { updateHolidayCalendar },
    );
    renderSheet();

    // The sheet renders through a portal, so the palette lives outside `container`.
    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    const swatches = document.querySelectorAll('.rounded-md');
    expect(swatches).toHaveLength(8);

    // Re-picking the current color is a no-op; a different one saves.
    fireEvent.click(swatches[0]);
    expect(updateHolidayCalendar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    fireEvent.click(document.querySelectorAll('.rounded-md')[3]);
    expect(updateHolidayCalendar).toHaveBeenCalledWith(3, { color: '#bbf7d0' });
    expect(document.querySelectorAll('.rounded-md')).toHaveLength(0);
  });

  it('FE-MOB-MVACSET-020: a calendar can change country and, once regional, its region', async () => {
    regionalHolidays();
    const updateHolidayCalendar = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
    seedPlan(
      buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      { updateHolidayCalendar },
    );
    renderSheet();
    await waitForCountries();

    fireEvent.change(screen.getByRole('combobox', { name: 'Select country' }), { target: { value: 'NL' } });
    expect(updateHolidayCalendar).toHaveBeenCalledWith(3, { region: 'NL' });

    const region = await screen.findByRole('combobox', { name: 'Select region (required)' });
    fireEvent.change(region, { target: { value: 'DE-BY' } });
    expect(updateHolidayCalendar).toHaveBeenLastCalledWith(3, { region: 'DE-BY' });
  });

  it('FE-MOB-MVACSET-021: a calendar can be deleted', () => {
    const deleteHolidayCalendar = vi.fn(async (_id: number) => {});
    seedPlan(
      buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      { deleteHolidayCalendar },
    );
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteHolidayCalendar).toHaveBeenCalledWith(3);
  });

  it('FE-MOB-MVACSET-022: the add-calendar draft opens, cancels and posts a public calendar', async () => {
    const addHolidayCalendar = vi.fn(async (_data: Record<string, unknown>) => {});
    seedPlan(buildPlan({ holidays_enabled: true }), { addHolidayCalendar });
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }));
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Add calendar' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }));
    await waitForCountries();
    fireEvent.change(screen.getByPlaceholderText('Label (optional)'), { target: { value: ' Feiertage ' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Select country' }), { target: { value: 'DE' } });
    // Germany has no regional holidays here, but the draft only unlocks once that
    // answer is in (see FE-MOB-MVACSET-029).
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(addHolidayCalendar).toHaveBeenCalledWith({
      region: 'DE', color: '#fecaca', label: 'Feiertage', type: 'public_holiday',
    }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add calendar' })).toBeInTheDocument());
  });

  it('FE-MOB-MVACSET-023: a regional country blocks the draft until a region is picked', async () => {
    regionalHolidays();
    const addHolidayCalendar = vi.fn(async (_data: Record<string, unknown>) => {});
    seedPlan(buildPlan({ holidays_enabled: true }), { addHolidayCalendar });
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }));
    await waitForCountries();
    fireEvent.change(screen.getByRole('combobox', { name: 'Select country' }), { target: { value: 'DE' } });

    const region = await screen.findByRole('combobox', { name: 'Select region (required)' });
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    fireEvent.change(region, { target: { value: 'DE-NW' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(addHolidayCalendar).toHaveBeenCalledWith({
      region: 'DE-NW', color: '#fecaca', label: null, type: 'public_holiday',
    }));
  });

  it('FE-MOB-MVACSET-024: the school-holiday section only offers supported countries', async () => {
    const addHolidayCalendar = vi.fn(async (_data: Record<string, unknown>) => {});
    countriesRespond([
      { countryCode: 'NL', name: 'Netherlands' },
      { countryCode: 'US', name: 'United States' },
    ]);
    seedPlan(buildPlan({ school_holidays_enabled: true }), { addHolidayCalendar });
    renderSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Add calendar' }));
    const country = screen.getByRole('combobox', { name: 'Select country' });
    await waitFor(() => expect(within(country).getByRole('option', { name: 'Netherlands' })).toBeInTheDocument());
    expect(within(country).queryByRole('option', { name: 'United States' })).not.toBeInTheDocument();

    fireEvent.change(country, { target: { value: 'NL' } });
    const region = await screen.findByRole('combobox', { name: 'Select region (required)' });
    fireEvent.change(region, { target: { value: 'NL|group:NL-NO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(addHolidayCalendar).toHaveBeenCalledWith({
      region: 'NL|group:NL-NO', color: '#fecaca', label: null, type: 'school_holiday',
    }));
  });

  it('FE-MOB-MVACSET-024b: an existing school calendar is editable with its subdivision regions', async () => {
    server.use(http.get('/api/addons/vacay/school-holidays/regions/:country', () => HttpResponse.json({
      groups: [],
      subdivisions: [
        { code: 'DE-BY', shortName: 'BY', name: [{ language: 'EN', text: 'Bavaria' }] },
        { code: 'DE-NW', shortName: 'NW', name: [{ language: 'EN', text: 'North Rhine-Westphalia' }] },
      ],
    })));
    const updateHolidayCalendar = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
    const deleteHolidayCalendar = vi.fn(async (_id: number) => {});
    seedPlan(
      buildPlan({
        school_holidays_enabled: true,
        holiday_calendars: [
          { id: 5, plan_id: 1, region: 'DE-BY', label: 'Bayern', color: '#bbf7d0', sort_order: 0, type: 'school_holiday' },
          // A calendar that never got a country has nothing to look regions up with.
          { id: 6, plan_id: 1, region: '', label: null, color: '#fde68a', sort_order: 1, type: 'school_holiday' },
        ],
      }),
      { updateHolidayCalendar, deleteHolidayCalendar },
    );
    renderSheet();

    expect(screen.getAllByPlaceholderText('Label (optional)')).toHaveLength(2);
    const region = await screen.findByRole('combobox', { name: 'Select region (required)' });
    fireEvent.change(region, { target: { value: 'DE-NW' } });
    expect(updateHolidayCalendar).toHaveBeenCalledWith(5, { region: 'DE-NW' });

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(deleteHolidayCalendar).toHaveBeenCalledWith(6);
  });

  it('FE-MOB-MVACSET-024d: a group calendar keeps its country and its region picker', async () => {
    const updateHolidayCalendar = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
    seedPlan(
      buildPlan({
        school_holidays_enabled: true,
        holiday_calendars: [
          { id: 7, plan_id: 1, region: 'NL|group:NL-NO', label: 'Noord', color: '#bbf7d0', sort_order: 0, type: 'school_holiday' },
        ],
      }),
      { updateHolidayCalendar },
    );
    renderSheet();
    await waitForCountries();

    // The `|group:` suffix must not leak into the country, or the lookup comes back empty.
    const country = screen.getByRole('combobox', { name: 'Select country' });
    expect(country).toHaveValue('NL');
    const region = await screen.findByRole('combobox', { name: 'Select region (required)' });
    expect(region).toHaveValue('NL|group:NL-NO');

    fireEvent.change(region, { target: { value: 'NL|group:NL-ZU' } });
    expect(updateHolidayCalendar).toHaveBeenCalledWith(7, { region: 'NL|group:NL-ZU' });
  });

  it('FE-MOB-MVACSET-024c: the school draft can be cancelled again', () => {
    seedPlan(buildPlan({ school_holidays_enabled: true }));
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }));
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add calendar' })).toBeInTheDocument();
  });

  it('FE-MOB-MVACSET-025: the school-holiday toggle writes its own plan flag', () => {
    const updatePlan = vi.fn(async (_updates: Partial<VacayPlan>) => {});
    seedPlan(buildPlan(), { updatePlan });
    renderSheet();

    fireEvent.click(screen.getByRole('switch', { name: 'School Holidays' }));
    expect(updatePlan).toHaveBeenCalledWith({ school_holidays_enabled: true });
  });

  it('FE-MOB-MVACSET-026: the dissolve block appears only for a fused plan', () => {
    renderSheet();
    expect(screen.queryByText('Dissolve Fusion')).not.toBeInTheDocument();
  });

  it('FE-MOB-MVACSET-027: dissolving lists the members, toasts and closes the sheet', async () => {
    const dissolve = vi.fn(async () => {});
    seedPlan(buildPlan(), {
      isFused: true,
      dissolve,
      users: [{ id: 1, username: 'alice', color: '#3b82f6' }, { id: 2, username: 'bob', color: null }],
    });
    const { onClose } = renderSheet();

    expect(screen.getByText('Dissolve Fusion')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dissolve' }));
    await waitFor(() => expect(dissolve).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toasts).toEqual([{ type: 'success', message: 'Calendar separated' }]);
  });

  it('FE-MOB-MVACSET-028: a failing countries request leaves the picker empty', async () => {
    server.use(http.get('/api/addons/vacay/holidays/countries', () =>
      HttpResponse.json({ error: 'down' }, { status: 500 })));
    seedPlan(buildPlan({ holidays_enabled: true }));
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }));
    const country = screen.getByRole('combobox', { name: 'Select country' });
    await waitFor(() => expect(within(country).getAllByRole('option')).toHaveLength(1));
    // Only the disabled placeholder option survives — the label falls back to it too.
    expect(screen.getAllByText('Select country')).toHaveLength(2);
  });

  it('FE-MOB-MVACSET-029: the draft stays blocked while the region list is still loading', async () => {
    let release: (() => void) | undefined;
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', async () => {
      await new Promise<void>(resolve => { release = resolve; });
      return HttpResponse.json([
        { date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false, counties: ['DE-BY', 'DE-NW'] },
      ]);
    }));
    seedPlan(buildPlan({ holidays_enabled: true }), { addHolidayCalendar: vi.fn(async () => {}) });
    renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }));
    await waitForCountries();
    fireEvent.change(screen.getByRole('combobox', { name: 'Select country' }), { target: { value: 'DE' } });

    // An empty list means "no answer yet", not "this country needs no region" (#1813).
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-busy', 'true');

    await waitFor(() => expect(release).toBeDefined());
    release?.();

    const region = await screen.findByRole('combobox', { name: 'Select region (required)' });
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-busy', 'false');

    fireEvent.change(region, { target: { value: 'DE-NW' } });
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  it('FE-MOB-MVACSET-030: switching a calendar country drops the old region list at once', async () => {
    let releaseNl: (() => void) | undefined;
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', async ({ params }) => {
      if (params.country === 'NL') await new Promise<void>(resolve => { releaseNl = resolve; });
      return HttpResponse.json([{
        date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false,
        counties: params.country === 'NL' ? ['NL-NH'] : ['DE-BY', 'DE-NW'],
      }]);
    }));
    const updateHolidayCalendar = vi.fn(async (id: number, data: { region?: string }) => {
      const plan = useVacayStore.getState().plan;
      if (!plan) return;
      useVacayStore.setState({
        plan: { ...plan, holiday_calendars: (plan.holiday_calendars ?? []).map(c => (c.id === id ? { ...c, ...data } : c)) },
      });
    });
    seedPlan(
      buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      { updateHolidayCalendar },
    );
    renderSheet();
    await waitForCountries();

    await screen.findByRole('combobox', { name: 'Select region (required)' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Select country' }), { target: { value: 'NL' } });
    expect(updateHolidayCalendar).toHaveBeenCalledWith(3, { region: 'NL' });

    // The Dutch list is still on its way, so the German regions must be gone:
    // otherwise DE-BY can be saved for the Netherlands (#1813).
    await waitFor(() => expect(screen.queryByRole('combobox', { name: 'Select region (required)' })).not.toBeInTheDocument());

    await waitFor(() => expect(releaseNl).toBeDefined());
    releaseNl?.();
    await screen.findByRole('combobox', { name: 'Select region (required)' });
  });
});
