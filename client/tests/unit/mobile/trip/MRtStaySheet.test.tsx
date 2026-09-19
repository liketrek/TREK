import { beforeEach, describe, expect, it, vi } from 'vitest'
import MRtStaySheet from '../../../../src/mobile/screens/trip/roadtrip/MRtStaySheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import type { RoadtripDay } from '@trek/shared/roadtrip'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-RTSTAY-001 to FE-MOB-RTSTAY-018
//
// The sheet renders inside the real TranslationProvider, so the copy is asserted
// in English.

/** Arrives late in the evening, so a long stay has to carry into the next day. */
const STAGE = {
  dayId: 11,
  dayNumber: 1,
  date: '2026-05-01',
  title: null,
  stops: [
    { assignmentId: 101, ownerDayId: 11, ownerIndex: 0, placeId: 201, name: 'Hamburg Hafen', lat: 53.54, lng: 9.98, time: null, dwellMinutes: 30, legMode: null, incomingLegMode: null, stopType: null },
    { assignmentId: 102, ownerDayId: 11, ownerIndex: 1, placeId: 202, name: 'Bremen Marktplatz', lat: 53.07, lng: 8.8, time: null, dwellMinutes: 30, legMode: null, incomingLegMode: null, stopType: null },
  ],
  legs: [undefined, undefined],
  legVias: [[], []],
  geometry: [],
  distance: 0,
  duration: 0,
  dayWarning: null,
  schedule: {
    entries: [
      { arrival: '09:15', departure: '09:45', anchored: false, dayOffset: 0 },
      { arrival: '22:30', departure: '23:00', anchored: false, dayOffset: 0 },
    ],
    warnings: [],
  },
  driveWarnings: [],
} as unknown as RoadtripDay

function makePlanner(overrides: Record<string, unknown> = {}) {
  return buildPlanner({
    tripId: 4,
    selectedDayId: 11,
    roadtripRoutes: { days: [STAGE] },
    setRoadtripStay: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Partial<TripPlanner>)
}

function makeShell(overrides: Record<string, unknown> = {}) {
  return buildShell({
    sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 30, name: 'Bremen Marktplatz', dayId: 11, assignmentId: 102 } },
    ...overrides,
  } as unknown as Partial<MTripShellApi>)
}

function renderSheet(plannerOverrides: Record<string, unknown> = {}, shellOverrides: Record<string, unknown> = {}) {
  const planner = makePlanner(plannerOverrides)
  const shell = makeShell(shellOverrides)
  render(<MRtStaySheet planner={planner} shell={shell} />)
  return { planner, shell }
}

const minus = () => screen.getByRole('button', { name: '5 minutes less' })
const plus = () => screen.getByRole('button', { name: '5 minutes more' })
const value = () => screen.getByText('Minutes').previousElementSibling

