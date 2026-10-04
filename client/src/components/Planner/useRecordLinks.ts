import { useCallback } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useCanDo } from '../../store/permissionsStore'
import type { BudgetItem, TripFile } from '../../types'

/**
 * The expenses on one booking, transport or place (#2084), for the desktop
 * Costs block and the phone sheets alike: what is linked here, what belongs
 * nowhere yet and could be, and linking and letting go of a link (the expense
 * itself stays in Costs).
 *
 * Only expenses without any link are offered, so linking never pulls one away
 * from another booking or place without anybody noticing. Nothing can be
 * linked before the record exists, so targetId is null until the first save.
 */
export function useExpenseLinks(reservationId: number | null | undefined, placeId?: number | null) {
  const { t } = useTranslation()
  const toast = useToast()
  const budgetItems = useTripStore(s => s.budgetItems)
  const tripId = useTripStore(s => s.trip?.id)
  const updateBudgetItem = useTripStore(s => s.updateBudgetItem)

  const targetId = reservationId || placeId || null
  const linkField = reservationId ? 'reservation_id' : 'place_id'
  const linked = targetId
    ? budgetItems.filter(i => (reservationId ? i.reservation_id === reservationId : i.place_id === placeId))
    : []
  const unlinked = budgetItems.filter(i => !i.reservation_id && !i.place_id)

  const setLink = useCallback(async (item: BudgetItem, value: number | null) => {
    if (!tripId) return
    try { await updateBudgetItem(tripId, item.id, { [linkField]: value }) }
    catch { toast.error(t('common.unknownError')) }
  }, [tripId, updateBudgetItem, linkField, toast, t])

  const link = useCallback((item: BudgetItem) => (targetId ? setLink(item, targetId) : Promise.resolve()), [setLink, targetId])
  const unlink = useCallback((item: BudgetItem) => setLink(item, null), [setLink])

  return { targetId, linked, unlinked, link, unlink }
}

/**
 * Links a file the trip already has to a booking or a place (the store reloads
 * the trip's files, so every list that shows it catches up). Resolves true
 * when it worked; a failure is reported and resolves false.
 */
export function useFileLinker() {
  const { t } = useTranslation()
  const toast = useToast()
  const tripId = useTripStore(s => s.trip?.id)
  const linkFile = useTripStore(s => s.linkFile)

  return useCallback(async (fileId: number, target: { reservation_id?: number; place_id?: number }) => {
    if (!tripId) return false
    try {
      await linkFile(tripId, fileId, target)
      return true
    } catch {
      toast.error(t('reservations.toast.updateError'))
      return false
    }
  }, [tripId, linkFile, toast, t])
}

/**
 * The files on one booking or transport, and the trip's other files it could
 * take, for the phone sheets. A file counts as attached through its own
 * reservation_id or through a link row, the same test the desktop dialog uses.
 */
export function useReservationFiles(reservationId: number | null | undefined) {
  const files = useTripStore(s => s.files)
  const trip = useTripStore(s => s.trip)
  const can = useCanDo()
  const linkFile = useFileLinker()
  const live = (files || []).filter(f => !f.deleted_at)
  const isAttached = (f: TripFile) =>
    !!reservationId && (String(f.reservation_id) === String(reservationId) || (f.linked_reservation_ids || []).includes(reservationId))
  const attached = live.filter(isAttached)
  // Linking is a file edit on the server, so without that right nothing is offered.
  const linkable = reservationId && can('file_edit', trip) ? live.filter(f => !isAttached(f)) : []
  const link = useCallback(
    (file: TripFile) => (reservationId ? linkFile(file.id, { reservation_id: reservationId }) : Promise.resolve(false)),
    [linkFile, reservationId],
  )
  return { attached, linkable, link }
}
