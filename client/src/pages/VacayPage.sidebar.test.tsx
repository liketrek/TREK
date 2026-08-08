// FE-PAGE-VCY-001 to FE-PAGE-VCY-007
// Sidebar wiring VacayPage.test.tsx leaves open: year stepping inside the list,
// the shared/school legend rows and the drawer / modal dismissals.
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../tests/helpers/store'
import { useVacayStore } from '../store/vacayStore'
import VacayPage from './VacayPage'
import type { VacayPlan, SharedVacayCalendar } from '../types'

vi.mock('../components/Vacay/VacayCalendar', () => ({ default: () => <div data-testid="calendar" /> }))
vi.mock('../components/Vacay/VacayPersons', () => ({ default: () => <div data-testid="persons" /> }))
vi.mock('../components/Vacay/VacayStats', () => ({ default: () => <div data-testid="stats" /> }))
vi.mock('../components/Vacay/VacaySharedCalendars', () => ({ default: () => <div data-testid="shared" /> }))
vi.mock('../components/Vacay/VacaySettings', () => ({ default: () => <div data-testid="settings" /> }))
vi.mock('../api/websocket', () => ({ addListener: vi.fn(), removeListener: vi.fn() }))

function baseState(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    years: [2024, 2025, 2026],
    selectedYear: 2025,
    loading: false,
    incomingInvites: [],
    plan: null,
    sharedCalendars: [],
    loadAll: vi.fn(async () => {}),
    loadPlan: vi.fn(async () => {}),
    loadEntries: vi.fn(async () => {}),
    loadStats: vi.fn(async () => {}),
    loadHolidays: vi.fn(async () => {}),
    loadShares: vi.fn(async () => {}),
    loadSharedCalendars: vi.fn(async () => {}),
    setSelectedYear: vi.fn((_y: number) => undefined),
    addYear: vi.fn((_y: number) => undefined),
    removeYear: vi.fn(async (_y: number) => {}),
    ...over,
  }
}

function buildPlan(over: Partial<VacayPlan> = {}): VacayPlan {
  return {
    id: 1,
    holidays_enabled: false,
    school_holidays_enabled: false,
    holidays_region: null,
    holiday_calendars: [],
    block_weekends: false,
    carry_over_enabled: false,
    company_holidays_enabled: false,
    ...over,
  }
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useVacayStore, baseState())
})

/** Year card controls in DOM order: add-previous, prev, next, add-next. */
function yearCardButtons(): HTMLElement[] {
  const card = screen.getByText('Year').closest('.vg-card') as HTMLElement
  return within(card).getAllByRole('button')
}

