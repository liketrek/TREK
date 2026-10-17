import ConfirmDialog from '../shared/ConfirmDialog'

interface TimeConfirmState {
  dayId: number
  fromId: number
  time: string
  fromType?: string
  toType?: string
  toId?: number
  insertAfter?: boolean
  reorderIds?: number[]
}

interface DayPlanSidebarTimeConfirmModalProps {
  timeConfirm: TimeConfirmState | null
  setTimeConfirm: (v: TimeConfirmState | null) => void
  confirmTimeRemoval: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

/**
 * Asks before a move drops a place's time: a timed place moved out of the
 * day's time order cannot keep its time there. The shared question dialog
 * carries the look, Escape and the backdrop.
 */
export function DayPlanSidebarTimeConfirmModal({ timeConfirm, setTimeConfirm, confirmTimeRemoval, t }: DayPlanSidebarTimeConfirmModalProps) {
  return (
    <ConfirmDialog
      isOpen={!!timeConfirm}
      onClose={() => setTimeConfirm(null)}
      onConfirm={confirmTimeRemoval}
      title={t('dayplan.confirmRemoveTimeTitle')}
      message={timeConfirm ? t('dayplan.confirmRemoveTimeBody', { time: timeConfirm.time }) : ''}
      confirmLabel={t('common.confirm')}
      cancelLabel={t('common.cancel')}
    />
  )
}
