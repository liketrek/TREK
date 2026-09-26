import type { Dispatch, SetStateAction } from 'react'
import PlFileAttach from './PlFileAttach'
import MLinkedCosts from './MLinkedCosts'
import { useReservationFiles } from '../../../../components/Planner/useRecordLinks'
import type { BudgetItem } from '../../../../types'
import type { TripPlanner } from '../MTripShell'

interface MBookingFilesCostsProps {
  planner: TripPlanner
  /** The saved booking or transport; linking waits for it. */
  reservationId: number | null | undefined
  pendingFiles: File[]
  setPendingFiles: Dispatch<SetStateAction<File[]>>
  canUploadFiles: boolean
  /** The Costs addon is on. */
  showCosts: boolean
  createDisabled: boolean
  onCreate: () => void
  onEdit: (item: BudgetItem) => void
}

/**
 * The foot of the phone booking and transport sheets (#2084): the Files row
 * with the files already on the booking and one of the trip's to link, then
 * the Costs block with its linked expenses. The attached files are listed
 * whoever uploaded them, so one from the desktop shows here too (#2217). Both
 * sheets carry exactly this, so it lives here once.
 */
export default function MBookingFilesCosts({
  planner, reservationId, pendingFiles, setPendingFiles, canUploadFiles, showCosts, createDisabled, onCreate, onEdit,
}: MBookingFilesCostsProps) {
  const bookingFiles = useReservationFiles(reservationId)
  const showFiles = canUploadFiles || bookingFiles.attached.length > 0 || bookingFiles.linkable.length > 0

  return (
    <>
      {showFiles && (
        <PlFileAttach
          planner={planner}
          files={pendingFiles}
          onAdd={files => setPendingFiles(prev => [...prev, ...files])}
          onRemove={idx => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
          hideHint
          canAttach={canUploadFiles}
          attached={bookingFiles.attached}
          linkable={bookingFiles.linkable}
          onLink={bookingFiles.link}
        />
      )}
      {showCosts && (
        <MLinkedCosts
          reservationId={reservationId}
          hintKey="reservations.createExpenseHint"
          createDisabled={createDisabled}
          onCreate={onCreate}
          onEdit={onEdit}
        />
      )}
    </>
  )
}
