import { useMemo } from 'react'
import type { AssignmentsMap, BudgetItem, Day, Reservation, TripFile } from '../../../types'
import type { ViewContribution } from '../../../api/client'
import { useTranslation } from '../../../i18n'
import { useTripStore } from '../../../store/tripStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { usePluginViewContributions } from '../../Plugins/PluginContributions'
import { TRANSPORT_TYPES } from '../../../utils/dayMerge'
import { buildAssignmentLookup, costsFor } from './bookingsModel'
import { bookingFacts } from './bookingFacts'
import { filesFor } from '../../../utils/reservationFiles'
import { canShowOnMap } from './showOnMap'
import { useBookingActions } from './useBookingActions'
import { useReservationDetailPlugins } from './useReservationDetailPlugins'
import BookingDetailDialog from './BookingDetailDialog'

export interface BookingDetailHostProps {
  r: Reservation
  tripId: number
  days: Day[]
  assignments: AssignmentsMap
  /** The trip's files; the ones attached to this booking are picked here. */
  files: TripFile[]
  /** reservation_edit: renaming, the status switch and Delete. */
  canEdit: boolean
  /** What plugins add to this booking in the view it belongs to. */
  contributions: ViewContribution[]
  onClose: () => void
  /** The booking's editor. Without it the dialog has no Edit. */
  onEdit?: (r: Reservation) => void
  onDelete: (id: number) => unknown
  /** Offered only when the booking has something the map can show. */
  onShowOnMap?: (r: Reservation) => void
  isOnMap?: (r: Reservation) => boolean
  onEditExpense?: (item: BudgetItem) => void
  /** Offered for a transit journey only. */
  onChangeRoute?: (r: Reservation) => void
  onNavigateToFiles: () => void
}

/**
 * A booking's detail dialog with everything it needs: its facts, files and
 * linked expenses, the plugins that draw into it, the status switch and the
 * delete question. The Bookings and Transports tabs and the plan open the same
 * one, so it reads the same wherever a booking is clicked.
 *
 * Whatever leaves the dialog (the editor, the map, an expense, the files) closes
 * it first.
 */
export default function BookingDetailHost(p: BookingDetailHostProps) {
  const { r, onClose } = p
  const { t, locale } = useTranslation()
  const budgetItems = useTripStore(s => s.budgetItems)
  const tripCurrency = useTripStore(s => s.trip?.currency) || 'EUR'
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const detailPlugins = useReservationDetailPlugins()
  const actions = useBookingActions(p.tripId, p.onDelete, onClose)

  const assignmentLookup = useMemo(() => buildAssignmentLookup(p.days, p.assignments), [p.days, p.assignments])
  const facts = useMemo(
    () => bookingFacts(r, { t, locale, timeFormat, days: p.days, assignmentLookup, tripCurrency, hasLinkedCost: costsFor(r.id, budgetItems, tripCurrency).length > 0 }),
    [r, t, locale, timeFormat, p.days, assignmentLookup, tripCurrency, budgetItems],
  )
  const linkedCosts = useMemo(() => budgetItems.filter(b => b.reservation_id === r.id), [budgetItems, r.id])

  const { onEdit, onShowOnMap, onEditExpense, onChangeRoute, onNavigateToFiles } = p
  return (
    <>
      <BookingDetailDialog
        r={r}
        facts={facts}
        files={filesFor(r, p.files)}
        linkedCosts={linkedCosts}
        tripId={p.tripId}
        canEdit={p.canEdit}
        covered={!!actions.pendingDelete}
        onClose={onClose}
        onEdit={onEdit ? () => { onClose(); onEdit(r) } : undefined}
        onDelete={() => actions.requestDelete(r)}
        onToggleStatus={() => actions.toggleStatus(r)}
        onShowOnMap={onShowOnMap && canShowOnMap(r) ? () => { onClose(); onShowOnMap(r) } : undefined}
        onMap={p.isOnMap?.(r)}
        onEditExpense={onEditExpense ? item => { onClose(); onEditExpense(item) } : undefined}
        onChangeRoute={onChangeRoute && r.type === 'transit' ? () => { onClose(); onChangeRoute(r) } : undefined}
        onNavigateToFiles={() => { onClose(); onNavigateToFiles() }}
        contributions={p.contributions}
        detailPlugins={detailPlugins}
      />
      {actions.confirmDialog}
    </>
  )
}

export type BookingDetailPopupProps = Omit<BookingDetailHostProps, 'contributions'>

/**
 * The detail for a caller that holds no plugin lookup of its own, such as the
 * plan: it asks for the contributions of the view the booking belongs to, once
 * per opening. A tab passes its own lookup to BookingDetailHost instead.
 */
export function BookingDetailPopup(props: BookingDetailPopupProps) {
  const view = TRANSPORT_TYPES.has(props.r.type) ? 'transports' : 'reservations'
  return <ContributedDetail key={view} view={view} {...props} />
}

function ContributedDetail({ view, ...props }: BookingDetailPopupProps & { view: 'transports' | 'reservations' }) {
  const contribFor = usePluginViewContributions(view, props.tripId)
  return <BookingDetailHost {...props} contributions={contribFor(props.r.id)} />
}
