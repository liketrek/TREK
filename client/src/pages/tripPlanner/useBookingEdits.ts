import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { BookingImportPreviewItem } from '@trek/shared'
import { receiptToPrefill } from '../../components/Budget/CostsPanel.helpers'
import type { ExpensePrefill } from '../../components/Budget/CostsPanel'
import { parsedItemToDraft, isTransportItem, isUnplaceableItem, type BookingReviewDraft } from '../../components/Planner/parsedItemToDraft'
import { retriedSave, type BookingSaveSteps } from '../../components/Planner/bookingFormModel'
import { getImportFiles, deleteImportFiles } from '../../db/offlineDb'
import { accommodationRepo } from '../../repo/accommodationRepo'
import { findOnMap, stayQueries } from '../../repo/mapMatchRepo'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import type { TripStoreState } from '../../store/tripStore'
import { isEffectivelyOffline } from '../../sync/networkMode'
import type { Accommodation, Place, Reservation } from '../../types'
import type { Can, PlannerBase } from './plannerTypes'
import type { PlannerDialogs } from './usePlannerDialogs'

interface BookingEditsOptions
  extends Pick<PlannerBase, 'tripId' | 'trip' | 'tripActions' | 'toast' | 't'>,
  Pick<PlannerDialogs, 'editingReservation' | 'setEditingReservation' | 'setShowReservationModal'>,
  Pick<PlannerDialogs, 'editingTransport' | 'setEditingTransport' | 'setShowTransportModal' | 'setTransportModalDayId'> {
  /** The places the planner lists, which an imported venue is matched against by name. */
  places: Place[]
  selectedDayId: TripStoreState['selectedDayId']
  /** Whether a scanned receipt's photo may go up with the expense it fills in. */
  canUploadFiles: ReturnType<Can>
  setTripAccommodations: Dispatch<SetStateAction<Accommodation[]>>
}

/**
 * Writes to the trip's bookings and the review that comes before an import is saved:
 * saving a reservation or a transport, deleting a booking, finding or creating the place
 * an imported stay belongs to, the queue that walks the imported items through their
 * editors one at a time, and the bridge that picks up an import or a scanned receipt
 * the background tasks send here for review.
 *
 * The bridge is an effect, so useTripPlanner calls this hook where that effect always
 * ran: after the day wiring and before the splash.
 */
