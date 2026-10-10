// FE-TP-BOOKING-001 to FE-TP-BOOKING-013
//
// Booking writes and the review before an import is saved, driven straight through
// useBookingEdits. Every write goes to a recorded stand-in for the store's actions and
// every editor switch to a recorded setter, so each case can read which editor the
// review opened and with what. The bridge reads the real background task store and the
// real IndexedDB copy of an import's files.
import { act, renderHook, waitFor } from '@testing-library/react'
import type { BookingImportPreviewItem } from '@trek/shared'
import { accommodationsApi, mapsApi } from '../../api/client'
import { getImportFiles, saveImportFiles } from '../../db/offlineDb'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import { _resetNetworkMode, setForcedOffline } from '../../sync/networkMode'
import { resetAllStores } from '../../../tests/helpers/store'
import { buildPlace, buildReservation, buildTrip } from '../../../tests/helpers/factories'
import type { Translate } from './plannerTypes'
import { useBookingEdits } from './useBookingEdits'

type Options = Parameters<typeof useBookingEdits>[0]
type ImportedStay = { place_id?: number; venue?: { name?: string; address?: string | null }; address?: string }

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
const t = ((key: string) => key) as Translate
const trip = buildTrip({ id: 42 })

const ryokan = buildPlace({ id: 7, name: 'Ryokan', address: 'Old street' })
const hut = buildPlace({ id: -3, name: 'Hut', address: null })
const flightItem = { type: 'flight', title: 'NRT to CDG', source: { fileName: 'mail.pdf' } }
const hotelItem = { type: 'hotel', title: 'Ryokan' }
const oddItem = { type: 'shuttle-voucher', title: 'Airport transfer' }
const items = (...list: object[]) => list as unknown as BookingImportPreviewItem[]
const RECEIPT = { merchant: 'Cafe', date: '2026-09-20', total: 12.5, currency: 'EUR', items: [{ name: 'Tart', price: 12.5 }] }

function makeActions() {
  return {
    updatePlace: vi.fn(async () => undefined),
    addPlace: vi.fn(async (): Promise<{ id: number } | null> => ({ id: 900 })),
    updateReservation: vi.fn(async () => ({ id: 5 })),
    addReservation: vi.fn(async () => ({ id: 6 })),
    deleteReservation: vi.fn(async () => undefined),
    loadBudgetItems: vi.fn(async () => undefined),
  }
}

let actions: ReturnType<typeof makeActions>
let fixed: Options

function renderEdits(over: Partial<Options> = {}) {
  return renderHook((props: Options) => useBookingEdits(props), { initialProps: { ...fixed, ...over } })
}

/** A finished task the background widget sent here for review. */
function doneTask(over: Record<string, unknown>) {
  return { tripId: '42', label: 'mail.pdf', status: 'done', done: 1, total: 1, reviewRequested: true, items: [], ...over }
}

/** Saves a hotel whose stay carries `acc`, and hands `acc` back to read what was linked. */
async function saveHotel(result: { current: ReturnType<typeof useBookingEdits> }, acc: ImportedStay) {
  await act(async () => { await result.current.handleSaveReservation({ title: 'Stay', type: 'hotel', create_accommodation: acc } as never) })
  return acc
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  resetAllStores()
  _resetNetworkMode()
  useBackgroundTasksStore.setState({ tasks: [] })
  vi.spyOn(accommodationsApi, 'list').mockResolvedValue({ accommodations: [{ id: 3 }] } as never)
  vi.spyOn(mapsApi, 'search').mockResolvedValue({ places: [] } as never)
  actions = makeActions()
  fixed = {
    tripId: 42, trip, toast, t,
    tripActions: { ...useTripStore.getState(), ...actions } as unknown as TripStoreState,
    places: [ryokan, hut], selectedDayId: 10, canUploadFiles: true, setTripAccommodations: vi.fn(),
    editingReservation: null, setEditingReservation: vi.fn(), setShowReservationModal: vi.fn(),
    editingTransport: null, setEditingTransport: vi.fn(), setShowTransportModal: vi.fn(), setTransportModalDayId: vi.fn(),
  }
})

afterEach(() => { _resetNetworkMode() })

