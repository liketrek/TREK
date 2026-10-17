import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import TransitJourneyModal from '../../../../components/Planner/TransitJourneyModal'
import BookingImportModal from '../../../../components/Planner/BookingImportModal'
import AirTrailImportModal from '../../../../components/Planner/AirTrailImportModal'
import TripFormModal from '../../../../components/Trips/TripFormModal'
import TripMembersModal from '../../../../components/Trips/TripMembersModal'
import TourDetailDialog from '../../../../components/Tours/TourDetailDialog'
import { useBookingExpenseEditor } from '../../../../pages/tripPlanner/useBookingExpenseEditor'
import { applyTripCoverUpdate } from '../../../../pages/tripPlanner/tripCover'
import { latestReservation } from '../../../../pages/tripPlanner/transportEditorOpeners'
import MConfirmSheet from '../../settings/MConfirmSheet'
import MDayImpactList from '../../../components/MDayImpactList'
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
import MPlacesFilterSheet from '../places/MPlacesFilterSheet'
import MRtStopSheet from '../roadtrip/MRtStopSheet'
import MRtStaySheet from '../roadtrip/MRtStaySheet'
import MRtKindSheet from '../roadtrip/MRtKindSheet'
import MRtInfoSheet from '../roadtrip/MRtInfoSheet'
import MRtCorridorSheet from '../roadtrip/MRtCorridorSheet'
import MRtDraftSheet from '../roadtrip/MRtDraftSheet'
import type { MTripSheetsProps } from '../MTripShell'
import { lockBodyScroll } from '../../../../utils/bodyScrollLock'
import { focusDialog, trapTab } from '../../../../components/shared/dialogFocus'

