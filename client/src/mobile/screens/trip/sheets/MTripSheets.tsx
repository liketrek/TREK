import { useState } from 'react'
import TransitJourneyModal from '../../../../components/Planner/TransitJourneyModal'
import BookingImportModal from '../../../../components/Planner/BookingImportModal'
import AirTrailImportModal from '../../../../components/Planner/AirTrailImportModal'
import TripFormModal from '../../../../components/Trips/TripFormModal'
import TripMembersModal from '../../../../components/Trips/TripMembersModal'
import type { ExpensePrefill } from '../../../../components/Budget/CostsPanel'
import { useAuthStore } from '../../../../store/authStore'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useTripStore } from '../../../../store/tripStore'
import MConfirmSheet from '../../settings/MConfirmSheet'
import MDaySheet from './MDaySheet'
import MDaysSheet from './MDaysSheet'
import MAccommodationSheet from './MAccommodationSheet'
import MPlaceSheet from './MPlaceSheet'
import MPlaceEditSheet from './MPlaceEditSheet'
import MReservationSheet from './MReservationSheet'
import MTransportFormSheet from './MTransportFormSheet'
import MCostSheet from './MCostSheet'
import MTransportSheet from './MTransportSheet'
import MBrowseActionsSheet from './MBrowseActionsSheet'
import MNoteSheet, { type MNoteSheetPayload } from './MNoteSheet'
import MImportSheet from './MImportSheet'
import MExportSheet from './MExportSheet'
import MMehrSheet from './MMehrSheet'
import type { BookingExpenseRequest } from '../../../../components/Planner/BookingCostsSection.types'
import type { BudgetItem } from '../../../../types'
import type { MTripSheetsProps } from '../MTripShell'

/**
 * Sheet host of the mobile trip screen — always mounted below the shell. Two
 * families live here: the mobile sheets routed via shell.sheet (day, days,
 * transport, bract, note, import, export, mehr — the place inspector keys off
 * the planner's place selection instead), and the planner-flag editors that
 * every entry point (?create=, import review, timeline, map long-press) opens
 * through useTripPlanner state. The transport/booking/transit/import/member
 * editors reuse the shared desktop modals until they get mobile counterparts;
 * they carry the full behaviour (undo, WS sync, review flow) unchanged.
 */
