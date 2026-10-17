// FE-TP-DIALOGS-001 to FE-TP-DIALOGS-012
//
// The planner's dialogs and the URL intents that open them, driven straight through
// usePlannerDialogs. The search params come in as options, so each test owns the URL
// and can watch what the hook writes back to it.
import { act, renderHook, waitFor } from '@testing-library/react'
import { airtrailApi } from '../../api/client'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace, buildReservation } from '../../../tests/helpers/factories'
import { usePlannerDialogs } from './usePlannerDialogs'

const env = vi.hoisted(() => ({ airTrailAvailable: false }))

vi.mock('../../hooks/useAirtrailConnection', () => ({
  useAirtrailConnection: () => ({
    airtrailEnabled: env.airTrailAvailable,
    connected: env.airTrailAvailable,
    available: env.airTrailAvailable,
    loading: false,
  }),
}))

type Updater = (prev: URLSearchParams) => URLSearchParams

let url: URLSearchParams
const setSearchParams = vi.fn((update: Updater, _opts?: { replace?: boolean }) => {
  url = update(new URLSearchParams(url))
})
let tripActions: TripStoreState

interface Props { tripId: number; searchParams: URLSearchParams }

function renderDialogs(initial: Partial<Props> = {}) {
  const initialProps: Props = { tripId: 42, searchParams: new URLSearchParams(), ...initial }
  return renderHook(
    (props: Props) => usePlannerDialogs({ ...props, tripActions, setSearchParams }),
    { initialProps },
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  resetAllStores()
  env.airTrailAvailable = false
  url = new URLSearchParams()
  setSearchParams.mockClear()
  tripActions = { ...useTripStore.getState(), loadReservations: vi.fn(async () => undefined) }
})

