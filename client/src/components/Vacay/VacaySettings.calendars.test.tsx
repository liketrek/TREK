// FE-COMP-VCYSET-001 to FE-COMP-VCYSET-016
// Covers the calendar editor / draft rows and the leave-year block of VacaySettings,
// which VacaySettings.test.tsx only reaches at the surface.
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import VacaySettings from './VacaySettings'
import type { VacayHolidayCalendar, VacayPlan } from '../../types'

const toasts: { type: string; message: string }[] = []

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
  }
}

function countriesRespond(rows: { countryCode: string; name: string }[]) {
  server.use(http.get('/api/addons/vacay/holidays/countries', () => HttpResponse.json(rows)))
}

function regionalHolidays() {
  server.use(http.get('/api/addons/vacay/holidays/:year/:country', () => HttpResponse.json([
    { date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false, counties: ['DE-BY', 'DE-NW'] },
  ])))
}

/** The SettingToggle switch carries no label of its own — reach it through its row. */
function toggleFor(label: string): HTMLElement {
  const row = screen.getByText(label).closest('.justify-between') as HTMLElement
  return within(row).getByRole('button')
}

/** CustomSelect: click the trigger, then the option with that label. */
function pickOption(triggerName: string | RegExp, optionLabel: string) {
  fireEvent.click(screen.getByRole('button', { name: triggerName }))
  fireEvent.click(screen.getByRole('button', { name: optionLabel }))
}

/** Same, but waits for the option list — countries and regions load asynchronously. */
async function pickLoadedOption(triggerName: string | RegExp, optionLabel: string) {
  fireEvent.click(await screen.findByRole('button', { name: triggerName }))
  fireEvent.click(await screen.findByRole('button', { name: optionLabel }))
}

/** The trash icon in a calendar row carries no text of its own. */
function trashButtons(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('button.shrink-0.rounded-md')]
}

beforeEach(() => {
  resetAllStores()
  toasts.length = 0
  window.__addToast = ((message: string, type?: string) => {
    toasts.push({ type: type ?? 'info', message })
    return 1
  }) as Window['__addToast']
  countriesRespond([
    { countryCode: 'DE', name: 'Germany' },
    { countryCode: 'NL', name: 'Netherlands' },
  ])
  useVacayStore.setState({ plan: buildPlan(), selectedYear: 2026 })
})

afterEach(() => {
  delete window.__addToast
})

