// FE-COMP-VCYCAL-001 to FE-COMP-VCYCAL-010
// Covers what the mocked month card in VacayCalendar.test.tsx cannot reach: the
// trip overlay, the per-day maps handed down to the cards, and the hover tooltip.
import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import { resetAllStores } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import VacayCalendar from './VacayCalendar'
import type { HolidaysMap, VacayEntry, VacayPlan } from '../../types'

interface MonthCardStubProps {
  month: number
  entryMap: Record<string, VacayEntry[]>
  sharedMap?: Record<string, { color: string }[]>
  companyHolidaySet: Set<string>
  tripDates?: Set<string>
  onCellClick: (date: string) => void
  onCellHover?: (date: string | null, el: HTMLElement | null) => void
}

vi.mock('./VacayMonthCard', () => ({
  default: ({ month, entryMap, sharedMap, companyHolidaySet, tripDates, onCellClick, onCellHover }: MonthCardStubProps) => (
    <div
      data-testid={`card-${month}`}
      data-entries={JSON.stringify(entryMap)}
      data-shared={JSON.stringify(sharedMap)}
      data-company={JSON.stringify([...companyHolidaySet])}
      data-trips={JSON.stringify([...(tripDates ?? [])].sort())}
    >
      <button type="button" onClick={() => onCellClick(`2026-${String(month + 1).padStart(2, '0')}-13`)}>sat-{month}</button>
      <button type="button" onClick={() => onCellClick(`2026-${String(month + 1).padStart(2, '0')}-15`)}>mon-{month}</button>
      <button type="button" onClick={() => onCellClick('2026-12-24')}>company-{month}</button>
      <button type="button" onClick={e => onCellHover?.('2026-06-15', e.currentTarget)}>hover-{month}</button>
      <button type="button" onClick={() => onCellHover?.(null, null)}>unhover-{month}</button>
    </div>
  ),
}))

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
  }
}

function tripsRespond(trips: { start_date?: string | null; end_date?: string | null }[]) {
  server.use(http.get('/api/trips', () => HttpResponse.json({ trips })))
}

const schoolHolidays: HolidaysMap = {
  '2026-06-15': [
    { name: 'Sommerferien', localName: 'Sommerferien', color: '#bbf7d0', label: 'NRW', type: 'school_holiday' },
    { name: 'Christmas', localName: 'Weihnachten', color: '#fecaca', label: null, type: 'public_holiday' },
  ],
}

beforeEach(() => {
  resetAllStores()
  tripsRespond([])
  useVacayStore.setState({ selectedYear: 2026, plan: buildPlan() })
})

/** Reads a JSON prop off the first stubbed month card. */
function cardProp(name: string): unknown {
  return JSON.parse(screen.getByTestId('card-0').getAttribute(name) as string)
}

