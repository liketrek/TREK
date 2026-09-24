import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { BedDouble, MapPin } from 'lucide-react'
import type { BookingExpenseRequest } from '../../../../src/components/Planner/BookingCostsSection.types'
import type { ExpensePrefill } from '../../../../src/components/Budget/CostsPanel'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import type { BudgetItem, Reservation, Trip } from '../../../../src/types'
import { useAuthStore } from '../../../../src/store/authStore'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import { useTripStore } from '../../../../src/store/tripStore'
import { buildPlanner, buildShell } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-SHOST-001 to FE-MOB-SHOST-029 and FE-MOB-SHOST-032 (030 and 031 live in MTripSheets.members.test.tsx)
//
// Every child sheet is stubbed: this file is about the host — which sheet is
// mounted for which shell.sheet id, and how the host's own callbacks wire the
// planner, the trip store and the booking-linked expense editor together.

interface StubProps { shell: MTripShellApi; planner: TripPlanner }

/** Sheets that route on shell.sheet themselves — the stub reports what it saw. */
function selfRouted(testid: string) {
  return ({ planner, shell }: StubProps) => (
    <div data-testid={testid} data-sheet={shell.sheet?.id ?? 'none'} data-trip={planner.tripId} />
  )
}

vi.mock('../../../../src/mobile/screens/trip/sheets/MPlaceSheet', () => ({ default: selfRouted('stub-place') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MDaySheet', () => ({ default: selfRouted('stub-day') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MDaysSheet', () => ({ default: selfRouted('stub-days') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MAccommodationSheet', () => ({ default: selfRouted('stub-accommodation') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MTransportSheet', () => ({ default: selfRouted('stub-transport') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MBrowseActionsSheet', () => ({ default: selfRouted('stub-bract') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MMehrSheet', () => ({ default: selfRouted('stub-mehr') }))
vi.mock('../../../../src/mobile/screens/trip/sheets/MExportSheet', () => ({ default: selfRouted('stub-export') }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtCorridorSheet', () => ({ default: selfRouted('stub-rtsearch') }))
vi.mock('../../../../src/mobile/screens/trip/roadtrip/MRtDraftSheet', () => ({
  default: ({ planner }: { planner: TripPlanner }) => <div data-testid="stub-rtdraft" data-trip={planner.tripId} />,
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/MNoteSheet', () => ({
  default: ({ open, payload, onClose }: { open: boolean; payload?: { dayId?: number }; onClose: () => void }) => (
    <div data-testid="stub-note" data-open={String(open)} data-day={payload?.dayId ?? 'none'}>
      <button type="button" onClick={onClose}>close note</button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/MImportSheet', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <div data-testid="stub-import" data-open={String(open)}>
      <button type="button" onClick={onClose}>close import</button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/MPlaceEditSheet', () => ({
  default: ({ planner }: StubProps) => <div data-testid="stub-placeedit" data-trip={planner.tripId} />,
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/MReservationSheet', () => ({
  default: ({ onOpenExpense }: { onOpenExpense: (req: BookingExpenseRequest) => void }) => (
    <div data-testid="stub-reservation">
      <button type="button" onClick={() => onOpenExpense({ editItem: { id: 99, name: 'Ticket' } as BudgetItem })}>
        expense edit
      </button>
      <button type="button" onClick={() => onOpenExpense({})}>expense noop</button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/MTransportFormSheet', () => ({
  default: ({ onOpenExpense }: { onOpenExpense: (req: BookingExpenseRequest) => void }) => (
    <div data-testid="stub-transportform">
      <button type="button" onClick={() => onOpenExpense({ prefill: { name: 'Shinkansen', amount: 120 } })}>
        expense prefill
      </button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/trip/sheets/MCostSheet', () => ({
  default: ({ tripId, base, me, editing, prefill, onClose, onSaved }: {
    tripId: number; base: string; me: number
    editing: BudgetItem | null; prefill?: ExpensePrefill
    onClose: () => void; onSaved: () => void
  }) => (
    <div
      data-testid="stub-cost"
      data-trip={tripId}
      data-base={base}
      data-me={me}
      data-editing={editing?.id ?? 'none'}
      data-prefill={prefill?.name ?? 'none'}
    >
      <button type="button" onClick={onClose}>close cost</button>
      <button type="button" onClick={onSaved}>save cost</button>
    </div>
  ),
}))

vi.mock('../../../../src/mobile/screens/settings/MConfirmSheet', () => ({
  default: ({ open, title, message, onClose, onConfirm, danger, confirmLabel, children }: {
    open: boolean; title: string; message: ReactNode; onClose: () => void; onConfirm?: () => void
    danger?: boolean; confirmLabel?: string; children?: ReactNode
  }) =>
    open ? (
      <div data-testid="stub-confirm" data-title={title} data-danger={String(!!danger)} data-confirm={confirmLabel}>
        <span>{message}</span>
        {children}
        <button type="button" onClick={onConfirm}>confirm delete</button>
        <button type="button" onClick={onClose}>cancel delete</button>
      </div>
    ) : null,
}))

vi.mock('../../../../src/components/Planner/BookingImportModal', () => ({
  default: ({ isOpen, onClose, tripId }: { isOpen: boolean; onClose: () => void; tripId: number }) => (
    <div data-testid="stub-bookingimport" data-open={String(isOpen)} data-trip={tripId}>
      <button type="button" onClick={onClose}>close booking import</button>
    </div>
  ),
}))

vi.mock('../../../../src/components/Planner/AirTrailImportModal', () => ({
  default: ({ isOpen, onClose, pushUndo }: { isOpen: boolean; onClose: () => void; pushUndo: unknown }) => (
    <div data-testid="stub-airtrail" data-open={String(isOpen)} data-hasundo={String(typeof pushUndo === 'function')}>
      <button type="button" onClick={onClose}>close airtrail</button>
    </div>
  ),
}))

vi.mock('../../../../src/components/Trips/TripFormModal', () => ({
  default: ({ isOpen, onClose, onSave, trip, onCoverUpdate }: {
    isOpen: boolean; onClose: () => void
    onSave: (data: Record<string, unknown>) => Promise<void>
    trip?: Trip | null
    onCoverUpdate: (id: number, coverUrl: string) => void
  }) => (
    <div data-testid="stub-tripform" data-open={String(isOpen)} data-title={trip?.title ?? 'none'}>
      <button type="button" onClick={() => void onSave({ title: 'Japan 2027' })}>save trip</button>
      <button type="button" onClick={() => onCoverUpdate(1, '/uploads/covers/new.jpg')}>update cover</button>
      <button type="button" onClick={onClose}>close trip form</button>
    </div>
  ),
}))

vi.mock('../../../../src/components/Trips/TripMembersModal', () => ({
  default: ({ isOpen, onClose, tripTitle, onMembersChanged }: {
    isOpen: boolean; onClose: () => void; tripTitle?: string; onMembersChanged: () => void
  }) => (
    <div data-testid="stub-members" data-open={String(isOpen)} data-title={tripTitle ?? 'none'}>
      <button type="button" onClick={onMembersChanged}>members changed</button>
      <button type="button" onClick={onClose}>close members</button>
    </div>
  ),
}))

vi.mock('../../../../src/components/Planner/TransitJourneyModal', () => ({
  default: ({ reservation, canEdit, onClose, onSave, onDelete, onChangeRoute }: {
    reservation: Reservation
    canEdit: boolean
    onClose: () => void
    onSave: (fields: Record<string, unknown>) => Promise<void>
    onDelete: () => Promise<void>
    onChangeRoute: () => void
  }) => (
    <div data-testid="stub-transit" data-title={reservation.title} data-canedit={String(canEdit)}>
      <button type="button" onClick={() => void onSave({ title: 'Renamed' })}>save transit</button>
      <button type="button" onClick={() => void onDelete()}>delete transit</button>
      <button type="button" onClick={onChangeRoute}>change route</button>
      <button type="button" onClick={onClose}>close transit</button>
    </div>
  ),
}))

import MTripSheets from '../../../../src/mobile/screens/trip/sheets/MTripSheets'

const JOURNEY = {
  id: 55, trip_id: 1, day_id: 4, type: 'transit', title: 'Tokyo → Kyoto',
  endpoints: [
    { role: 'from', name: 'Tokyo Sta.', lat: 35.68, lng: 139.76 },
    { role: 'to', name: 'Kyoto Sta.', lat: 34.98, lng: 135.75 },
  ],
} as unknown as Reservation

function renderHost(plannerOverrides: Partial<TripPlanner> = {}, shellOverrides: Partial<MTripShellApi> = {}) {
  const planner = buildPlanner(plannerOverrides)
  const shell = buildShell(shellOverrides)
  render(<MTripSheets planner={planner} shell={shell} />)
  return { planner, shell }
}

describe('MTripSheets', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useAuthStore, { user: { id: 7, username: 'maurice', email: 'm@example.com' } })
  })

  it('FE-MOB-SHOST-001: mounts every sheet of the host with the same planner and shell', () => {
    renderHost({}, { sheet: null })
    for (const id of ['stub-place', 'stub-day', 'stub-days', 'stub-accommodation', 'stub-transport',
      'stub-bract', 'stub-mehr', 'stub-export', 'stub-note', 'stub-import', 'stub-placeedit',
      'stub-reservation', 'stub-transportform', 'stub-bookingimport', 'stub-airtrail',
      'stub-tripform', 'stub-members']) {
      expect(screen.getByTestId(id)).toBeInTheDocument()
    }
    expect(screen.getByTestId('stub-day')).toHaveAttribute('data-sheet', 'none')
    expect(screen.getByTestId('stub-placeedit')).toHaveAttribute('data-trip', '1')
  })

  it.each([
    ['day', 'stub-day'],
    ['days', 'stub-days'],
    ['accommodation', 'stub-accommodation'],
    ['transport', 'stub-transport'],
    ['bract', 'stub-bract'],
    ['mehr', 'stub-mehr'],
    ['export', 'stub-export'],
  ])('FE-MOB-SHOST-002: forwards the "%s" sheet id to %s', (id, testid) => {
    renderHost({}, { sheet: { id } })
    expect(screen.getByTestId(testid)).toHaveAttribute('data-sheet', id)
  })

  it.each([
    ['note', 'stub-note'],
    ['import', 'stub-import'],
    ['tripedit', 'stub-tripform'],
    ['members', 'stub-members'],
  ])('FE-MOB-SHOST-003: opens only %s for its own id', (id, testid) => {
    renderHost({}, { sheet: { id } })
    const hostRouted = ['stub-note', 'stub-import', 'stub-tripform', 'stub-members']
    for (const other of hostRouted) {
      expect(screen.getByTestId(other)).toHaveAttribute('data-open', String(other === testid))
    }
  })

  it('FE-MOB-SHOST-004: hands the note payload to the note sheet and only for that id', () => {
    renderHost({}, { sheet: { id: 'note', payload: { dayId: 4 } } })
    expect(screen.getByTestId('stub-note')).toHaveAttribute('data-day', '4')
  })

  it('FE-MOB-SHOST-005: withholds the payload while a different sheet is open', () => {
    renderHost({}, { sheet: { id: 'day', payload: { dayId: 4 } } })
    expect(screen.getByTestId('stub-note')).toHaveAttribute('data-day', 'none')
  })

  it('FE-MOB-SHOST-006: the note and import sheets close through the shell', () => {
    const { shell } = renderHost({}, { sheet: { id: 'note' } })
    fireEvent.click(screen.getByText('close note'))
    fireEvent.click(screen.getByText('close import'))
    expect(shell.closeSheet).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-SHOST-007: saving the trip form updates the trip and toasts', async () => {
    const { planner } = renderHost({}, { sheet: { id: 'tripedit' } })
    fireEvent.click(screen.getByText('save trip'))
    await waitFor(() => expect(planner.tripActions.updateTrip).toHaveBeenCalledWith(1, { title: 'Japan 2027' }))
    expect(planner.toast.success).toHaveBeenCalledWith('trip.toast.tripUpdated')
  })

  it('FE-MOB-SHOST-008: a new cover is patched straight into the trip store', () => {
    seedStore(useTripStore, { trip: { id: 1, title: 'Japan 2026', cover_image: '/uploads/covers/old.jpg' } })
    renderHost({}, { sheet: { id: 'tripedit' } })
    fireEvent.click(screen.getByText('update cover'))
    expect(useTripStore.getState().trip?.cover_image).toBe('/uploads/covers/new.jpg')
  })

  it('FE-MOB-SHOST-009: a cover update without a loaded trip leaves the store alone', () => {
    seedStore(useTripStore, { trip: null })
    renderHost({}, { sheet: { id: 'tripedit' } })
    fireEvent.click(screen.getByText('update cover'))
    expect(useTripStore.getState().trip).toBeNull()
  })

  it('FE-MOB-SHOST-010: the trip form and members modal close through the shell', () => {
    const { shell } = renderHost({}, { sheet: { id: 'members' } })
    fireEvent.click(screen.getByText('close trip form'))
    fireEvent.click(screen.getByText('close members'))
    expect(shell.closeSheet).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-SHOST-011: the members modal gets the trip title and reports changes to the planner', () => {
    const { planner } = renderHost({}, { sheet: { id: 'members' } })
    expect(screen.getByTestId('stub-members')).toHaveAttribute('data-title', 'Japan 2026')
    fireEvent.click(screen.getByText('members changed'))
    expect(planner.refreshMembers).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-SHOST-012: the booking and AirTrail importers follow their planner flags', () => {
    const { planner } = renderHost({ showBookingImport: true, showAirTrailImport: true })
    expect(screen.getByTestId('stub-bookingimport')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('stub-bookingimport')).toHaveAttribute('data-trip', '1')
    expect(screen.getByTestId('stub-airtrail')).toHaveAttribute('data-hasundo', 'true')

    fireEvent.click(screen.getByText('close booking import'))
    fireEvent.click(screen.getByText('close airtrail'))
    expect(planner.setShowBookingImport).toHaveBeenCalledWith(false)
    expect(planner.setShowAirTrailImport).toHaveBeenCalledWith(false)
  })

  it('FE-MOB-SHOST-013: no transit journey modal without a selected journey', () => {
    renderHost()
    expect(screen.queryByTestId('stub-transit')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHOST-014: prefers the stored reservation over the journey snapshot', () => {
    const stored = { ...JOURNEY, title: 'Tokyo → Kyoto (saved)' } as unknown as Reservation
    renderHost({ transitJourney: JOURNEY, reservations: [stored] })
    expect(screen.getByTestId('stub-transit')).toHaveAttribute('data-title', 'Tokyo → Kyoto (saved)')
    expect(screen.getByTestId('stub-transit')).toHaveAttribute('data-canedit', 'true')
  })

  it('FE-MOB-SHOST-015: falls back to the journey itself when it is not in the list', () => {
    const planner = buildPlanner({ transitJourney: JOURNEY, reservations: [], can: vi.fn(() => false) as TripPlanner['can'] })
    render(<MTripSheets planner={planner} shell={buildShell()} />)
    expect(screen.getByTestId('stub-transit')).toHaveAttribute('data-title', 'Tokyo → Kyoto')
    expect(screen.getByTestId('stub-transit')).toHaveAttribute('data-canedit', 'false')
    expect(planner.can).toHaveBeenCalledWith('day_edit', planner.trip)
  })

  it('FE-MOB-SHOST-016: saving the journey updates the reservation and clears the selection', async () => {
    const { planner } = renderHost({ transitJourney: JOURNEY })
    fireEvent.click(screen.getByText('save transit'))
    await waitFor(() =>
      expect(planner.tripActions.updateReservation).toHaveBeenCalledWith(1, 55, { title: 'Renamed' }))
    expect(planner.setTransitJourney).toHaveBeenLastCalledWith(null)
  })

  it('FE-MOB-SHOST-017: deleting the journey goes through the planner and clears the selection', async () => {
    const { planner } = renderHost({ transitJourney: JOURNEY })
    fireEvent.click(screen.getByText('delete transit'))
    await waitFor(() => expect(planner.handleDeleteReservation).toHaveBeenCalledWith(55))
    expect(planner.setTransitJourney).toHaveBeenLastCalledWith(null)
    fireEvent.click(screen.getByText('close transit'))
    expect(planner.setTransitJourney).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-SHOST-018: changing the route reopens the transport search seeded with both endpoints', () => {
    const { planner } = renderHost({ transitJourney: JOURNEY })
    fireEvent.click(screen.getByText('change route'))
    expect(planner.setTransitPrefill).toHaveBeenCalledWith({
      from: { name: 'Tokyo Sta.', lat: 35.68, lng: 139.76 },
      to: { name: 'Kyoto Sta.', lat: 34.98, lng: 135.75 },
    })
    expect(planner.setEditingTransport).toHaveBeenCalledWith(JOURNEY)
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(4)
    expect(planner.setTransportModalAutomated).toHaveBeenCalledWith(true)
    expect(planner.setTransitJourney).toHaveBeenCalledWith(null)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-SHOST-019: a journey without endpoints seeds empty prefills and no day', () => {
    const bare = { id: 56, trip_id: 1, type: 'transit', title: 'Unknown leg' } as unknown as Reservation
    const { planner } = renderHost({ transitJourney: bare })
    fireEvent.click(screen.getByText('change route'))
    expect(planner.setTransitPrefill).toHaveBeenCalledWith({ from: null, to: null })
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-SHOST-020: a booking opens the expense editor for its linked item and closes again', () => {
    renderHost()
    expect(screen.queryByTestId('stub-cost')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('expense noop'))
    expect(screen.queryByTestId('stub-cost')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('expense edit'))
    const cost = screen.getByTestId('stub-cost')
    expect(cost).toHaveAttribute('data-editing', '99')
    expect(cost).toHaveAttribute('data-prefill', 'none')
    expect(cost).toHaveAttribute('data-me', '7')
    expect(cost).toHaveAttribute('data-trip', '1')

    fireEvent.click(screen.getByText('close cost'))
    expect(screen.queryByTestId('stub-cost')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHOST-021: a transport prefill opens a new expense and reloads the budget on save', () => {
    const loadBudgetItems = vi.fn()
    seedStore(useTripStore, { loadBudgetItems })
    renderHost()
    fireEvent.click(screen.getByText('expense prefill'))
    const cost = screen.getByTestId('stub-cost')
    expect(cost).toHaveAttribute('data-editing', 'none')
    expect(cost).toHaveAttribute('data-prefill', 'Shinkansen')

    fireEvent.click(screen.getByText('save cost'))
    expect(loadBudgetItems).toHaveBeenCalledWith(1)
    expect(screen.queryByTestId('stub-cost')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHOST-022: the expense base currency prefers the display setting, then the trip', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: 'jpy' } })
    renderHost()
    fireEvent.click(screen.getByText('expense edit'))
    expect(screen.getByTestId('stub-cost')).toHaveAttribute('data-base', 'JPY')
  })

  it('FE-MOB-SHOST-023: falls back to the trip currency and finally to EUR', () => {
    seedStore(useSettingsStore, { settings: { ...useSettingsStore.getState().settings, default_currency: '' } })
    const { planner } = renderHost()
    fireEvent.click(screen.getByText('expense edit'))
    expect(screen.getByTestId('stub-cost')).toHaveAttribute('data-base', 'EUR')

    const noCurrency = { ...planner.trip, currency: '' } as unknown as Trip
    render(<MTripSheets planner={buildPlanner({ trip: noCurrency })} shell={buildShell()} />)
    fireEvent.click(screen.getAllByText('expense edit')[1])
    expect(screen.getAllByTestId('stub-cost')[1]).toHaveAttribute('data-base', 'EUR')
  })

  it('FE-MOB-SHOST-024: an anonymous session pays as user -1', () => {
    seedStore(useAuthStore, { user: null })
    renderHost()
    fireEvent.click(screen.getByText('expense edit'))
    expect(screen.getByTestId('stub-cost')).toHaveAttribute('data-me', '-1')
  })

  it('FE-MOB-SHOST-025: the delete-place confirm runs the planner confirmation and disarms', () => {
    const { planner } = renderHost({ deletePlaceId: 101 })
    expect(screen.getByTestId('stub-confirm')).toHaveAttribute('data-title', 'common.delete')
    expect(screen.getByText('trip.confirm.deletePlace')).toBeInTheDocument()

    fireEvent.click(screen.getByText('confirm delete'))
    expect(planner.confirmDeletePlace).toHaveBeenCalledTimes(1)
    expect(planner.setDeletePlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-SHOST-029: a night booked at the place is said before the yes, and only then', () => {
    // The server takes the night down with the place, and the booking and the
    // expense with the night. The planner builds the sentence; the sheet has to
    // show it under the question.
    const note = 'The booking at Hotel Okura and its expense go with it.'
    renderHost({ deletePlaceId: 101, deletePlaceNote: note })

    const confirm = screen.getByTestId('stub-confirm')
    expect(confirm).toHaveTextContent('trip.confirm.deletePlace')
    expect(screen.getByText(note)).toBeInTheDocument()
  })

  it('FE-MOB-SHOST-026: cancelling the confirm only disarms the flag', () => {
    const { planner } = renderHost({ deletePlaceId: 101 })
    fireEvent.click(screen.getByText('cancel delete'))
    expect(planner.confirmDeletePlace).not.toHaveBeenCalled()
    expect(planner.setDeletePlaceId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-SHOST-032: the delete-day confirm names the day, lists what goes with it and runs the planner confirmation', () => {
    const lines = [
      { key: 'stay-9', icon: BedDouble, tone: 'danger' as const, text: 'Stay at Harbour Hotel', hint: 'Cancelled with its booking.' },
      { key: 'places', icon: MapPin, tone: 'neutral' as const, text: 'Planned places: 2' },
    ]
    const { planner } = renderHost({ deleteDayId: 12, deleteDayTitle: 'Delete Tue, Oct 13?', deleteDayLines: lines })

    const confirm = screen.getByTestId('stub-confirm')
    expect(confirm).toHaveAttribute('data-title', 'Delete Tue, Oct 13?')
    expect(confirm).toHaveAttribute('data-danger', 'true')
    expect(confirm).toHaveAttribute('data-confirm', 'dayplan.deleteDay')
    expect(confirm).toHaveTextContent('dayplan.deleteDayBody')
    const list = screen.getByRole('list', { name: 'Delete Tue, Oct 13?' })
    expect(list).toHaveTextContent('Stay at Harbour Hotel')
    expect(list).toHaveTextContent('Planned places: 2')

    fireEvent.click(screen.getByText('confirm delete'))
    expect(planner.confirmDeleteDay).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('cancel delete'))
    expect(planner.setDeleteDayId).toHaveBeenCalledWith(null)
  })

  it('FE-MOB-SHOST-027: the place edit sheet owns the confirm while its own form is open', () => {
    renderHost({ deletePlaceId: 101, showPlaceForm: true })
    expect(screen.queryByTestId('stub-confirm')).not.toBeInTheDocument()
  })

  it('FE-MOB-SHOST-028: the search sheet is mounted before the draft it opens', () => {
    renderHost({}, { sheet: null })

    const order = [...document.querySelectorAll('[data-testid]')]
      .map(el => el.getAttribute('data-testid'))
      .filter(id => id === 'stub-rtsearch' || id === 'stub-rtdraft')

    // Both sit at the same z. Portal order is what decides which paints on top, and
    // taking a hit onto the trip has to open the draft OVER the search it came from.
    expect(order).toEqual(['stub-rtsearch', 'stub-rtdraft'])
  })

})