describe('useBookingEdits', () => {
  it('FE-TP-BOOKING-001: an edited booking is updated and its editor closes, and only a hotel refreshes the stays', async () => {
    const { result } = renderEdits({ editingReservation: buildReservation({ id: 5 }) })

    let saved: unknown
    await act(async () => { saved = await result.current.handleSaveReservation({ title: 'Dinner', type: 'restaurant' }) })
    expect(saved).toEqual({ id: 5 })
    expect(actions.updateReservation).toHaveBeenCalledWith(42, 5, { title: 'Dinner', type: 'restaurant' })
    expect(toast.success).toHaveBeenCalledWith('trip.toast.reservationUpdated')
    expect(fixed.setShowReservationModal).toHaveBeenCalledWith(false)
    expect(fixed.setEditingReservation).toHaveBeenCalledWith(null)
    expect(accommodationsApi.list).not.toHaveBeenCalled()

    await act(async () => { await result.current.handleSaveReservation({ title: 'Ryokan', type: 'hotel' }) })
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenCalledWith([{ id: 3 }]))
  })

  it('FE-TP-BOOKING-002: a new booking lands on the selected day, or on none, and its linked cost is loaded', async () => {
    const { result } = renderEdits()

    let saved: unknown
    await act(async () => {
      saved = await result.current.handleSaveReservation({ title: 'Ryokan', type: 'hotel', create_budget_entry: 1 })
    })
    expect(saved).toEqual({ id: 6 })
    expect(actions.addReservation).toHaveBeenCalledWith(42, { title: 'Ryokan', type: 'hotel', create_budget_entry: 1, day_id: 10 })
    expect(toast.success).toHaveBeenCalledWith('trip.toast.reservationAdded')
    expect(actions.loadBudgetItems).toHaveBeenCalledWith(42)
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenCalledWith([{ id: 3 }]))

    const undated = renderEdits({ selectedDayId: null })
    actions.loadBudgetItems.mockClear()
    vi.mocked(accommodationsApi.list).mockClear()
    await act(async () => { await undated.result.current.handleSaveReservation({ title: 'Museum', type: 'tour' }) })
    expect(actions.addReservation).toHaveBeenLastCalledWith(42, { title: 'Museum', type: 'tour', day_id: null })
    expect(actions.loadBudgetItems).not.toHaveBeenCalled()
    expect(accommodationsApi.list).not.toHaveBeenCalled()
  })

  it('FE-TP-BOOKING-003: a stay refresh that fails or answers without stays leaves the list empty or alone', async () => {
    const { result } = renderEdits()

    vi.mocked(accommodationsApi.list).mockResolvedValueOnce({} as never)
    await act(async () => { await result.current.handleSaveReservation({ title: 'Ryokan', type: 'hotel' }) })
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenCalledWith([]))

    vi.mocked(fixed.setTripAccommodations).mockClear()
    vi.mocked(accommodationsApi.list).mockRejectedValueOnce(new Error('offline'))
    await act(async () => { await result.current.handleSaveReservation({ title: 'Ryokan', type: 'hotel' }) })
    await act(async () => { await Promise.resolve() })
    expect(fixed.setTripAccommodations).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-TP-BOOKING-004: a hotel address edited in the booking is written to its place, and only when it changed', async () => {
    const { result } = renderEdits({ places: [ryokan, buildPlace({ id: 8, name: 'Inn', address: null })] })

    const edited = await saveHotel(result, { place_id: 7, address: ' New street ' })
    expect(actions.updatePlace).toHaveBeenCalledWith(42, 7, { address: 'New street' })
    expect(edited.address).toBeUndefined()

    await saveHotel(result, { place_id: 8, address: 'First street' })
    expect(actions.updatePlace).toHaveBeenLastCalledWith(42, 8, { address: 'First street' })

    actions.updatePlace.mockClear()
    await saveHotel(result, { place_id: 7, address: 'Old street' })
    await saveHotel(result, { address: 'Nowhere street' })
    await saveHotel(result, { place_id: 7, address: '  ' })
    expect(actions.updatePlace).not.toHaveBeenCalled()

    // A failed write to the place still saves the booking.
    actions.updatePlace.mockRejectedValueOnce(new Error('locked'))
    actions.addReservation.mockClear()
    await saveHotel(result, { place_id: 7, address: 'New street' })
    expect(actions.addReservation).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-TP-BOOKING-005: an imported stay is linked to a place of the trip by name, never to an offline one', async () => {
    const { result } = renderEdits()

    const exact = await saveHotel(result, { venue: { name: ' ryokan ', address: 'Kyoto' } })
    expect(exact).toEqual({ place_id: 7 })
    const partial = await saveHotel(result, { venue: { name: 'Ryokan Sakura' } })
    expect(partial.place_id).toBe(7)
    expect(mapsApi.search).not.toHaveBeenCalled()

    // The hut only exists offline, so a new place is found and made instead.
    vi.mocked(mapsApi.search).mockResolvedValueOnce({ places: [{ lat: 1, lng: 2, address: 'Geo street' }] } as never)
    const temp = await saveHotel(result, { venue: { name: 'Hut' } })
    expect(mapsApi.search).toHaveBeenCalledWith('Hut')
    expect(actions.addPlace).toHaveBeenCalledWith(42, { name: 'Hut', lat: 1, lng: 2, address: 'Geo street' })
    expect(temp.place_id).toBe(900)

    // A place already picked is kept.
    actions.addPlace.mockClear()
    const picked = await saveHotel(result, { place_id: 7, venue: { name: 'Hut' } })
    expect(picked.place_id).toBe(7)
    expect(picked.venue).toEqual({ name: 'Hut' })
    expect(actions.addPlace).not.toHaveBeenCalled()
  })

  it('FE-TP-BOOKING-006: offline nothing is linked, and a failed search still makes the place without coordinates', async () => {
    const { result } = renderEdits()

    setForcedOffline(true)
    const offline = await saveHotel(result, { venue: { name: 'Lodge', address: 'Main 1' } })
    expect(offline.place_id).toBeUndefined()
    expect(mapsApi.search).not.toHaveBeenCalled()
    expect(actions.addPlace).not.toHaveBeenCalled()
    _resetNetworkMode()

    vi.mocked(mapsApi.search).mockRejectedValueOnce(new Error('overpass down'))
    await saveHotel(result, { venue: { name: 'Lodge', address: 'Main 1' } })
    expect(mapsApi.search).toHaveBeenCalledWith('Lodge Main 1')
    expect(actions.addPlace).toHaveBeenLastCalledWith(42, { name: 'Lodge', lat: null, lng: null, address: 'Main 1' })

    // A hit without coordinates is no hit, and the address keeps what the booking read.
    vi.mocked(mapsApi.search).mockResolvedValueOnce({ places: [{ lat: null, lng: 2, address: 'Elsewhere' }] } as never)
    await saveHotel(result, { venue: { name: '', address: 'Main 1' } })
    expect(mapsApi.search).toHaveBeenLastCalledWith('Main 1')
    expect(actions.addPlace).toHaveBeenLastCalledWith(42, { name: 'Main 1', lat: null, lng: null, address: 'Main 1' })

    vi.mocked(mapsApi.search).mockResolvedValueOnce(undefined as never)
    await saveHotel(result, { venue: { name: 'Lodge', address: 'Main 1' } })
    expect(actions.addPlace).toHaveBeenLastCalledWith(42, { name: 'Lodge', lat: null, lng: null, address: 'Main 1' })
  })

  it('FE-TP-BOOKING-007: a stay with nothing to go by is still made, and one the store could not keep links nothing', async () => {
    const { result } = renderEdits()

    vi.mocked(mapsApi.search).mockClear()
    const nameless = await saveHotel(result, { venue: {} })
    expect(mapsApi.search).not.toHaveBeenCalled()
    expect(actions.addPlace).toHaveBeenLastCalledWith(42, { name: 'Accommodation', lat: null, lng: null, address: null })
    expect(nameless.place_id).toBe(900)

    actions.addPlace.mockResolvedValueOnce(null)
    expect((await saveHotel(result, { venue: { name: 'Lodge' } })).place_id).toBeUndefined()
    actions.addPlace.mockResolvedValueOnce({ id: -5 })
    expect((await saveHotel(result, { venue: { name: 'Lodge' } })).place_id).toBeUndefined()
    actions.addPlace.mockRejectedValueOnce(new Error('quota'))
    expect((await saveHotel(result, { venue: { name: 'Lodge' } })).place_id).toBeUndefined()
    expect(actions.addReservation).toHaveBeenCalledTimes(4)
  })

  it('FE-TP-BOOKING-008: a booking that cannot be saved says so, whatever was thrown', async () => {
    const { result } = renderEdits()

    actions.addReservation.mockRejectedValueOnce(new Error('limit')).mockRejectedValueOnce('nope')
    let saved: unknown = 'unset'
    await act(async () => { saved = await result.current.handleSaveReservation({ title: 'Dinner' }) })
    expect(saved).toBeUndefined()
    expect(toast.error).toHaveBeenLastCalledWith('limit')
    await act(async () => { await result.current.handleSaveReservation({ title: 'Dinner' }) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-BOOKING-009: a transport is updated or added, its editor closes, and a linked cost is loaded', async () => {
    const edit = renderEdits({ editingTransport: buildReservation({ id: 5, type: 'flight' }) })
    let saved: unknown
    await act(async () => { saved = await edit.result.current.handleSaveTransport({ title: 'NRT to CDG' }) })
    expect(saved).toEqual({ id: 5 })
    expect(actions.updateReservation).toHaveBeenCalledWith(42, 5, { title: 'NRT to CDG' })
    expect(toast.success).toHaveBeenLastCalledWith('trip.toast.reservationUpdated')
    expect(fixed.setShowTransportModal).toHaveBeenCalledWith(false)
    expect(fixed.setEditingTransport).toHaveBeenCalledWith(null)
    expect(fixed.setTransportModalDayId).toHaveBeenCalledWith(null)

    const { result } = renderEdits()
    await act(async () => { saved = await result.current.handleSaveTransport({ title: 'Train' }) })
    expect(saved).toEqual({ id: 6 })
    expect(actions.addReservation).toHaveBeenCalledWith(42, { title: 'Train' })
    expect(actions.loadBudgetItems).not.toHaveBeenCalled()
    await act(async () => { await result.current.handleSaveTransport({ title: 'Train', create_budget_entry: true }) })
    expect(actions.loadBudgetItems).toHaveBeenCalledWith(42)

    actions.addReservation.mockRejectedValueOnce(new Error('limit')).mockRejectedValueOnce('nope')
    await act(async () => { await result.current.handleSaveTransport({ title: 'Train' }) })
    expect(toast.error).toHaveBeenLastCalledWith('limit')
    await act(async () => { await result.current.handleSaveTransport({ title: 'Train' }) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-BOOKING-010: a deleted booking refreshes the stays, and a failed delete says so', async () => {
    const { result } = renderEdits()

    await act(async () => { await result.current.handleDeleteReservation(5) })
    expect(actions.deleteReservation).toHaveBeenCalledWith(42, 5)
    expect(toast.success).toHaveBeenCalledWith('trip.toast.deleted')
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenCalledWith([{ id: 3 }]))

    vi.mocked(accommodationsApi.list).mockResolvedValueOnce({} as never)
    await act(async () => { await result.current.handleDeleteReservation(5) })
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenLastCalledWith([]))

    actions.deleteReservation.mockRejectedValueOnce(new Error('gone')).mockRejectedValueOnce('nope')
    await act(async () => { await result.current.handleDeleteReservation(5) })
    expect(toast.error).toHaveBeenLastCalledWith('gone')
    await act(async () => { await result.current.handleDeleteReservation(5) })
    expect(toast.error).toHaveBeenLastCalledWith('common.unknownError')
  })

  it('FE-TP-BOOKING-011: the review walks its queue through the right editors and closes everything at the end', async () => {
    const { result } = renderEdits()
    const file = new File(['x'], 'mail.pdf')

    act(() => { result.current.startImportReview([]) })
    expect(result.current.importReviewActive).toBe(false)
    expect(fixed.setShowReservationModal).not.toHaveBeenCalled()

    act(() => { result.current.startImportReview(items(flightItem, hotelItem, oddItem), [file], 'transports') })
    expect(result.current.importReviewActive).toBe(true)
    expect(result.current.transportPrefill).toMatchObject({ title: 'NRT to CDG', _sourceFiles: [file] })
    expect(fixed.setShowTransportModal).toHaveBeenLastCalledWith(true)
    expect(fixed.setShowReservationModal).toHaveBeenLastCalledWith(false)

    act(() => { result.current.advanceImportReview() })
    expect(result.current.reservationPrefill).toMatchObject({ title: 'Ryokan' })
    expect(result.current.reservationPrefill?._sourceFiles).toBeUndefined()
    expect(result.current.transportPrefill).toBeNull()
    expect(fixed.setShowReservationModal).toHaveBeenLastCalledWith(true)

    // Neither form knows it, so it goes where the import began.
    act(() => { result.current.advanceImportReview() })
    expect(result.current.transportPrefill).toMatchObject({ title: 'Airport transfer' })
    expect(result.current.reservationPrefill).toBeNull()

    act(() => { result.current.advanceImportReview() })
    expect(result.current.importReviewActive).toBe(false)
    expect(result.current.transportPrefill).toBeNull()
    expect(fixed.setShowTransportModal).toHaveBeenLastCalledWith(false)
    expect(fixed.setShowReservationModal).toHaveBeenLastCalledWith(false)
    expect(actions.loadBudgetItems).toHaveBeenCalledWith(42)
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenCalledWith([{ id: 3 }]))

    // Started without a tab, an item neither form knows goes to the booking form.
    act(() => { result.current.startImportReview(items(oddItem)) })
    expect(result.current.reservationPrefill).toMatchObject({ title: 'Airport transfer' })
    vi.mocked(accommodationsApi.list).mockResolvedValueOnce({} as never)
    act(() => { result.current.advanceImportReview() })
    await waitFor(() => expect(fixed.setTripAccommodations).toHaveBeenLastCalledWith([]))
  })

  it('FE-TP-BOOKING-012: the bridge hands this trip\'s finished import to the review, from memory or from IndexedDB', async () => {
    const file = new File(['x'], 'mail.pdf')
    useBackgroundTasksStore.setState({
      tasks: [
        doneTask({ id: 'job-t', kind: 'transports', items: [oddItem], sourceFiles: [file] }),
        doneTask({ id: 'job-o', tripId: '99', items: [flightItem] }),
      ] as never,
    })
    const { result } = renderEdits()

    await waitFor(() => expect(result.current.transportPrefill).toMatchObject({ title: 'Airport transfer' }))
    expect(useBackgroundTasksStore.getState().tasks.map(task => task.id)).toEqual(['job-o'])

    await saveImportFiles('job-db', [file])
    act(() => { useBackgroundTasksStore.setState({ tasks: [doneTask({ id: 'job-db', items: [{ ...hotelItem, source: { fileName: 'mail.pdf' } }] })] as never }) })
    await waitFor(() => expect(result.current.reservationPrefill?._sourceFiles?.map(f => f.name)).toEqual(['mail.pdf']))
    await waitFor(async () => expect(await getImportFiles('job-db')).toEqual([]))
  })

  it('FE-TP-BOOKING-013: a scanned receipt waits for its trip, then fills the expense, with the photo only for an uploader and from IndexedDB after a reload', async () => {
    const photo = new File(['x'], 'bill.jpg', { type: 'image/jpeg' })
    const receiptTask = (id: string, receipt: unknown, sourceFiles?: File[]) => doneTask({ id, kind: 'costs', receipt, sourceFiles })
    useBackgroundTasksStore.setState({ tasks: [receiptTask('job-r', RECEIPT, [photo])] as never })
    const { result, rerender } = renderEdits({ trip: null })

    await act(async () => { await Promise.resolve() })
    expect(useBackgroundTasksStore.getState().tasks).toHaveLength(1)
    expect(result.current.receiptExpense).toBeNull()

    rerender({ ...fixed, trip })
    await waitFor(() => expect(result.current.receiptExpense).toMatchObject({ name: 'Cafe', amount: 12.5, receiptFiles: [photo] }))
    expect(useBackgroundTasksStore.getState().tasks).toHaveLength(0)

    act(() => { result.current.setReceiptExpense(null) })
    rerender({ ...fixed, canUploadFiles: false })
    act(() => { useBackgroundTasksStore.setState({ tasks: [receiptTask('job-u', RECEIPT, [photo])] as never }) })
    await waitFor(() => expect(result.current.receiptExpense).toMatchObject({ name: 'Cafe', receiptFiles: [] }))

    // After a reload the photo comes back from IndexedDB, and is cleared there once read.
    act(() => { result.current.setReceiptExpense(null) })
    rerender({ ...fixed })
    await saveImportFiles('job-db', [photo])
    act(() => { useBackgroundTasksStore.setState({ tasks: [receiptTask('job-db', RECEIPT)] as never }) })
    await waitFor(() => expect(result.current.receiptExpense?.receiptFiles?.map(f => f.name)).toEqual(['bill.jpg']))
    await waitFor(async () => expect(await getImportFiles('job-db')).toEqual([]))

    // A scan that read nothing only clears the widget.
    act(() => { result.current.setReceiptExpense(null) })
    act(() => { useBackgroundTasksStore.setState({ tasks: [receiptTask('job-n', null, [photo])] as never }) })
    await waitFor(() => expect(useBackgroundTasksStore.getState().tasks).toHaveLength(0))
    expect(result.current.receiptExpense).toBeNull()
  })
})