describe('MRtStaySheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-RTSTAY-001: stays closed while another sheet id is active', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { placeId: 202, minutes: 30 } } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-002: opens on the stay the place carries, named and scoped', () => {
    renderSheet()
    expect(screen.getByRole('dialog', { name: 'Add a stay' })).toBeInTheDocument()
    expect(screen.getByText('Bremen Marktplatz')).toBeInTheDocument()
    expect(screen.getByText('The stay belongs to the place, so it counts on every day this stop is planned.')).toBeInTheDocument()
    expect(value()).toHaveTextContent('30')
  })

  it('FE-MOB-RTSTAY-003: plus and minus move the value in five-minute steps', () => {
    renderSheet()
    fireEvent.click(plus())
    expect(value()).toHaveTextContent('35')
    fireEvent.click(plus())
    expect(value()).toHaveTextContent('40')
    fireEvent.click(minus())
    expect(value()).toHaveTextContent('35')
  })

  it('FE-MOB-RTSTAY-004: minus stops at zero instead of going negative', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 3, name: 'Bremen Marktplatz', dayId: 11, assignmentId: 102 } } })
    fireEvent.click(minus())
    expect(value()).toHaveTextContent('0')
    expect(minus()).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-005: plus stops at a full day', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 1438, name: 'Bremen Marktplatz' } } })
    fireEvent.click(plus())
    expect(value()).toHaveTextContent('1440')
    expect(plus()).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-006: a preset sets the value outright rather than adding to it', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: '2 h' }))
    expect(value()).toHaveTextContent('120')
    fireEvent.click(screen.getByRole('button', { name: '45 min' }))
    expect(value()).toHaveTextContent('45')
  })

  it('FE-MOB-RTSTAY-007: previews the new departure as arrival plus the stay', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 201, minutes: 30, name: 'Hamburg Hafen' } } })
    expect(screen.getByText('09:15')).toBeInTheDocument()
    expect(screen.getByText('09:45')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '1 h' }))
    expect(screen.getByText('10:15')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-008: carries the preview into the next day when the stay runs past midnight', () => {
    renderSheet()
    // Arrives 22:30; two hours of it land at 00:30 the following day.
    fireEvent.click(screen.getByRole('button', { name: '2 h' }))
    expect(screen.getByText('00:30')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Next day')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-009: no carry mark while the departure stays on the same day', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: '30 min' }))
    expect(screen.getByText('23:00')).toBeInTheDocument()
    expect(screen.queryByText('+1')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-010: reads the preview clocks in the 12h setting', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, time_format: '12h' } })
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 201, minutes: 30, name: 'Hamburg Hafen' } } })
    expect(screen.getByText('9:15 AM')).toBeInTheDocument()
    expect(screen.getByText('9:45 AM')).toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-011: drops the preview when the stop is not on the stage', () => {
    renderSheet({ selectedDayId: 99 })
    expect(screen.queryByText('Arrive')).not.toBeInTheDocument()
    expect(screen.queryByText('Leave')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTSTAY-012: saving writes the place and the minutes, then hands back to the stop', async () => {
    const { planner, shell } = renderSheet()
    fireEvent.click(plus())
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.setRoadtripStay).toHaveBeenCalledWith(202, 35))
    // Addressed by day and assignment, which is how 'rtstop' locates a row. Spreading this
    // sheet's own payload left it unable to resolve anything, so it drew nothing while still
    // counting as open, and the day swipe stayed blocked behind it.
    expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 11, assignmentId: 102 })
  })

  it('FE-MOB-RTSTAY-019: with no row to go back to it closes rather than opening a sheet that resolves to nothing', async () => {
    // Every caller sends the row, but a payload without one must not leave `shell.sheet`
    // pointing at a stop sheet that cannot locate anything: it would draw nothing and still
    // count as open, and the day swipe reads exactly that to decide it is blocked.
    const { planner, shell } = renderSheet({}, {
      sheet: { id: 'rtstay', payload: { placeId: 202, minutes: 30, name: 'Bremen Marktplatz' } },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(planner.setRoadtripStay).toHaveBeenCalledWith(202, 30))
    expect(shell.closeSheet).toHaveBeenCalled()
    expect(shell.openSheet).not.toHaveBeenCalledWith('rtstop', expect.anything())
  })

  it('FE-MOB-RTSTAY-013: clearing the stay is a save of zero, not a second write path', async () => {
    const { planner, shell } = renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'No stay' }))
    expect(planner.setRoadtripStay).not.toHaveBeenCalled()
    expect(value()).toHaveTextContent('0')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.setRoadtripStay).toHaveBeenCalledWith(202, 0))
    expect(shell.openSheet).toHaveBeenCalledWith('rtstop', { dayId: 11, assignmentId: 102 })
  })

  it('FE-MOB-RTSTAY-014: closing without saving writes nothing and does not reopen the stop', () => {
    const { planner, shell } = renderSheet()
    fireEvent.click(plus())
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(shell.closeSheet).toHaveBeenCalledTimes(1)
    expect(planner.setRoadtripStay).not.toHaveBeenCalled()
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTAY-015: a failed write puts the stored value back and says so', async () => {
    const { planner, shell } = renderSheet({
      setRoadtripStay: vi.fn(async () => { throw new Error('offline') }),
    })
    fireEvent.click(screen.getByRole('button', { name: '2 h' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Unknown error'))
    expect(value()).toHaveTextContent('30')
    expect(shell.openSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTSTAY-016: without place_edit there is nothing to set the stay with', () => {
    renderSheet({ can: vi.fn(() => false) })
    expect(minus()).toBeDisabled()
    expect(plus()).toBeDisabled()
    expect(screen.queryByRole('button', { name: '2 h' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'No stay' })).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-017: a stop that carries no stay yet opens on zero', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 202, name: 'Bremen Marktplatz' } } })
    expect(value()).toHaveTextContent('0')
    expect(minus()).toBeDisabled()
  })

  it('FE-MOB-RTSTAY-018: a place the stage does not stop at gets no preview either', () => {
    renderSheet({}, { sheet: { id: 'rtstay', payload: { placeId: 909, minutes: 30, name: 'Elsewhere' } } })
    expect(screen.getByRole('dialog', { name: 'Add a stay' })).toBeInTheDocument()
    expect(screen.queryByText('Arrive')).not.toBeInTheDocument()
  })
})
