import { beforeEach, describe, expect, it, vi } from 'vitest'
import MRtKindSheet from '../../../../src/mobile/screens/trip/roadtrip/MRtKindSheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-RTKIND-001 to FE-MOB-RTKIND-008
//
// The sheet renders inside the real TranslationProvider, so the copy is asserted in
// English. It writes through the very call the desktop rail makes, so what these hold is
// the phone's half: which stop, which kind, and that a second tap undoes it.

function makePlanner(overrides: Record<string, unknown> = {}) {
  return buildPlanner({
    tripId: 4,
    setRoadtripStopKind: vi.fn(async () => undefined),
    ...overrides,
  } as unknown as Partial<TripPlanner>)
}

function makeShell(overrides: Record<string, unknown> = {}) {
  return buildShell({
    sheet: { id: 'rtkind', payload: { placeId: 202, stopType: null, name: 'Bremen Marktplatz' } },
    ...overrides,
  } as unknown as Partial<MTripShellApi>)
}

function renderSheet(plannerOverrides: Record<string, unknown> = {}, shellOverrides: Record<string, unknown> = {}) {
  const planner = makePlanner(plannerOverrides)
  const shell = makeShell(shellOverrides)
  render(<MRtKindSheet planner={planner} shell={shell} />)
  return { planner, shell }
}

describe('MRtKindSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-RTKIND-001: stays closed while another sheet id is active', () => {
    renderSheet({}, { sheet: { id: 'rtstop', payload: { placeId: 202 } } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTKIND-002: opens on the stop it was asked about, with every kind offered', () => {
    renderSheet()

    expect(screen.getByRole('dialog', { name: 'Kind of stop' })).toBeInTheDocument()
    expect(screen.getByText('Bremen Marktplatz')).toBeInTheDocument()
    // The seven the desktop palette offers, each named for a screen reader although the
    // disc itself is the label on screen.
    for (const name of ['Accommodation', 'Fuel', 'Charging', 'Rest area', 'Campsite', 'Food', 'Sights']) {
      expect(screen.getByRole('button', { name, pressed: false })).toBeInTheDocument()
    }
  })

  it('FE-MOB-RTKIND-003: picking a kind writes it to the place and closes', async () => {
    const { planner, shell } = renderSheet()

    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }))

    await waitFor(() => expect(planner.setRoadtripStopKind).toHaveBeenCalledWith(202, 'fuel'))
    await waitFor(() => expect(shell.closeSheet).toHaveBeenCalledTimes(1))
  })

  it('FE-MOB-RTKIND-004: the kind a stop already is shows as chosen, and tapping it again takes it back', async () => {
    const { planner } = renderSheet({}, {
      sheet: { id: 'rtkind', payload: { placeId: 202, stopType: 'fuel', name: 'Bremen Marktplatz' } },
    })

    expect(screen.getByRole('button', { name: 'Fuel', pressed: true })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }))

    // Null is what turns a pause back into a destination, and it is the same write.
    await waitFor(() => expect(planner.setRoadtripStopKind).toHaveBeenCalledWith(202, null))
  })

  it('FE-MOB-RTKIND-005: the way back is offered only once there is something to undo', async () => {
    renderSheet()
    // On a destination it would be a button saying "leave everything as it is".
    expect(screen.queryByRole('button', { name: 'Back to a destination' })).toBeNull()

    const { planner } = renderSheet({}, {
      sheet: { id: 'rtkind', payload: { placeId: 202, stopType: 'rest_area', name: 'Bremen Marktplatz' } },
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Back to a destination' })[0])

    await waitFor(() => expect(planner.setRoadtripStopKind).toHaveBeenCalledWith(202, null))
  })

  it('FE-MOB-RTKIND-006: a traveller who may not edit places can open it but change nothing', () => {
    const { planner } = renderSheet({ can: () => false })

    for (const name of ['Fuel', 'Accommodation']) {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }))
    expect(planner.setRoadtripStopKind).not.toHaveBeenCalled()
  })

  it('FE-MOB-RTKIND-007: a payload without a place is not a sheet', () => {
    renderSheet({}, { sheet: { id: 'rtkind', payload: {} } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-RTKIND-008: a failing write leaves the sheet open rather than claiming it saved', async () => {
    const { shell } = renderSheet({
      setRoadtripStopKind: vi.fn(async () => { throw new Error('offline') }),
    })

    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }))

    // The planner's own call reports the failure; what matters here is that the sheet does
    // not close on a write that never landed.
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Kind of stop' })).toBeInTheDocument())
    expect(shell.closeSheet).not.toHaveBeenCalled()
  })
})