describe('VacayPage sidebar', () => {
  it('FE-PAGE-VCY-001: the year chevrons step inside the existing list', () => {
    const setSelectedYear = vi.fn((_y: number) => undefined)
    seedStore(useVacayStore, baseState({ setSelectedYear }))
    render(<VacayPage />)

    const [, prev, next] = yearCardButtons()
    fireEvent.click(prev)
    expect(setSelectedYear).toHaveBeenLastCalledWith(2024)

    fireEvent.click(next)
    expect(setSelectedYear).toHaveBeenLastCalledWith(2026)
  })

  it('FE-PAGE-VCY-002: the chevrons are disabled at the ends of the list', () => {
    seedStore(useVacayStore, baseState({ years: [2025], selectedYear: 2025 }))
    render(<VacayPage />)

    const [, prev, next] = yearCardButtons()
    expect(prev).toBeDisabled()
    expect(next).toBeDisabled()
  })

  it('FE-PAGE-VCY-003: school-holiday calendars get their own legend swatch', async () => {
    seedStore(useVacayStore, baseState({
      plan: buildPlan({
        holidays_enabled: true,
        school_holidays_enabled: true,
        holiday_calendars: [
          { id: 1, plan_id: 1, region: 'DE', label: 'Feiertage', color: '#fecaca', sort_order: 0 },
          { id: 2, plan_id: 1, region: 'NL', label: 'Schoolvakantie', color: '#bbf7d0', sort_order: 1, type: 'school_holiday' },
        ],
      }),
    }))
    render(<VacayPage />)

    await waitFor(() => expect(screen.getAllByText('Feiertage')[0]).toBeInTheDocument())
    expect(screen.getAllByText('Schoolvakantie')[0]).toBeInTheDocument()
    // The generic "Public Holiday" swatch only appears without a configured calendar.
    expect(screen.queryByText('Public Holiday')).not.toBeInTheDocument()
  })

  it('FE-PAGE-VCY-004: a visible shared calendar adds the ring legend entry', async () => {
    const sharedCalendars: SharedVacayCalendar[] = [
      { share_id: 1, owner_id: 3, owner_name: 'carol', color: '#f59e0b', hidden: false, entries: [], companyHolidays: [] },
    ]
    seedStore(useVacayStore, baseState({ plan: buildPlan({ block_weekends: true }), sharedCalendars }))
    render(<VacayPage />)

    await waitFor(() => expect(screen.getAllByText('Shared (view only)')[0]).toBeInTheDocument())
    expect(screen.getAllByText('Weekend')[0]).toBeInTheDocument()
  })

  it('FE-PAGE-VCY-005: hidden shared calendars leave the legend out entirely', () => {
    const sharedCalendars: SharedVacayCalendar[] = [
      { share_id: 1, owner_id: 3, owner_name: 'carol', color: '#f59e0b', hidden: true, entries: [], companyHolidays: [] },
    ]
    seedStore(useVacayStore, baseState({ plan: buildPlan(), sharedCalendars }))
    render(<VacayPage />)

    expect(screen.queryByText('Legend')).not.toBeInTheDocument()
  })

  it('FE-PAGE-VCY-006: the mobile drawer opens from the filter button and closes on the backdrop', async () => {
    const { container } = render(<VacayPage />)

    const toggle = [...container.querySelectorAll('button')].find(b => b.className.includes('lg:hidden')) as HTMLElement
    fireEvent.click(toggle)

    const backdrop = await waitFor(() => document.body.querySelector('.absolute.inset-0') as HTMLElement)
    expect(screen.getAllByTestId('persons')).toHaveLength(2)

    fireEvent.click(backdrop)
    await waitFor(() => expect(screen.getAllByTestId('persons')).toHaveLength(1))
  })

  it('FE-PAGE-VCY-007: the settings modal closes through its own dismiss control', async () => {
    render(<VacayPage />)

    fireEvent.click(screen.getAllByRole('button', { name: /settings/i })[0])
    expect(await screen.findByTestId('settings')).toBeInTheDocument()

    const dialog = screen.getByTestId('settings').closest('div[class*="rounded"]') as HTMLElement
    fireEvent.click(within(dialog.parentElement as HTMLElement).getAllByRole('button')[0])
    await waitFor(() => expect(screen.queryByTestId('settings')).not.toBeInTheDocument())
  })

  it('FE-PAGE-VCY-007b: the compact header opens the settings modal too', async () => {
    const { container } = render(<VacayPage />)

    const header = container.querySelector('.lg\\:hidden.flex.items-center.justify-between') as HTMLElement
    fireEvent.click(within(header).getAllByRole('button')[1])
    expect(await screen.findByTestId('settings')).toBeInTheDocument()
  })

  it('FE-PAGE-VCY-008: the delete-year modal closes without removing the year', async () => {
    const removeYear = vi.fn(async (_y: number) => {})
    seedStore(useVacayStore, baseState({ removeYear }))
    const { container } = render(<VacayPage />)

    fireEvent.click(container.querySelector('.bg-red-500') as HTMLElement)
    expect(await screen.findByText(/Remove 2024\?|Remove 2025\?|Remove 2026\?/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument())
    expect(removeYear).not.toHaveBeenCalled()
  })

  it('FE-PAGE-VCY-009: Escape dismisses the delete-year modal as well', async () => {
    const { container } = render(<VacayPage />)

    fireEvent.click(container.querySelector('.bg-red-500') as HTMLElement)
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument())
  })
})
