import TripShareDialog from './TripShareDialog'

interface TripMembersModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
  tripTitle: string
  /** Called after the roster changes (guest/member added, renamed or removed) so the
   *  planner can refresh its members for Costs participants, Collab, etc. */
  onMembersChanged?: () => void
  /** Opens the trip's form from the dialog, for someone who may edit the trip (#2811). */
  onEditTrip?: () => void
}

/** Share: the trip's members, guests and links. The phone has its own sheet (MTripSettingsSheet) on the same hooks. */
export default function TripMembersModal(props: TripMembersModalProps) {
  return <TripShareDialog {...props} />
}
