import type { Reservation } from '../../../types'
import { useTranslation } from '../../../i18n'
import { useTripStore } from '../../../store/tripStore'
import { useToast } from '../../shared/Toast'
import ConfirmDialog from '../../shared/ConfirmDialog'
import { useReservationDelete } from './useReservationDelete'

/**
 * The two things a booking can have done to it without its editor: switching
 * its status, and deleting it after a question. The question is the returned
 * element, to be rendered once next to whatever asks it.
 *
 * `beforeDelete` runs once the question is answered and before the delete goes
 * out, so a detail showing that booking closes first.
 */
export function useBookingActions(tripId: number, onDelete: (id: number) => unknown, beforeDelete?: (r: Reservation) => void) {
  const { t } = useTranslation()
  const toast = useToast()
  const toggleReservationStatus = useTripStore(s => s.toggleReservationStatus)
  const { pendingDelete, requestDelete, cancelDelete, confirmDelete } =
    useReservationDelete(onDelete, () => toast.error(t('reservations.toast.deleteError')), beforeDelete)

  const toggleStatus = (r: Reservation) => {
    toggleReservationStatus(tripId, r.id).catch(() => toast.error(t('reservations.toast.updateError')))
  }

  const confirmDialog = (
    <ConfirmDialog
      isOpen={!!pendingDelete}
      onClose={cancelDelete}
      onConfirm={confirmDelete}
      title={t('reservations.confirm.deleteTitle')}
      message={t('reservations.confirm.deleteBody', { name: pendingDelete?.title ?? '' })}
      confirmLabel={t('common.delete')}
      cancelLabel={t('common.cancel')}
    />
  )

  return { toggleStatus, requestDelete, pendingDelete, confirmDialog }
}