/** The one global mobile tour-detail owner, independent of which surface selected it. */
export function MSelectedTourDetail({ planner }: Pick<MTripSheetsProps, 'planner'>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const selectedTourId = planner.selectedTour?.place_id ?? null
  const selectedPlaceId = planner.selectedPlace?.id ?? null
  useEffect(() => {
    if (selectedTourId == null || selectedPlaceId == null) return
    const previous = document.activeElement as HTMLElement | null
    const release = lockBodyScroll()
    const panel = panelRef.current
    if (panel) focusDialog(panel)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const openPanels = document.querySelectorAll('[data-m-sheet="open"]')
      if (openPanels.length && openPanels[openPanels.length - 1] !== panel) return
      event.preventDefault()
      planner.setSelectedPlaceId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      release()
      if (previous?.isConnected) previous.focus()
    }
  }, [planner.setSelectedPlaceId, selectedPlaceId, selectedTourId])

  if (!planner.selectedTour || !planner.selectedPlace) return null

  return createPortal(
    <div className="bg-[rgba(0,0,0,0.3)]" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 'var(--bottom-nav-h)' }} role="presentation" onClick={() => planner.setSelectedPlaceId(null)}>
      <div ref={panelRef} style={{ width: '100%', maxHeight: '85vh' }} role="dialog" aria-modal="true" aria-label={planner.selectedPlace.name}
        data-m-sheet="open"
        tabIndex={-1} onClick={event => event.stopPropagation()} onKeyDown={event => trapTab(event, panelRef.current!)}>
        <TourDetailDialog
          tour={planner.selectedTour}
          place={planner.selectedPlace}
          days={planner.days}
          selectedDayId={planner.selectedDayId}
          selectedAssignmentId={planner.selectedAssignmentId}
          assignments={planner.assignments}
          files={planner.files}
          readOnly
          canEdit={false}
          canAssign={planner.can('day_edit', planner.trip)}
          onClose={() => planner.setSelectedPlaceId(null)}
          onAssignToDay={planner.handleAssignToDay}
          onRemoveAssignment={planner.handleRemoveAssignment}
        />
      </div>
    </div>,
    document.body,
  )
}

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
  const { meId, costsBase, openBookingExpense, expenseEditor, onExpenseSaved } = useBookingExpenseEditor({
    tripId, tripCurrency: trip?.currency, receiptExpense: planner.receiptExpense, clearReceiptExpense: planner.clearReceiptExpense,
  })

  return (
    <>
      {/* ── Mobile sheets (shell.sheet routing + the place selection) ── */}
      <MPlaceSheet planner={planner} shell={shell} />
      <MSelectedTourDetail planner={planner} />
      <MDaySheet planner={planner} shell={shell} />
      <MDaysSheet planner={planner} shell={shell} />
      <MAccommodationSheet planner={planner} shell={shell} />
      <MTransportSheet planner={planner} shell={shell} />
      <MBrowseActionsSheet planner={planner} shell={shell} />
      <MMehrSheet planner={planner} shell={shell} />
      {/* The stage's own sheets. Each one checks shell.sheet?.id itself, the draft
          sheet hangs off planner.stopDraft the way the place editor hangs off its flag. */}
      <MRtStopSheet planner={planner} shell={shell} />
      <MRtStaySheet planner={planner} shell={shell} />
      <MRtKindSheet planner={planner} shell={shell} />
      <MRtInfoSheet planner={planner} shell={shell} />
      {/* Before the draft sheet, not after: both sit at the same z, so the one mounted
          later paints on top, and taking a hit onto the trip opens the draft OVER the
          search it came from. */}
      <MRtCorridorSheet planner={planner} shell={shell} />
      <MRtDraftSheet planner={planner} />
      <MExportSheet planner={planner} shell={shell} />
      <MNoteSheet
        planner={planner}
        open={sheet?.id === 'note'}
        payload={sheet?.id === 'note' ? (sheet.payload as MNoteSheetPayload) : undefined}
        onClose={shell.closeSheet}
      />
      <MImportSheet planner={planner} open={sheet?.id === 'import'} onClose={shell.closeSheet} />
      <MPlacesFilterSheet
        open={sheet?.id === 'placesFilter'}
        onClose={shell.closeSheet}
        places={planner.places}
        categories={planner.categories}
        toursEnabled={planner.toursEnabled}
      />

      {/* ── Planner-flag editors (also serve ?create= and the import review) ── */}
      <MPlaceEditSheet planner={planner} onOpenExpense={openBookingExpense} />

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
          // Re-enter the transit search seeded with this journey's route; the
          // existing reservation is replaced on save.
          onChangeRoute={() => planner.changeTransitRoute(planner.transitJourney!)}
          // Hand off to the full transport editor for the booking fields, the same
          // target as the transports tab's pencil (#2148). The store copy may be newer.
          onEditDetails={() => planner.openTransportEditor(latestReservation(planner.reservations, planner.transitJourney!))}
        />
      )}

      {expenseEditor && (
        <MCostSheet
          key={expenseEditor.key}
          tripId={tripId}
          base={costsBase}
          people={planner.tripMembers}
          me={meId}
          editing={expenseEditor.editing}
          prefill={expenseEditor.prefill}
          onClose={expenseEditor.close}
          onSaved={onExpenseSaved}
        />
      )}

      <BookingImportModal isOpen={planner.showBookingImport} onClose={() => planner.setShowBookingImport(false)} tripId={tripId} kind={planner.bookingImportKind} />
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
        onCoverUpdate={applyTripCoverUpdate}
      />
      <TripMembersModal
        isOpen={sheet?.id === 'members'}
        onClose={shell.closeSheet}
        tripId={tripId}
        tripTitle={trip?.title}
        onMembersChanged={planner.refreshMembers}
      />

      {/* Delete-place confirm behind handleDeletePlace (the place edit sheet
          arms the same flag for its own two-tap delete — skip it there).
          A night booked at the place goes down with it, and with the night
          the booking and its expense: the planner adds that as a second
          sentence, the same one the desktop question carries. */}
      <MConfirmSheet
        open={planner.deletePlaceId != null && !planner.showPlaceForm}
        onClose={() => planner.setDeletePlaceId(null)}
        title={t('common.delete')}
        message={planner.deletePlaceId != null && planner.isTourPlace(planner.deletePlaceId) ? (
          <>
            <span className="block">{t('tours.delete.confirmBody')}</span>
            {planner.deletePlaceNote && <span className="mt-1 block">{planner.deletePlaceNote}</span>}
          </>
        ) : planner.deletePlaceNote ? (
          <>
            <span className="block">{t('trip.confirm.deletePlace')}</span>
            <span className="mt-1 block">{planner.deletePlaceNote}</span>
          </>
        ) : t('trip.confirm.deletePlace')}
        confirmLabel={planner.deletePlaceId != null && planner.isTourPlace(planner.deletePlaceId)
          ? t('tours.delete.confirmAction') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          void planner.confirmDeletePlace()
          planner.setDeletePlaceId(null)
        }}
      />

      {/* Clear-day confirm behind the day sheet's "Clear day" (#2470). */}
      <MConfirmSheet
        open={planner.clearDayId != null}
        onClose={planner.cancelClearDay}
        title={planner.clearDayTitle}
        message={t('dayplan.clearDayBody')}
        confirmLabel={t('dayplan.clearDay')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => { void planner.confirmClearDay() }}
      />

      {/* Delete-day confirm behind the days sheet's delete buttons. Mounted
          last, so it opens over that sheet; the list of what goes with the day
          comes ready made from the planner, the same one the desktop shows. */}
      <MConfirmSheet
        open={planner.deleteDayId != null}
        onClose={() => planner.setDeleteDayId(null)}
        title={planner.deleteDayTitle}
        message={t('dayplan.deleteDayBody')}
        confirmLabel={t('dayplan.deleteDay')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => { void planner.confirmDeleteDay() }}
      >
        <MDayImpactList lines={planner.deleteDayLines} label={planner.deleteDayTitle} />
      </MConfirmSheet>
    </>
  )
}