describe('VacayCalendar overlays', () => {
  it('FE-COMP-VCYCAL-001: collects trip days inside the window and skips open-ended trips', async () => {
    tripsRespond([
      { start_date: '2026-03-30', end_date: '2026-04-01' },
      { start_date: '2026-05-01', end_date: null },
      { start_date: '2025-12-31', end_date: '2025-12-31' },
    ])
    render(<VacayCalendar />)

    await waitFor(() => expect(cardProp('data-trips')).toEqual(['2026-03-30', '2026-03-31', '2026-04-01']))
  })

  it('FE-COMP-VCYCAL-002: a failing trip list leaves the overlay empty', async () => {
    server.use(http.get('/api/trips', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    render(<VacayCalendar />)

    await waitFor(() => expect(cardProp('data-trips')).toEqual([]))
  })

  it('FE-COMP-VCYCAL-003: groups entries and company holidays per day for the cards', () => {
    useVacayStore.setState({
      entries: [
        { date: '2026-06-15', user_id: 1, person_name: 'alice', person_color: '#3b82f6' },
        { date: '2026-06-15', user_id: 2, person_name: 'bob', person_color: '#ec4899', fraction: 0.5 },
        { date: '2026-06-16', user_id: 1 },
      ],
      companyHolidays: [{ date: '2026-12-24' }, { date: '2026-12-31' }],
    })
    render(<VacayCalendar />)

    const entryMap = cardProp('data-entries') as Record<string, VacayEntry[]>
    expect(entryMap['2026-06-15']).toHaveLength(2)
    expect(entryMap['2026-06-16']).toHaveLength(1)
    expect(cardProp('data-company')).toEqual(['2026-12-24', '2026-12-31'])
  })

  it('FE-COMP-VCYCAL-004: visible shared calendars contribute entries and company days as rings', () => {
    useVacayStore.setState({
      sharedCalendars: [
        {
          share_id: 1, owner_id: 3, owner_name: 'carol', color: '#f59e0b', hidden: false,
          entries: [{ date: '2026-06-15', fraction: 0.5, kind: 'comp' }],
          companyHolidays: [{ date: '2026-12-24' }],
        },
        {
          share_id: 2, owner_id: 4, owner_name: 'dan', color: '#10b981', hidden: true,
          entries: [{ date: '2026-06-16' }], companyHolidays: [],
        },
      ],
    })
    render(<VacayCalendar />)

    const sharedMap = cardProp('data-shared') as Record<string, { color: string; name: string; company?: boolean }[]>
    expect(sharedMap['2026-06-15']).toEqual([{ color: '#f59e0b', name: 'carol', fraction: 0.5, kind: 'comp' }])
    expect(sharedMap['2026-12-24']).toEqual([{ color: '#f59e0b', name: 'carol', company: true }])
    expect(sharedMap['2026-06-16']).toBeUndefined()
  })

  it('FE-COMP-VCYCAL-005: blocked weekends and company days swallow the click', async () => {
    const toggleEntry = vi.fn(async (_d: string, _u?: number, _f?: 0.5 | 1, _k?: 'vacation' | 'comp') => {})
    useVacayStore.setState({ toggleEntry, companyHolidays: [{ date: '2026-12-24' }], selectedUserId: 7 })
    render(<VacayCalendar />)

    // 2026-06-13 is a Saturday, and 2026-12-24 is a company holiday.
    fireEvent.click(screen.getByText('sat-5'))
    fireEvent.click(screen.getByText('company-5'))
    expect(toggleEntry).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('mon-5'))
    await waitFor(() => expect(toggleEntry).toHaveBeenCalledWith('2026-06-15', 7, 1, 'vacation'))
  })

  it('FE-COMP-VCYCAL-006: the toolbar modifiers are applied to the logged day', async () => {
    const toggleEntry = vi.fn(async (_d: string, _u?: number, _f?: 0.5 | 1, _k?: 'vacation' | 'comp') => {})
    useVacayStore.setState({ toggleEntry, plan: buildPlan({ block_weekends: false }) })
    render(<VacayCalendar />)

    fireEvent.click(screen.getByRole('button', { name: 'Comp / Flex' }))
    fireEvent.click(screen.getByRole('button', { name: 'Half day' }))
    fireEvent.click(screen.getByText('mon-5'))

    await waitFor(() => expect(toggleEntry).toHaveBeenCalledWith('2026-06-15', undefined, 0.5, 'comp'))
  })

  it('FE-COMP-VCYCAL-007: company mode toggles a company day, and does nothing while disabled', async () => {
    const toggleCompanyHoliday = vi.fn(async (_date: string) => {})
    useVacayStore.setState({ toggleCompanyHoliday, plan: buildPlan({ company_holidays_enabled: false }) })
    const { rerender } = render(<VacayCalendar />)

    // Without company holidays the mode button is not offered at all.
    expect(screen.queryByRole('button', { name: 'Company Holiday' })).not.toBeInTheDocument()

    useVacayStore.setState({ plan: buildPlan({ company_holidays_enabled: true }) })
    rerender(<VacayCalendar />)
    fireEvent.click(screen.getByRole('button', { name: 'Company Holiday' }))
    fireEvent.click(screen.getByText('company-5'))

    await waitFor(() => expect(toggleCompanyHoliday).toHaveBeenCalledWith('2026-12-24'))
  })

  it('FE-COMP-VCYCAL-007b: company mode left over from an enabled plan stops logging', async () => {
    const toggleCompanyHoliday = vi.fn(async (_date: string) => {})
    useVacayStore.setState({ toggleCompanyHoliday })
    const { rerender } = render(<VacayCalendar />)

    fireEvent.click(screen.getByRole('button', { name: 'Company Holiday' }))
    useVacayStore.setState({ plan: buildPlan({ company_holidays_enabled: false }) })
    rerender(<VacayCalendar />)

    fireEvent.click(screen.getByText('company-5'))
    expect(toggleCompanyHoliday).not.toHaveBeenCalled()
  })

  it('FE-COMP-VCYCAL-007c: the toolbar switches back to logging the selected person', () => {
    render(<VacayCalendar />)

    fireEvent.click(screen.getByRole('button', { name: 'Company Holiday' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vacation' }))
    // Back in vacation mode the person button is the active one.
    expect(screen.getByRole('button', { name: 'Vacation' }).style.background).toBe('var(--vg-ink)')
  })

  it('FE-COMP-VCYCAL-008: hovering a logged day explains who is off and how much', () => {
    useVacayStore.setState({
      entries: [
        { date: '2026-06-15', user_id: 1, person_name: 'alice', person_color: '#3b82f6' },
        { date: '2026-06-15', user_id: 2, person_name: 'bob', person_color: '#ec4899', fraction: 0.5 },
        { date: '2026-06-15', user_id: 3, person_name: 'carol', person_color: '#10b981', kind: 'comp' },
        { date: '2026-06-15', user_id: 4, person_name: 'dan', person_color: '#f59e0b', fraction: 0.5, kind: 'comp' },
      ],
    })
    render(<VacayCalendar />)

    fireEvent.click(screen.getByText('hover-5'))
    const tip = screen.getByText('alice').closest('.vg-card') as HTMLElement

    expect(within(tip).getByText('Full day')).toBeInTheDocument()
    expect(within(tip).getByText('Half day')).toBeInTheDocument()
    expect(within(tip).getByText('Comp / Flex')).toBeInTheDocument()
    expect(within(tip).getByText('Half comp day')).toBeInTheDocument()

    fireEvent.click(screen.getByText('unhover-5'))
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
  })

  it('FE-COMP-VCYCAL-009: the tooltip lists shared calendars as their own rows', () => {
    useVacayStore.setState({
      sharedCalendars: [{
        share_id: 1, owner_id: 3, owner_name: 'carol', color: '#f59e0b', hidden: false,
        entries: [{ date: '2026-06-15', fraction: 0.5 }],
        companyHolidays: [{ date: '2026-06-15' }],
      }],
    })
    render(<VacayCalendar />)

    fireEvent.click(screen.getByText('hover-5'))
    const tip = screen.getAllByText('carol')[0].closest('.vg-card') as HTMLElement

    expect(within(tip).getByText('Half day')).toBeInTheDocument()
    expect(within(tip).getByText('Company Holiday')).toBeInTheDocument()
  })

  it('FE-COMP-VCYCAL-010: school breaks are folded into the tooltip under a heading', () => {
    useVacayStore.setState({
      holidays: schoolHolidays,
      entries: [{ date: '2026-06-15', user_id: 1, person_name: 'alice', person_color: '#3b82f6' }],
    })
    render(<VacayCalendar />)

    fireEvent.click(screen.getByText('hover-5'))
    const tip = screen.getByText('alice').closest('.vg-card') as HTMLElement

    expect(within(tip).getByText('School Holidays')).toBeInTheDocument()
    expect(within(tip).getByText('NRW: Sommerferien')).toBeInTheDocument()
    // The public-holiday marker on the same day is not part of the school block.
    expect(within(tip).queryByText('Weihnachten')).not.toBeInTheDocument()
  })

  it('FE-COMP-VCYCAL-011: a single unlabelled school marker still renders its local name', () => {
    useVacayStore.setState({
      holidays: {
        '2026-06-15': { name: 'Herfstvakantie', localName: 'Herfstvakantie', color: '#bbf7d0', label: null, type: 'school_holiday' },
      },
    })
    render(<VacayCalendar />)

    fireEvent.click(screen.getByText('hover-5'))
    expect(screen.getByText('Herfstvakantie')).toBeInTheDocument()
    expect(screen.getByText('School Holidays')).toBeInTheDocument()
  })

  it('FE-COMP-VCYCAL-012: a day with nothing to explain shows no tooltip', () => {
    render(<VacayCalendar />)

    fireEvent.click(screen.getByText('hover-5'))
    expect(screen.queryByText('School Holidays')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.vg-card.rounded-xl')).toHaveLength(0)
  })
})
