import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../tests/helpers/render'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import VacayStats from './VacayStats'

const buildStat = (overrides: Record<string, unknown> = {}) => ({
  user_id: 1,
  person_name: 'Alice',
  person_color: '#6366f1',
  vacation_days: 25,
  used: 10,
  remaining: 15,
  carried_over: 0,
  total_available: 25,
  ...overrides,
})

const mockLoadStats = vi.fn().mockResolvedValue(undefined)
const mockUpdateVacationDays = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useVacayStore, {
    stats: [],
    selectedYear: 2025,
    isFused: false,
    loadStats: mockLoadStats,
    updateVacationDays: mockUpdateVacationDays,
  })
})

describe('VacayStats — folding the sidebar card', () => {
  beforeEach(() => localStorage.clear())

  it('FE-COMP-VACAYSTATS-030: starts expanded and folds the stat cards away on click', async () => {
    const user = userEvent.setup()
    seedStore(useVacayStore, { stats: [buildStat()] })

    render(<VacayStats />)
    expect(screen.getByText('Alice')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { expanded: true }))

    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    // The heading stays, so the card can be opened again.
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-031: remembers the folded state across reloads', async () => {
    const user = userEvent.setup()
    seedStore(useVacayStore, { stats: [buildStat()] })

    const { unmount } = render(<VacayStats />)
    await user.click(screen.getByRole('button', { expanded: true }))
    unmount()

    render(<VacayStats />)
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-032: reopens and persists that too', async () => {
    const user = userEvent.setup()
    localStorage.setItem('vacay-stats-collapsed', '1')
    seedStore(useVacayStore, { stats: [buildStat()] })

    const { unmount } = render(<VacayStats />)
    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText('Alice')).toBeInTheDocument()
    unmount()

    render(<VacayStats />)
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
  })
})

describe('VacayStats — comp days (#1074) and the leave-year window (#737)', () => {
  it('FE-COMP-VACAYSTATS-020: shows a comp/flex badge when comp days were logged', () => {
    seedStore(useVacayStore, { stats: [buildStat({ comp_used: 2 })] })

    render(<VacayStats />)

    expect(screen.getByText('2 comp / flex')).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-021: renders a fractional comp total with one decimal', () => {
    seedStore(useVacayStore, { stats: [buildStat({ comp_used: 1.5 })] })

    render(<VacayStats />)

    expect(screen.getByText('1.5 comp / flex')).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-022: hides the badge when no comp days were logged', () => {
    seedStore(useVacayStore, { stats: [buildStat({ comp_used: 0 })] })

    render(<VacayStats />)

    expect(screen.queryByText(/comp \/ flex/)).not.toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-023: names the carry-over source by year on a calendar leave year', () => {
    seedStore(useVacayStore, { stats: [buildStat({ carried_over: 3 })], selectedYear: 2025 })

    render(<VacayStats />)

    expect(screen.getByText('+3 from 2024')).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-024: says "previous period" instead once the leave year is shifted', () => {
    seedStore(useVacayStore, {
      stats: [buildStat({ carried_over: 3 })],
      selectedYear: 2026,
      yearSettings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null },
    })

    render(<VacayStats />)

    expect(screen.getByText('+3 from previous period')).toBeInTheDocument()
    expect(screen.queryByText('+3 from 2025')).not.toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-025: spells the active window out under the heading when it is shifted', () => {
    seedStore(useVacayStore, {
      stats: [buildStat()],
      selectedYear: 2026,
      yearSettings: { year_type: 'fiscal', year_start_month: 7, year_start_day: 1, hire_date: null },
    })

    render(<VacayStats />)

    expect(screen.getByText(/Jul 2026\s*–\s*Jun 2027/)).toBeInTheDocument()
  })
})