describe('VacaySettings calendars', () => {
  it('FE-COMP-VCYSET-001: the week-start buttons save the other day', () => {
    const updatePlan = vi.fn(async (_u: Partial<VacayPlan>) => {})
    useVacayStore.setState({ updatePlan })
    render(<VacaySettings onClose={vi.fn()} />)

    // 'Sun' is also a weekend-day chip; the week-start pair comes second.
    fireEvent.click(screen.getAllByRole('button', { name: 'Sun' })[1])
    expect(updatePlan).toHaveBeenCalledWith({ week_start: 0 })
  })

  it('FE-COMP-VCYSET-002: the holiday toggles flip their own plan flag', () => {
    const updatePlan = vi.fn(async (_u: Partial<VacayPlan>) => {})
    useVacayStore.setState({ updatePlan })
    render(<VacaySettings onClose={vi.fn()} />)

    fireEvent.click(toggleFor('Public Holidays'))
    expect(updatePlan).toHaveBeenLastCalledWith({ holidays_enabled: true })

    fireEvent.click(toggleFor('School Holidays'))
    expect(updatePlan).toHaveBeenLastCalledWith({ school_holidays_enabled: true })
  })

  it('FE-COMP-VCYSET-003: empty holiday sections explain that nothing is configured', () => {
    useVacayStore.setState({ plan: buildPlan({ holidays_enabled: true, school_holidays_enabled: true }) })
    render(<VacaySettings onClose={vi.fn()} />)

    expect(screen.getByText('No holiday calendars added yet')).toBeInTheDocument()
    expect(screen.getByText('No school holiday calendars added yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add calendar' })).toHaveLength(2)
  })

  it('FE-COMP-VCYSET-004: a calendar label is written back on blur and Enter blurs the field', () => {
    const updateHolidayCalendar = vi.fn(async (_id: number, _d: Record<string, unknown>) => {})
    const calendars: VacayHolidayCalendar[] = [
      { id: 3, plan_id: 1, region: 'DE', label: 'Germany', color: '#fecaca', sort_order: 0 },
    ]
    useVacayStore.setState({ plan: buildPlan({ holidays_enabled: true, holiday_calendars: calendars }), updateHolidayCalendar })
    render(<VacaySettings onClose={vi.fn()} />)

    const input = screen.getByDisplayValue('Germany')
    fireEvent.blur(input)
    expect(updateHolidayCalendar).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: ' Deutschland ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.blur(input)
    expect(updateHolidayCalendar).toHaveBeenCalledWith(3, { label: 'Deutschland' })
  })

  it('FE-COMP-VCYSET-005: a calendar can switch country and, once regional, region', async () => {
    regionalHolidays()
    const updateHolidayCalendar = vi.fn(async (_id: number, _d: Record<string, unknown>) => {})
    useVacayStore.setState({
      plan: buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      updateHolidayCalendar,
    })
    render(<VacaySettings onClose={vi.fn()} />)

    await pickLoadedOption('Germany', 'Netherlands')
    expect(updateHolidayCalendar).toHaveBeenLastCalledWith(3, { region: 'NL' })

    // The region list is only offered because the holiday data is county-split.
    await pickLoadedOption('Select region (required)', 'Nordrhein-Westfalen')
    expect(updateHolidayCalendar).toHaveBeenLastCalledWith(3, { region: 'DE-NW' })
  })

  it('FE-COMP-VCYSET-006: a calendar without a country offers no region list, and can be deleted', () => {
    const deleteHolidayCalendar = vi.fn(async (_id: number) => {})
    useVacayStore.setState({
      plan: buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 4, plan_id: 1, region: '', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      deleteHolidayCalendar,
    })
    const { container } = render(<VacaySettings onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Select region (required)' })).not.toBeInTheDocument()

    const trash = trashButtons(container)[0]
    fireEvent.mouseEnter(trash)
    expect(trash.style.background).toBe('rgba(239, 68, 68, 0.1)')
    fireEvent.mouseLeave(trash)
    expect(trash.style.background).toBe('transparent')

    fireEvent.click(trash)
    expect(deleteHolidayCalendar).toHaveBeenCalledWith(4)
  })

  it('FE-COMP-VCYSET-007: the public draft picks a color, a label and a country before adding', async () => {
    const addHolidayCalendar = vi.fn(async (_d: Record<string, unknown>) => {})
    useVacayStore.setState({ plan: buildPlan({ holidays_enabled: true }), addHolidayCalendar })
    const { container } = render(<VacaySettings onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }))
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()

    fireEvent.click(screen.getByTitle('Color'))
    const presets = container.querySelectorAll('div[style*="grid"] > button')
    expect(presets.length).toBeGreaterThan(1)
    fireEvent.click(presets[2])

    fireEvent.change(screen.getByPlaceholderText('Label (optional)'), { target: { value: ' Feiertage ' } })
    await pickLoadedOption('Select country', 'Germany')
    // Germany has no regional holidays here, but the draft only unlocks once that
    // answer is in (see FE-COMP-VCYSET-015).
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addHolidayCalendar).toHaveBeenCalledWith(expect.objectContaining({
      region: 'DE', label: 'Feiertage', type: 'public_holiday',
    })))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add calendar' })).toBeInTheDocument())
  })

  it('FE-COMP-VCYSET-008: a regional country blocks the draft until a region is chosen', async () => {
    regionalHolidays()
    const addHolidayCalendar = vi.fn(async (_d: Record<string, unknown>) => {})
    useVacayStore.setState({ plan: buildPlan({ holidays_enabled: true }), addHolidayCalendar })
    render(<VacaySettings onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }))
    await pickLoadedOption('Select country', 'Germany')

    await screen.findByRole('button', { name: 'Select region (required)' })
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()

    await pickLoadedOption('Select region (required)', 'Bayern')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addHolidayCalendar).toHaveBeenCalledWith(expect.objectContaining({ region: 'DE-BY' })))
  })

  it('FE-COMP-VCYSET-009: the school draft opens, cancels and adds a school calendar', async () => {
    const addHolidayCalendar = vi.fn(async (_d: Record<string, unknown>) => {})
    countriesRespond([
      { countryCode: 'NL', name: 'Netherlands' },
      { countryCode: 'US', name: 'United States' },
    ])
    useVacayStore.setState({ plan: buildPlan({ school_holidays_enabled: true }), addHolidayCalendar })
    render(<VacaySettings onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }))
    fireEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(screen.getByRole('button', { name: 'Add calendar' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }))
    // Only countries with OpenHolidays school-holiday coverage are offered.
    fireEvent.click(screen.getByRole('button', { name: 'Select country' }))
    expect(await screen.findByRole('button', { name: 'Netherlands' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'United States' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Netherlands' }))

    await pickLoadedOption('Select region (required)', 'Northern Region')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(addHolidayCalendar).toHaveBeenCalledWith(expect.objectContaining({
      region: 'NL|group:NL-NO', type: 'school_holiday',
    })))
  })

  it('FE-COMP-VCYSET-010: an existing school calendar is editable and removable', async () => {
    const updateHolidayCalendar = vi.fn(async (_id: number, _d: Record<string, unknown>) => {})
    const deleteHolidayCalendar = vi.fn(async (_id: number) => {})
    useVacayStore.setState({
      plan: buildPlan({
        school_holidays_enabled: true,
        holiday_calendars: [{ id: 8, plan_id: 1, region: 'NL|group:NL-MI', label: 'Midden', color: '#a5f3fc', sort_order: 0, type: 'school_holiday' }],
      }),
      updateHolidayCalendar,
      deleteHolidayCalendar,
    })
    const { container } = render(<VacaySettings onClose={vi.fn()} />)

    await pickLoadedOption('Central Region', 'Southern Region')
    expect(updateHolidayCalendar).toHaveBeenCalledWith(8, { region: 'NL|group:NL-ZU' })

    fireEvent.click(trashButtons(container)[0])
    expect(deleteHolidayCalendar).toHaveBeenCalledWith(8)
  })

  it('FE-COMP-VCYSET-011: the fused member chips list every person', () => {
    useVacayStore.setState({
      isFused: true,
      users: [{ id: 1, username: 'alice', color: '#3b82f6' }, { id: 2, username: 'bob', color: null }],
    })
    render(<VacaySettings onClose={vi.fn()} />)

    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('bob')).toBeInTheDocument()
  })

  it('FE-COMP-VCYSET-012: switching the leave-year type saves it and reveals its fields', () => {
    const updateYearSettings = vi.fn(async () => {})
    useVacayStore.setState({ updateYearSettings })
    render(<VacaySettings onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fiscal' }))
    expect(updateYearSettings).toHaveBeenCalledWith({
      year_type: 'fiscal', year_start_month: 1, year_start_day: 1, hire_date: null,
    })
  })

  it('FE-COMP-VCYSET-013: the fiscal month and day selects save, clamping February', () => {
    const updateYearSettings = vi.fn(async () => {})
    useVacayStore.setState({
      updateYearSettings,
      yearSettings: { year_type: 'fiscal', year_start_month: 1, year_start_day: 31, hire_date: null },
    })
    render(<VacaySettings onClose={vi.fn()} />)

    pickOption('January', 'February')
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'fiscal', year_start_month: 2, year_start_day: 28, hire_date: null,
    })

    pickOption('31', '15')
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'fiscal', year_start_month: 1, year_start_day: 15, hire_date: null,
    })
  })

  it('FE-COMP-VCYSET-014: the anniversary year takes its start from the hire date', () => {
    const updateYearSettings = vi.fn(async () => {})
    useVacayStore.setState({
      updateYearSettings,
      yearSettings: { year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: '2020-09-14' },
    })
    render(<VacaySettings onClose={vi.fn()} />)

    expect(screen.getByLabelText('Hire date')).toHaveValue('2020-09-14')

    fireEvent.change(screen.getByLabelText('Hire date'), { target: { value: '2021-03-02' } })
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: '2021-03-02',
    })

    fireEvent.change(screen.getByLabelText('Hire date'), { target: { value: '' } })
    expect(updateYearSettings).toHaveBeenLastCalledWith({
      year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: null,
    })
  })

  it('FE-COMP-VCYSET-015: the draft stays blocked while the region list is still loading', async () => {
    let release: (() => void) | undefined
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', async () => {
      await new Promise<void>(resolve => { release = resolve })
      return HttpResponse.json([
        { date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false, counties: ['DE-BY', 'DE-NW'] },
      ])
    }))
    useVacayStore.setState({ plan: buildPlan({ holidays_enabled: true }), addHolidayCalendar: vi.fn(async () => {}) })
    render(<VacaySettings onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add calendar' }))
    await pickLoadedOption('Select country', 'Germany')

    // An empty list means "no answer yet", not "this country needs no region" (#1813).
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-busy', 'true')

    await waitFor(() => expect(release).toBeDefined())
    release?.()

    await screen.findByRole('button', { name: 'Select region (required)' })
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-busy', 'false')

    await pickLoadedOption('Select region (required)', 'Bayern')
    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
  })

  it('FE-COMP-VCYSET-016: switching a calendar country drops the old region list at once', async () => {
    let releaseNl: (() => void) | undefined
    server.use(http.get('/api/addons/vacay/holidays/:year/:country', async ({ params }) => {
      if (params.country === 'NL') await new Promise<void>(resolve => { releaseNl = resolve })
      return HttpResponse.json([{
        date: '2026-11-01', name: 'All Saints', localName: 'Allerheiligen', global: false,
        counties: params.country === 'NL' ? ['NL-NH'] : ['DE-BY', 'DE-NW'],
      }])
    }))
    const updateHolidayCalendar = vi.fn(async (id: number, data: { region?: string }) => {
      const plan = useVacayStore.getState().plan
      if (!plan) return
      useVacayStore.setState({
        plan: { ...plan, holiday_calendars: (plan.holiday_calendars ?? []).map(c => (c.id === id ? { ...c, ...data } : c)) },
      })
    })
    useVacayStore.setState({
      plan: buildPlan({
        holidays_enabled: true,
        holiday_calendars: [{ id: 3, plan_id: 1, region: 'DE', label: null, color: '#fecaca', sort_order: 0 }],
      }),
      updateHolidayCalendar,
    })
    render(<VacaySettings onClose={vi.fn()} />)

    await screen.findByRole('button', { name: 'Select region (required)' })
    await pickLoadedOption('Germany', 'Netherlands')
    expect(updateHolidayCalendar).toHaveBeenLastCalledWith(3, { region: 'NL' })

    // The Dutch list is still on its way, so the German regions must be gone:
    // otherwise DE-BY can be saved for the Netherlands (#1813).
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Select region (required)' })).not.toBeInTheDocument())

    await waitFor(() => expect(releaseNl).toBeDefined())
    releaseNl?.()
    await screen.findByRole('button', { name: 'Select region (required)' })
  })
})
