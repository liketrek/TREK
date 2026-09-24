import { beforeEach, describe, expect, it, vi } from 'vitest'
import MDaysSheet from '../../../../src/mobile/screens/trip/sheets/MDaysSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { Day } from '../../../../src/types'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { cleanup, fireEvent, render, screen } from '../../../helpers/render'

// FE-MOB-DAYSS-001 to FE-MOB-DAYSS-020
//
// The sheet reads its copy from the real TranslationProvider (useTranslation),
// not from planner.t — assertions therefore go against the English strings.

// Deliberately unsorted: the sheet orders by day_number.
const DAYS = [
  { id: 3, trip_id: 1, day_number: 3, date: '2026-05-03', title: null },
  { id: 1, trip_id: 1, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 1, day_number: 2, date: '2026-05-02', title: 'Old Town' },
] as unknown as Day[]

function renderSheet(plannerOverrides: Partial<TripPlanner> = {}, shellOverrides: Partial<MTripShellApi> = {}) {
  const planner = buildPlanner({ days: DAYS, ...plannerOverrides })
  const shell = buildShell({ sheet: { id: 'days' }, ...shellOverrides })
  render(<MDaysSheet planner={planner} shell={shell} />)
  return { planner, shell }
}

describe('MDaysSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-DAYSS-001: stays closed while another sheet id is active', () => {
    renderSheet({}, { sheet: { id: 'mehr' } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-002: stays closed when no sheet is open at all', () => {
    renderSheet({}, { sheet: null })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-003: renders the reorder header with its hint', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Reorder days' })).toBeInTheDocument()
    expect(screen.getByText("A day's places, notes and bookings move with it.")).toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-003b: the hint wraps instead of being cut off mid-sentence', () => {
    // The shared header truncates its subtitle to one line, which is right for a
    // filename but cut this sentence off in every language (#1814).
    renderSheet()
    const hint = screen.getByText("A day's places, notes and bookings move with it.")
    expect(hint).not.toHaveClass('truncate')
  })

  it('FE-MOB-DAYSS-004: lists the days in day_number order and numbers the rows', () => {
    renderSheet()
    const positions = screen.getAllByText(/^[123]$/).map(el => el.textContent)
    expect(positions).toEqual(['1', '2', '3'])
    const labels = ['Fri, May 1', 'Old Town', 'Sun, May 3']
    for (const label of labels) expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-005: falls back to "Day n" when neither title nor a usable date exists', () => {
    const days = [
      { id: 7, trip_id: 1, day_number: 1, date: null, title: null },
      { id: 8, trip_id: 1, day_number: 2, date: 'not-a-date', title: '' },
    ] as unknown as Day[]
    renderSheet({ days })
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-006: numbers a day without day_number by its list position', () => {
    const days = [{ id: 9, trip_id: 1, day_number: null, date: null, title: null }] as unknown as Day[]
    renderSheet({ days })
    expect(screen.getByText('Day 1')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-007: moving a day up sends the whole reordered id list', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getAllByRole('button', { name: 'Move up' })[1])
    expect(planner.handleReorderDays).toHaveBeenCalledWith([2, 1, 3])
  })

  it('FE-MOB-DAYSS-008: moving a day down sends the whole reordered id list', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0])
    expect(planner.handleReorderDays).toHaveBeenCalledWith([2, 1, 3])
  })

  it('FE-MOB-DAYSS-009: disables the moves that would leave the list', () => {
    renderSheet()
    const up = screen.getAllByRole('button', { name: 'Move up' })
    const down = screen.getAllByRole('button', { name: 'Move down' })
    expect(up[0]).toBeDisabled()
    expect(up[2]).toBeEnabled()
    expect(down[2]).toBeDisabled()
    expect(down[0]).toBeEnabled()
  })

  it('FE-MOB-DAYSS-010: appends a day', () => {
    const { planner } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Add day' }))
    expect(planner.handleAddDay).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-DAYSS-011: hides every edit affordance for a read-only member', () => {
    const { planner } = renderSheet({ can: vi.fn(() => false) })
    expect(planner.can).toHaveBeenCalledWith('day_edit', planner.trip)
    expect(screen.queryByRole('button', { name: 'Move up' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add day' })).not.toBeInTheDocument()
    // The list itself stays readable.
    expect(screen.getByText('Old Town')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-012: the header close button closes the sheet', () => {
    const { shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-DAYSS-013: each row asks the planner to delete its own day', () => {
    const { planner } = renderSheet()
    const buttons = screen.getAllByRole('button', { name: 'Delete day' })
    expect(buttons).toHaveLength(3)
    // Rows run in day_number order: the second one is day 2.
    fireEvent.click(buttons[1])
    expect(planner.handleDeleteDay).toHaveBeenCalledWith(2)
  })

  it('FE-MOB-DAYSS-014: a read-only member gets no delete buttons', () => {
    renderSheet({ can: vi.fn(() => false) })
    expect(screen.queryByRole('button', { name: 'Delete day' })).not.toBeInTheDocument()
  })

  it('FE-MOB-DAYSS-015: while the planner blocks deleting, the buttons are off and the sheet says why', () => {
    const { planner } = renderSheet({ deleteDayBlocked: 'A trip needs at least one day' })
    const buttons = screen.getAllByRole('button', { name: 'Delete day' })
    expect(buttons.every(b => (b as HTMLButtonElement).disabled)).toBe(true)
    fireEvent.click(buttons[0])
    expect(planner.handleDeleteDay).not.toHaveBeenCalled()
    expect(screen.getByText('A trip needs at least one day')).toBeInTheDocument()
  })

  describe('adding a day on a trip with dates', () => {
    const dayAdd = (overrides: Partial<TripPlanner['dayAdd']> = {}): TripPlanner['dayAdd'] => ({
      nextDate: '2026-10-13', blocked: null, datedBlocked: null, busy: false, onAddDated: vi.fn(), ...overrides,
    })
    const datedButton = () => screen.getByRole('button', { name: /^Add .*Oct 13/ })
    const undatedButton = () => screen.getByRole('button', { name: 'Without date' })

    it('FE-MOB-DAYSS-016: two buttons, the next date and a day without one, under a line saying what the dated one does', () => {
      const { planner } = renderSheet({ dayAdd: dayAdd() })
      // The date reads as in the day list: weekday, day and month, no year.
      expect(screen.getByText(/^Adds .*Oct 13 and extends the trip by one day\.$/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Add day' })).not.toBeInTheDocument()

      fireEvent.click(datedButton())
      expect(planner.dayAdd.onAddDated).toHaveBeenCalledTimes(1)
      expect(planner.handleAddDay).not.toHaveBeenCalled()
      fireEvent.click(undatedButton())
      expect(planner.handleAddDay).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-DAYSS-017: a read-only member gets neither button', () => {
      renderSheet({ can: vi.fn(() => false), dayAdd: dayAdd() })
      expect(screen.queryByRole('button', { name: /^Add/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Without date' })).not.toBeInTheDocument()
    })

    it('FE-MOB-DAYSS-018: busy or offline turns both off, and the offline sentence is said once', () => {
      renderSheet({ dayAdd: dayAdd({ busy: true }) })
      expect(datedButton()).toBeDisabled()
      expect(undatedButton()).toBeDisabled()
      cleanup()

      const offline = 'Changing days needs a connection'
      renderSheet({ deleteDayBlocked: offline, dayAdd: dayAdd({ blocked: offline }) })
      expect(datedButton()).toBeDisabled()
      expect(undatedButton()).toBeDisabled()
      expect(screen.getAllByText(offline)).toHaveLength(1)
      // The offline sentence stands in for the dated line, not beside it.
      expect(screen.queryByText(/and extends the trip by one day/)).not.toBeInTheDocument()
    })

    it('FE-MOB-DAYSS-019: a trip at the day limit keeps the undated button and says why the dated one is off', () => {
      renderSheet({ dayAdd: dayAdd({ datedBlocked: 'A trip can span at most 999 days' }) })
      expect(datedButton()).toBeDisabled()
      expect(screen.getByText('A trip can span at most 999 days')).toBeInTheDocument()
      expect(undatedButton()).toBeEnabled()
    })

    it('FE-MOB-DAYSS-020: the add buttons stay in reach below the list, which scrolls on its own', () => {
      renderSheet({ dayAdd: dayAdd() })
      const list = screen.getByText('Old Town').closest('.overflow-y-auto')
      expect(list).not.toBeNull()
      expect(list).not.toContainElement(datedButton())
      expect(list).not.toContainElement(undatedButton())
      // One tap size for both, and a label that never wraps inside its button.
      for (const button of [datedButton(), undatedButton()]) {
        expect(button).toHaveClass('h-11')
        expect(button).toHaveClass('whitespace-nowrap')
      }
    })
  })
})