describe('VacayStats', () => {
  it('FE-COMP-VACAYSTATS-001: Shows empty state when no stats', () => {
    render(<VacayStats />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-002: Calls loadStats on mount', () => {
    render(<VacayStats />)
    expect(mockLoadStats).toHaveBeenCalledWith(2025)
  })

  it('FE-COMP-VACAYSTATS-003: Renders stat card with username and values', () => {
    seedStore(useVacayStore, { stats: [buildStat()] })
    render(<VacayStats />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    // used tile shows "10", remaining tile shows "15", vacation_days tile shows "25"
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1)
  })

  it('FE-COMP-VACAYSTATS-004: Current user stat shows "(you)" label', () => {
    seedStore(useAuthStore, { user: { id: 1 } })
    seedStore(useVacayStore, { stats: [buildStat({ user_id: 1 })] })
    render(<VacayStats />)
    expect(screen.getByText(/^you$/i)).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-005: Remaining shown in green when > 3', () => {
    // used:5 so fraction is "5/20", remaining:10 is unique
    seedStore(useVacayStore, {
      stats: [buildStat({ remaining: 10, used: 5, vacation_days: 20, total_available: 20 })],
    })
    render(<VacayStats />)
    expect(screen.getByText('10')).toHaveStyle({ color: '#22c55e' })
  })

  it('FE-COMP-VACAYSTATS-006: Remaining shown in amber when 1–3', () => {
    // used:3, vacation_days:5 so remaining:2 is unique
    seedStore(useVacayStore, {
      stats: [buildStat({ remaining: 2, used: 3, vacation_days: 5, total_available: 5 })],
    })
    render(<VacayStats />)
    expect(screen.getByText('2')).toHaveStyle({ color: '#f59e0b' })
  })

  it('FE-COMP-VACAYSTATS-007: Remaining shown in red when negative', () => {
    seedStore(useVacayStore, {
      stats: [buildStat({ remaining: -3, used: 28, vacation_days: 25, total_available: 25 })],
    })
    render(<VacayStats />)
    expect(screen.getByText('-3')).toHaveStyle({ color: '#ef4444' })
  })

  it('FE-COMP-VACAYSTATS-008: Clicking entitlement tile opens inline editor', async () => {
    const user = userEvent.setup()
    seedStore(useAuthStore, { user: { id: 1 } })
    seedStore(useVacayStore, { stats: [buildStat({ user_id: 1 })] })
    render(<VacayStats />)
    // The vacation_days tile shows "25" as a standalone div; click it to trigger edit
    await user.click(screen.getByText('25'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-009: Pressing Enter in editor calls updateVacationDays', async () => {
    const user = userEvent.setup()
    seedStore(useAuthStore, { user: { id: 1 } })
    seedStore(useVacayStore, { stats: [buildStat({ user_id: 1 })] })
    render(<VacayStats />)
    await user.click(screen.getByText('25'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '30')
    await user.keyboard('{Enter}')
    expect(mockUpdateVacationDays).toHaveBeenCalledWith(2025, 30, 1)
  })

  it('FE-COMP-VACAYSTATS-010: Pressing Escape cancels edit without saving', async () => {
    const user = userEvent.setup()
    seedStore(useAuthStore, { user: { id: 1 } })
    seedStore(useVacayStore, { stats: [buildStat({ user_id: 1 })] })
    render(<VacayStats />)
    await user.click(screen.getByText('25'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '99')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(mockUpdateVacationDays).not.toHaveBeenCalled()
  })

  it('FE-COMP-VACAYSTATS-011: Carry-over badge shown when carried_over > 0', () => {
    seedStore(useVacayStore, {
      stats: [buildStat({ carried_over: 5 })],
      selectedYear: 2025,
    })
    render(<VacayStats />)
    // Renders "+5 from 2024"
    expect(screen.getByText(/\+5/)).toBeInTheDocument()
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('FE-COMP-VACAYSTATS-012: Non-owner can edit when isFused is true', async () => {
    const user = userEvent.setup()
    // current user is id:2, stat belongs to id:1 — but isFused=true grants canEdit
    seedStore(useAuthStore, { user: { id: 2 } })
    seedStore(useVacayStore, {
      stats: [buildStat({ user_id: 1 })],
      isFused: true,
    })
    render(<VacayStats />)
    await user.click(screen.getByText('25'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