export function useBookingEdits(options: BookingEditsOptions) {
  const {
    tripId, trip, tripActions, toast, t, places, selectedDayId, canUploadFiles, setTripAccommodations,
    editingReservation, setEditingReservation, setShowReservationModal,
    editingTransport, setEditingTransport, setShowTransportModal, setTransportModalDayId,
  } = options
  // Review-before-save import: each parsed item pre-fills the normal edit modal so
  // the user checks/fixes it, then saves. A ref drives the queue (no stale closures).
  const [reservationPrefill, setReservationPrefill] = useState<BookingReviewDraft | null>(null)
  const [transportPrefill, setTransportPrefill] = useState<BookingReviewDraft | null>(null)
  const [importReviewActive, setImportReviewActive] = useState(false)
  // The expense a scanned receipt pre-fills, opened by the page's expense editor.
  const [receiptExpense, setReceiptExpense] = useState<ExpensePrefill | null>(null)
  const importQueueRef = useRef<BookingImportPreviewItem[]>([])
  // The files this import was parsed from, so each reviewed booking can attach its source doc.
  const importSourceFilesRef = useRef<File[]>([])
  // The tab the items under review came from. A ref, not the bookingImportKind
  // state: the parse outlives navigation and reload, and the review is triggered
  // by the global widget, so by then the state has remounted back to its default.
  // The value comes off the persisted job (#2076).
  const importKindRef = useRef<'transports' | 'bookings'>('bookings')

  // A save is done once the editor's own part (travellers, files) is done too:
  // only then does it say so and close. Until then the editor stays open, so a
  // failed upload leaves the files to try again instead of a closed dialog and a
  // booking that silently lacks them (#2883). Undefined means not done.
  const handleSaveReservation = async (
    data: Record<string, string | number | null> & { title: string },
    { saved: earlier, afterSave }: BookingSaveSteps = {},
  ): Promise<Reservation | undefined> => {
    try {
      // Imported hotel with a reviewed address but no existing place picked: match
      // an existing place by name, else geocode the address and create one, then link it.
      const acc = (data as Record<string, any>).create_accommodation
      if (data.type === 'hotel' && acc && acc.venue && !acc.place_id) {
        const resolved = await resolveImportedPlace(acc.venue)
        acc.place_id = resolved?.id ?? undefined
        // Saved, but nowhere on the map: say so rather than leave the pin to go missing.
        if (resolved && !resolved.placed) toast.warning(t('reservations.import.savedWithoutPin'))
        delete acc.venue
      }
      // A hotel's address lives on the linked place. Write an edited address
      // through to it, otherwise the typed value was silently dropped and the
      // old one reappeared on the next open (#1496).
      if (data.type === 'hotel' && acc && typeof acc.address === 'string') {
        const address = acc.address.trim()
        const linkedPlace = acc.place_id ? places.find(p => p.id === Number(acc.place_id)) : undefined
        if (address && linkedPlace && (linkedPlace.address || '') !== address) {
          try { await tripActions.updatePlace(tripId, linkedPlace.id, { address }) }
          catch { /* keep saving the booking; the address still lands in location */ }
        }
        delete acc.address
      }
      let r: Reservation
      if (editingReservation) {
        // Don't force a day here. The old code pinned it to the (often empty)
        // selected day, which dropped the booking out of the Plan; preserving the
        // old day_id instead left it stale when the date changed. Omitting it lets
        // the server derive the day from the booking's date, or keep the current
        // one when there is no date.
        r = await tripActions.updateReservation(tripId, editingReservation.id, data)
      } else if (earlier) {
        r = await tripActions.updateReservation(tripId, earlier.id, retriedSave(data, earlier))
      } else {
        r = await tripActions.addReservation(tripId, { ...data, day_id: selectedDayId || null })
        // An imported booking auto-creates a linked cost server-side; the saving client gets
        // no budget:created echo, so refresh the budget items here to surface it without a reload.
        if ((data as Record<string, unknown>).create_budget_entry) await tripActions.loadBudgetItems?.(tripId)
      }
      if (data.type === 'hotel') {
        accommodationRepo.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
      }
      await afterSave?.(r)
      toast.success(t(editingReservation ? 'trip.toast.reservationUpdated' : 'trip.toast.reservationAdded'))
      setShowReservationModal(false)
      if (editingReservation) setEditingReservation(null)
      return r
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const handleSaveTransport = async (
    data: Record<string, any> & { title: string },
    { saved: earlier, afterSave }: BookingSaveSteps = {},
  ): Promise<Reservation | undefined> => {
    try {
      let r: Reservation
      if (editingTransport) {
        r = await tripActions.updateReservation(tripId, editingTransport.id, data)
      } else if (earlier) {
        r = await tripActions.updateReservation(tripId, earlier.id, retriedSave(data, earlier))
      } else {
        r = await tripActions.addReservation(tripId, data)
        // Surface the auto-created linked cost without a reload (no budget:created echo to us).
        if (data.create_budget_entry) await tripActions.loadBudgetItems?.(tripId)
      }
      await afterSave?.(r)
      toast.success(t(editingTransport ? 'trip.toast.reservationUpdated' : 'trip.toast.reservationAdded'))
      setShowTransportModal(false)
      setEditingTransport(null)
      setTransportModalDayId(null)
      return r
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const handleDeleteReservation = async (id) => {
    try {
      await tripActions.deleteReservation(tripId, id)
      toast.success(t('trip.toast.deleted'))
      // Refresh accommodations in case a hotel booking was deleted
      accommodationRepo.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  // ── Review-before-save booking import ───────────────────────────────────────
  // Match an existing trip place by name, else create one at the spot the review
  // found, or the first spot the map search knows for its name and address.
  // Returns the place and whether it has a spot on the map (null if even creation
  // failed).
  const resolveImportedPlace = async (
    venue: { name?: string; address?: string | null; lat?: number; lng?: number },
  ): Promise<{ id: number; placed: boolean } | null> => {
    const name = (venue.name || '').trim()
    const n = name.toLowerCase()
    if (n) {
      const existing = places.find(p => p.name?.trim().toLowerCase() === n)
        ?? places.find(p => p.name && (p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase())))
      // A negative id is a place created offline (mutationQueue.nextTempId). Offline
      // the booking waits in the queue behind that place and is sent with its real
      // id. Online the booking goes out at once, and day_accommodations.place_id
      // carries a foreign key, so a temp id there is a 500 instead of a saved booking.
      if (existing && (existing.id > 0 || isEffectivelyOffline())) return { id: existing.id, placed: existing.lat != null && existing.lng != null }
    }
    let lat: number | null = venue.lat ?? null
    let lng: number | null = venue.lng ?? null
    let address: string | null = venue.address ?? null
    if (lat == null || lng == null) {
      try {
        // Name and address, then each alone: a booking site's romanized address
        // often matches nothing and sinks the hotel's name with it. Offline
        // findOnMap answers null and the place is created without coords.
        const hit = await findOnMap(stayQueries(name, venue.address))
        if (hit) {
          lat = hit.lat; lng = hit.lng
          if (!address && hit.address) address = hit.address
        }
      } catch { /* geocode failure is non-fatal: create the place without coords, and say so */ }
    }
    try {
      // Through the store, not placesApi directly: the API answers { place },
      // and reading .id off that wrapper linked nothing. Every save of the
      // hotel then minted another orphan place, because the store never
      // learned about the previous one and the name match above could not
      // find it. addPlace unwraps the response and puts the place into
      // `places`, so the next save reuses it.
      const place = await tripActions.addPlace(tripId, { name: name || address || 'Accommodation', lat, lng, address })
      return place && (place.id > 0 || isEffectivelyOffline()) ? { id: place.id, placed: lat != null && lng != null } : null
    } catch { return null }
  }

  // Open the right edit modal for a parsed item, pre-filled, in create mode.
  //
  // A type neither form can express belongs to whichever tab the user started from.
  // Handing an unreadable transport document to the booking form is what left them
  // with six chips, none of them a transport, and 'other' as the only honest pick
  // (#2076). A type either form DOES know always wins over the tab: one PDF
  // routinely holds a flight and a hotel.
  const openImportItem = (item: BookingImportPreviewItem) => {
    const draft = parsedItemToDraft(item)
    // Attach the file this item was parsed from so it lands in the booking's Files on save.
    const srcName = item.source?.fileName
    const srcFile = srcName ? importSourceFilesRef.current.find(f => f.name === srcName) : undefined
    if (srcFile) draft._sourceFiles = [srcFile]
    if (isTransportItem(item) || (isUnplaceableItem(item) && importKindRef.current === 'transports')) {
      setShowReservationModal(false); setEditingReservation(null); setReservationPrefill(null)
      setEditingTransport(null); setTransportModalDayId(null)
      setTransportPrefill(draft); setShowTransportModal(true)
    } else {
      setShowTransportModal(false); setEditingTransport(null); setTransportPrefill(null); setTransportModalDayId(null)
      setEditingReservation(null)
      setReservationPrefill(draft); setShowReservationModal(true)
    }
  }

  const startImportReview = (
    items: BookingImportPreviewItem[],
    sourceFiles: File[] = [],
    kind: 'transports' | 'bookings' = 'bookings',
  ) => {
    if (!items.length) return
    importSourceFilesRef.current = sourceFiles
    importKindRef.current = kind
    importQueueRef.current = items.slice(1)
    setImportReviewActive(true)
    openImportItem(items[0])
  }

  // Bridge: when a finished background import is sent here for review (the user hit
  // "review" in the background widget, on this or any page), open the per-item flow.
  // Lives in the hook so the page stays a pure wiring container.
  const bgTasks = useBackgroundTasksStore((s) => s.tasks)
  const dismissBgTask = useBackgroundTasksStore((s) => s.dismiss)
  const loadedTripId = trip?.id
  useEffect(() => {
    const task = bgTasks.find(
      (tk) => tk.tripId === String(tripId) && tk.status === 'done' && tk.reviewRequested && !tk.consumed,
    )
    if (task && task.kind === 'costs') {
      // A scanned receipt is reviewed in the expense editor, pre-filled with what
      // was read and with the photo waiting to be attached when it is saved. The
      // photo goes up through the trip's file upload, so it is only put there for
      // someone who may upload files: for anyone else it made the whole save fail,
      // expense included, over an attachment they never picked. Whether they may
      // is only known once this trip is loaded, so the review waits for it.
      if (loadedTripId !== tripId) return
      const receipt = task.receipt
      const jobId = task.id
      const inMemory = task.sourceFiles
      dismissBgTask(jobId)
      if (!receipt) return
      void (async () => {
        const files = inMemory && inMemory.length ? inMemory : await getImportFiles(jobId)
        void deleteImportFiles(jobId)
        setReceiptExpense(receiptToPrefill(receipt, canUploadFiles ? files : []))
      })()
    } else if (task && task.items && task.items.length > 0) {
      // Hand the items (and the source files, to attach to each booking) to the review flow
      // and clear the widget entry: once the user hit "review", the background card is done.
      const items = task.items
      const jobId = task.id
      const inMemory = task.sourceFiles
      const kind = task.kind === 'transports' ? 'transports' : 'bookings'
      dismissBgTask(jobId)
      // Prefer the in-memory files (immediate path); after a reload they live in IndexedDB.
      void (async () => {
        const files = inMemory && inMemory.length ? inMemory : await getImportFiles(jobId)
        void deleteImportFiles(jobId)
        startImportReview(items, files, kind)
      })()
    }
  }, [bgTasks, tripId, startImportReview, dismissBgTask, canUploadFiles, loadedTripId])

  // Called when a reviewed item's modal closes (saved or skipped): open the next,
  // or finish the review session and refresh accommodations.
  const advanceImportReview = () => {
    const queue = importQueueRef.current
    if (queue.length > 0) {
      importQueueRef.current = queue.slice(1)
      openImportItem(queue[0])
      return
    }
    importQueueRef.current = []
    setImportReviewActive(false)
    setShowReservationModal(false); setEditingReservation(null); setReservationPrefill(null)
    setShowTransportModal(false); setEditingTransport(null); setTransportPrefill(null); setTransportModalDayId(null)
    accommodationRepo.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
    // Imported bookings auto-create their linked costs server-side, but the saving client
    // suppresses its own budget:created echo (X-Socket-Id), so reload the budget items here
    // to surface those expenses without a manual page refresh.
    void tripActions.loadBudgetItems?.(tripId)
  }

  return {
    handleSaveReservation, handleSaveTransport, handleDeleteReservation, startImportReview, advanceImportReview,
    reservationPrefill, transportPrefill, importReviewActive, receiptExpense, setReceiptExpense,
  }
}

export type BookingEdits = ReturnType<typeof useBookingEdits>