describe('usePlannerDialogs', () => {
  it('FE-TP-DIALOGS-001: opens with every dialog closed and nothing being edited', () => {
    const { result } = renderDialogs()
    const d = result.current

    expect(d.showPlaceForm).toBe(false)
    expect(d.editingPlace).toBeNull()
    expect(d.prefillCoords).toBeNull()
    expect(d.placeFormDayId).toBeNull()
    expect(d.placeFormPosition).toBeNull()
    expect(d.serviceStopForm).toBe(false)
    expect(d.serviceStopKind).toBeNull()
    expect(d.stopDraft).toBeNull()
    expect(d.stayRelease).toBeNull()
    expect(d.showReservationModal).toBe(false)
    expect(d.showTransportModal).toBe(false)
    expect(d.bookingImportKind).toBe('bookings')
    expect(d.bookingImportAvailable).toBe(false)
    expect(d.airTrailAvailable).toBe(false)
    expect(d.bookingDetailOpen).toBeNull()
    expect(setSearchParams).not.toHaveBeenCalled()
  })

  it('FE-TP-DIALOGS-002: ?create=place opens a blank place form and leaves the rest of the URL alone', () => {
    const { result, rerender } = renderDialogs()
    act(() => {
      result.current.setEditingPlace(buildPlace({ id: 5 }))
      result.current.setEditingAssignmentId(9)
      result.current.setPlaceFormDayId(3)
    })

    url = new URLSearchParams('create=place&keep=1')
    rerender({ tripId: 42, searchParams: url })

    expect(result.current.showPlaceForm).toBe(true)
    expect(result.current.editingPlace).toBeNull()
    expect(result.current.editingAssignmentId).toBeNull()
    expect(result.current.placeFormDayId).toBeNull()
    expect(setSearchParams).toHaveBeenCalledTimes(1)
    expect(setSearchParams.mock.calls[0][1]).toEqual({ replace: true })
    expect(url.toString()).toBe('keep=1')
  })

  it('FE-TP-DIALOGS-003: ?create=reservation opens a fresh booking editor', () => {
    const { result, rerender } = renderDialogs()
    act(() => {
      result.current.setEditingReservation(buildReservation({ id: 4 }))
      result.current.setBookingForAssignmentId(8)
    })

    url = new URLSearchParams('create=reservation')
    rerender({ tripId: 42, searchParams: url })

    expect(result.current.showReservationModal).toBe(true)
    expect(result.current.editingReservation).toBeNull()
    expect(result.current.bookingForAssignmentId).toBeNull()
    expect(result.current.showTransportModal).toBe(false)
    expect(url.has('create')).toBe(false)
  })

  it('FE-TP-DIALOGS-004: ?create=transport opens a fresh transport editor', () => {
    const { result, rerender } = renderDialogs()
    act(() => {
      result.current.setEditingTransport(buildReservation({ id: 6, type: 'train' }))
      result.current.setTransportModalDayId(2)
    })

    url = new URLSearchParams('create=transport')
    rerender({ tripId: 42, searchParams: url })

    expect(result.current.showTransportModal).toBe(true)
    expect(result.current.editingTransport).toBeNull()
    expect(result.current.transportModalDayId).toBeNull()
    expect(result.current.showReservationModal).toBe(false)
    expect(url.has('create')).toBe(false)
  })

  it('FE-TP-DIALOGS-005: an intent nobody handles opens nothing and stays in the URL', () => {
    url = new URLSearchParams('create=expense')
    const { result } = renderDialogs({ searchParams: url })

    expect(result.current.showPlaceForm).toBe(false)
    expect(result.current.showReservationModal).toBe(false)
    expect(result.current.showTransportModal).toBe(false)
    expect(setSearchParams).not.toHaveBeenCalled()
    expect(url.get('create')).toBe('expense')
  })

  it('FE-TP-DIALOGS-006: ?tab= is dropped from the URL once the planner has read it', () => {
    url = new URLSearchParams('tab=dateien&keep=1')
    const { result } = renderDialogs({ searchParams: url })

    expect(setSearchParams).toHaveBeenCalledTimes(1)
    expect(setSearchParams.mock.calls[0][1]).toEqual({ replace: true })
    expect(url.toString()).toBe('keep=1')
    expect(result.current.showPlaceForm).toBe(false)
  })

  it('FE-TP-DIALOGS-007: the insert position lives only as long as the place form is open', () => {
    const { result } = renderDialogs()
    act(() => {
      result.current.setShowPlaceForm(true)
      result.current.setPlaceFormPosition(3)
    })
    expect(result.current.placeFormPosition).toBe(3)

    act(() => { result.current.setShowPlaceForm(false) })
    expect(result.current.placeFormPosition).toBeNull()
  })

  it('FE-TP-DIALOGS-008: an AirTrail sync that changed something reloads the bookings, once per trip', async () => {
    env.airTrailAvailable = true
    const sync = vi.spyOn(airtrailApi, 'sync').mockResolvedValue({ changed: 2 })

    const { result, rerender } = renderDialogs()
    expect(result.current.airTrailAvailable).toBe(true)
    await waitFor(() => expect(tripActions.loadReservations).toHaveBeenCalledWith(42))
    expect(sync).toHaveBeenCalledTimes(1)

    rerender({ tripId: 42, searchParams: new URLSearchParams() })
    expect(sync).toHaveBeenCalledTimes(1)

    rerender({ tripId: 43, searchParams: new URLSearchParams() })
    await waitFor(() => expect(tripActions.loadReservations).toHaveBeenCalledWith(43))
    expect(sync).toHaveBeenCalledTimes(2)
  })

  it('FE-TP-DIALOGS-009: a sync with nothing new, no answer or a failure leaves the bookings alone', async () => {
    env.airTrailAvailable = true
    const sync = vi.spyOn(airtrailApi, 'sync')
      .mockResolvedValueOnce({ changed: 0 })
      .mockResolvedValueOnce(null as unknown as { changed: number })
      .mockRejectedValueOnce(new Error('offline'))

    const { rerender } = renderDialogs({ tripId: 1 })
    rerender({ tripId: 2, searchParams: new URLSearchParams() })
    rerender({ tripId: 3, searchParams: new URLSearchParams() })

    await waitFor(() => expect(sync).toHaveBeenCalledTimes(3))
    await act(async () => { await Promise.resolve() })
    expect(tripActions.loadReservations).not.toHaveBeenCalled()
  })

  it('FE-TP-DIALOGS-010: without an AirTrail connection or a trip nothing is synced', () => {
    const sync = vi.spyOn(airtrailApi, 'sync')
    renderDialogs()
    expect(sync).not.toHaveBeenCalled()

    env.airTrailAvailable = true
    renderDialogs({ tripId: Number.NaN })
    expect(sync).not.toHaveBeenCalled()
  })

  it('FE-TP-DIALOGS-011: the full transport editor opens on a saved entry without a day', () => {
    const { result } = renderDialogs()
    const entry = buildReservation({ id: 12, type: 'transit' })
    act(() => {
      result.current.setTransitPrefill({ from: null, to: null })
      result.current.setTransitJourney(entry)
      result.current.setTransportModalAutomated(true)
    })

    act(() => { result.current.openTransportEditor(entry) })

    expect(result.current.editingTransport).toBe(entry)
    expect(result.current.transportModalDayId).toBeNull()
    expect(result.current.transportModalAutomated).toBe(false)
    expect(result.current.transitPrefill).toBeNull()
    expect(result.current.transitJourney).toBeNull()
    expect(result.current.showTransportModal).toBe(true)
  })

  it('FE-TP-DIALOGS-012: changing a route seeds whichever end the journey knows', () => {
    const { result } = renderDialogs()
    const onlyFrom = buildReservation({
      id: 13, type: 'transit', day_id: 4,
      endpoints: [{ role: 'from', name: 'Bern', lat: 46.9, lng: 7.4 }] as never,
    })

    act(() => { result.current.changeTransitRoute(onlyFrom) })

    expect(result.current.transitPrefill).toEqual({ from: { name: 'Bern', lat: 46.9, lng: 7.4 }, to: null })
    expect(result.current.editingTransport).toBe(onlyFrom)
    expect(result.current.transportModalDayId).toBe(4)
    expect(result.current.transportModalAutomated).toBe(true)
    expect(result.current.transitJourney).toBeNull()
    expect(result.current.showTransportModal).toBe(true)

    const onlyTo = buildReservation({
      id: 14, type: 'transit',
      endpoints: [{ role: 'to', name: 'Thun', lat: 46.75, lng: 7.63 }] as never,
    })
    act(() => { result.current.changeTransitRoute(onlyTo) })

    expect(result.current.transitPrefill).toEqual({ from: null, to: { name: 'Thun', lat: 46.75, lng: 7.63 } })
    expect(result.current.transportModalDayId).toBeNull()

    act(() => { result.current.changeTransitRoute(buildReservation({ id: 15, type: 'transit' })) })
    expect(result.current.transitPrefill).toEqual({ from: null, to: null })
  })
})