export default function MTripSheets({ planner, shell }: MTripSheetsProps) {
  const { t, toast, tripId, trip, tripActions } = planner
  const sheet = shell.sheet

  // Booking-linked expense editor (save-then-open from the booking modals) —
  // same page-level wiring as the desktop planner.
  const meId = useAuthStore(s => s.user?.id ?? -1)
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const loadBudgetItems = useTripStore(s => s.loadBudgetItems)
  const [bookingExpense, setBookingExpense] = useState<{ editing: BudgetItem | null; prefill?: ExpensePrefill } | null>(null)
  const openBookingExpense = (req: BookingExpenseRequest) => {
    if (req.editItem) setBookingExpense({ editing: req.editItem })
    else if (req.prefill) setBookingExpense({ editing: null, prefill: req.prefill })
  }
  const costsBase = (displayCurrency || trip?.currency || 'EUR').toUpperCase()

  return (
    <>
      {/* ── Mobile sheets (shell.sheet routing + the place selection) ── */}
      <MPlaceSheet planner={planner} shell={shell} />
      <MDaySheet planner={planner} shell={shell} />
      <MDaysSheet planner={planner} shell={shell} />
      <MAccommodationSheet planner={planner} shell={shell} />
      <MTransportSheet planner={planner} shell={shell} />
      <MBrowseActionsSheet planner={planner} shell={shell} />
      <MMehrSheet planner={planner} shell={shell} />
      <MExportSheet planner={planner} shell={shell} />
      <MNoteSheet
        planner={planner}
        open={sheet?.id === 'note'}
        payload={sheet?.id === 'note' ? (sheet.payload as MNoteSheetPayload) : undefined}
        onClose={shell.closeSheet}
      />
      <MImportSheet planner={planner} open={sheet?.id === 'import'} onClose={shell.closeSheet} />

      {/* ── Planner-flag editors (also serve ?create= and the import review) ── */}
      <MPlaceEditSheet planner={planner} />

      <MReservationSheet planner={planner} onOpenExpense={openBookingExpense} />

      <MTransportFormSheet planner={planner} onOpenExpense={openBookingExpense} />

      {/* Journey view for a saved public-transit entry (#1065) */}
      {planner.transitJourney && (
        <TransitJourneyModal
          reservation={planner.reservations.find(r => r.id === planner.transitJourney!.id) ?? planner.transitJourney}
          canEdit={planner.can('day_edit', trip)}
          onClose={() => planner.setTransitJourney(null)}
          onSave={async (fields) => {
            await tripActions.updateReservation(tripId, planner.transitJourney!.id, fields)
            planner.setTransitJourney(null)
          }}
          onDelete={async () => {
            await planner.handleDeleteReservation(planner.transitJourney!.id)
            planner.setTransitJourney(null)
          }}
          onChangeRoute={() => {
            // Re-enter the transit search seeded with this journey's route; the
            // existing reservation is replaced on save.
            const journey = planner.transitJourney!
            const eps = journey.endpoints || []
            const from = eps.find(e => e.role === 'from')
            const to = eps.find(e => e.role === 'to')
            planner.setTransitPrefill({
              from: from ? { name: from.name, lat: from.lat, lng: from.lng } : null,
              to: to ? { name: to.name, lat: to.lat, lng: to.lng } : null,
            })
            planner.setEditingTransport(journey)
            planner.setTransportModalDayId(journey.day_id ?? null)
            planner.setTransportModalAutomated(true)
            planner.setTransitJourney(null)
            planner.setShowTransportModal(true)
          }}
        />
      )}

      {bookingExpense && (
        <MCostSheet
          tripId={tripId}
          base={costsBase}
          people={planner.tripMembers}
          me={meId}
          editing={bookingExpense.editing}
          prefill={bookingExpense.prefill}
          onClose={() => setBookingExpense(null)}
          onSaved={() => { setBookingExpense(null); loadBudgetItems(tripId) }}
        />
      )}

      <BookingImportModal isOpen={planner.showBookingImport} onClose={() => planner.setShowBookingImport(false)} tripId={tripId} />
      <AirTrailImportModal isOpen={planner.showAirTrailImport} onClose={() => planner.setShowAirTrailImport(false)} tripId={tripId} pushUndo={planner.pushUndo} />

      {/* Trip edit + share/members, opened from the Mehr sheet. */}
      <TripFormModal
        isOpen={sheet?.id === 'tripedit'}
        onClose={shell.closeSheet}
        onSave={async (data) => {
          await tripActions.updateTrip(tripId, data)
          toast.success(t('trip.toast.tripUpdated'))
        }}
        trip={trip}
        onCoverUpdate={(_, coverUrl) => useTripStore.setState(state => ({
          trip: state.trip ? { ...state.trip, cover_image: coverUrl } : state.trip,
        }))}
      />
      <TripMembersModal
        isOpen={sheet?.id === 'members'}
        onClose={shell.closeSheet}
        tripId={tripId}
        tripTitle={trip?.title}
        onMembersChanged={planner.refreshMembers}
      />

      {/* Delete-place confirm behind handleDeletePlace (the place edit sheet
          arms the same flag for its own two-tap delete — skip it there). */}
      <MConfirmSheet
        open={planner.deletePlaceId != null && !planner.showPlaceForm}
        onClose={() => planner.setDeletePlaceId(null)}
        title={t('common.delete')}
        message={t('trip.confirm.deletePlace')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          void planner.confirmDeletePlace()
          planner.setDeletePlaceId(null)
        }}
      />
    </>
  )
}
