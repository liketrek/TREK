import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, TrainFront, TramFront, X } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { MBookingCodeStatus, MBookingNotes, MBookingTravelers, MRouteStopCard } from './MBookingFields'
import { useAddonStore } from '../../../../store/addonStore'
import { useTranslation } from '../../../../i18n'
import CustomSelect from '../../../../components/shared/CustomSelect'
import CustomTimePicker from '../../../../components/shared/CustomTimePicker'
import { BookingCodeInput } from '../../../../components/shared/BookingCode'
import AirportSelect from '../../../../components/Planner/AirportSelect'
import LocationSelect from '../../../../components/Planner/LocationSelect'
import { toLocationPicks } from '../../../../components/Planner/locationPicks'
import TransitSearchPanel from '../../../../components/Planner/TransitSearchPanel'
import {
  EMPTY_TRANSPORT_FIELDS, TRANSPORT_TYPE_OPTIONS as TYPE_OPTIONS, emptyCarStop, emptyStationWaypoint, emptyWaypoint,
  transportDayOptions, type StationWaypointForm, type WaypointForm,
} from '../../../../components/Planner/transportEndpoints'
import { useTransportForm } from '../../../../components/Planner/useTransportForm'
import { expenseRequestAfterSave, travelerIdsOf, travelersChanged, uploadBookingFiles } from '../../../../components/Planner/bookingFormModel'
import { useBookingExpenseIntent } from '../../../../components/Planner/useBookingExpenseIntent'
import { Eyebrow, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import MBookingFilesCosts from './MBookingFilesCosts'
import { useTripStore } from '../../../../store/tripStore'
import type { Place, Reservation } from '../../../../types'
import type { BookingReviewDraft } from '../../../../components/Planner/parsedItemToDraft'
import type { BookingExpenseRequest } from '../../../../components/Planner/BookingCostsSection.types'
import type { TripPlanner } from '../MTripShell'

export interface MTransportFormSheetProps {
  planner: TripPlanner
  onOpenExpense: (req: BookingExpenseRequest) => void
}

/**
 * Add/edit transport sheet — the mobile counterpart of the desktop
 * TransportModal, driven by the planner's own editor flags (showTransportModal /
 * editingTransport / transportPrefill / transportModalAutomated) so every entry
 * point (transports tab, day header, timeline, "change route", import review)
 * opens it unchanged. The manual tab supports single- and multi-leg flights /
 * trains; the automated tab embeds the shared TransitSearchPanel. The form, its
 * route rows and the saved shape come from useTransportForm, as on the desktop;
 * saving reuses planner.handleSaveTransport.
 */
export default function MTransportFormSheet({ planner, onOpenExpense }: MTransportFormSheetProps) {
  const {
    t, toast, tripId, trip, days, places, assignments, tripAccommodations, tripMembers,
    showTransportModal, setShowTransportModal,
    editingTransport, setEditingTransport,
    transportModalDayId, setTransportModalDayId,
    transportModalAutomated, setTransportModalAutomated,
    transportPrefill, transitPrefill, setTransitPrefill,
    importReviewActive, advanceImportReview,
    handleSaveTransport, handleDeleteReservation,
    canUploadFiles,
  } = planner
  const { locale } = useTranslation()
  const setReservationTravelers = useTripStore(s => s.setReservationTravelers)

  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))
  const tripHasDates = Boolean(trip?.start_date && trip?.end_date)
  // The trip's places, offered by every location field of the manual tab (#2468).
  const locationPicks = useMemo(() => toLocationPicks(places), [places])

  const {
    form, set, stationRoute, automated, setAutomated, fromPick, setFromPick, toPick, setToPick,
    waypoints, setWaypoints, trainWaypoints, setTrainWaypoints, carStops, setCarStops, moveCarStop,
    pendingFiles, setPendingFiles, travelerIds, setTravelerIds, toggleTraveler, isSaving, setIsSaving,
    seed, payload: buildPayload, writesFlightLegs, writesTrainLegs,
  } = useTransportForm(EMPTY_TRANSPORT_FIELDS)
  // Ref (not state) so handleSubmit reads the intent set by the same click — a
  // state value would be stale in that render's closure and never open the editor.
  const expense = useBookingExpenseIntent(() => handleSubmit())
  const [deleteArmed, setDeleteArmed] = useState(false)
  // Open-time snapshot so the sheet content survives the exit animation.
  const [snap, setSnap] = useState<{ res: Reservation | null; prefill: BookingReviewDraft | null }>({ res: null, prefill: null })

  useEffect(() => {
    if (!showTransportModal) return
    setSnap({ res: editingTransport, prefill: transportPrefill })
    setAutomated(transportModalAutomated)
    expense.reset()
    setDeleteArmed(false)
    // On a review-import, seed the booking's Files with the parsed source document.
    setPendingFiles(!editingTransport && transportPrefill?._sourceFiles ? transportPrefill._sourceFiles : [])
    setTravelerIds(travelerIdsOf(editingTransport))

    // Edit uses the saved `editingTransport`; a review-import populates from the
    // prefill. Either way the init reads the same fields; the reservation still
    // decides edit-vs-create at submit time.
    seed((editingTransport ?? transportPrefill) as Reservation | null, days, {
      isEdit: !!editingTransport,
      fallbackType: 'flight',
      dayId: transportModalDayId ?? '',
      stopDaysFromEndpoints: true,
      resetHiddenRoutes: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTransportModal])

  const res = snap.res
  const prefill = snap.prefill

  const showModeToggle = !res && tripHasDates

  const dayOptions = transportDayOptions(days, t, locale)

  const handleClose = () => {
    if (importReviewActive) { advanceImportReview(); return }
    setShowTransportModal(false)
    setEditingTransport(null)
    setTransportModalDayId(null)
    setTransportModalAutomated(false)
    setTransitPrefill(null)
  }

  // The single save path shared by the manual submit and the automated panel —
  // handleSaveTransport closes the sheet on success; on an import review it also
  // advances to the next parsed item (mirrors the desktop MTripSheets wrapper).
  const saveTransport = async (data: Record<string, unknown> & { title: string }) => {
    const r = await handleSaveTransport(data as never)
    if (importReviewActive && r) advanceImportReview()
    return r
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || isSaving) return
    const withExpense = expense.take()
    setIsSaving(true)
    try {
      const saved = await saveTransport(buildPayload(days, {
        reservation: res, prefill, budgetEnabled: isBudgetEnabled, anchorOnStations: true,
      }))
      // Persist the traveler assignment once we have the reservation id (from the
      // save result on create, or the edited reservation) — only when it changed.
      const savedId = saved?.id ?? res?.id
      if (savedId) {
        const { changed, nextIds } = travelersChanged(res, travelerIds)
        if (changed) await setReservationTravelers(tripId, savedId, nextIds)
      }
      // Runs after both a create and an edit: the sheet only holds files the user just
      // picked, so nothing is uploaded twice, and skipping the edit dropped them without
      // a word (#2534). A save that did not come back with a record uploads nothing.
      if (saved?.id && canUploadFiles) {
        await uploadBookingFiles(fd => planner.tripActions.addFile(tripId, fd), saved.id, pendingFiles, form.title)
      }
      const expenseRequest = expenseRequestAfterSave(withExpense, saved?.id, form)
      if (expenseRequest) onOpenExpense(expenseRequest)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!res) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      toast.warning(t('mobileTrip.tapAgainToDelete'))
      return
    }
    await handleDeleteReservation(res.id)
    handleClose()
  }

  const headerTitle = automated ? t('transit.title') : res ? t('transport.modalTitle.edit') : t('transport.modalTitle.create')

  return (
    <MSheet
      open={showTransportModal}
      onClose={handleClose}
      material="opaque"
      ariaLabel={headerTitle}
      discardGuard={showTransportModal ? { form, waypoints, trainWaypoints, carStops, files: pendingFiles.length, travelers: [...travelerIds] } : undefined}
    >
      <FormSheetHeader
        icon={TrainFront}
        title={headerTitle}
        onClose={handleClose}
        closeLabel={t('common.close')}
      />

      {/* Manual vs Automated switch — creating only; editing a journey re-enters
          via "change route" with the switch hidden. Without trip dates there is
          nothing to plan a departure against, so Automated is not offered. */}
      {showModeToggle && (
        <div className="flex-none px-[18px] pb-2">
          <div className="flex rounded-full bg-[color:var(--m-ic)] p-[3px]">
            {([['manual', t('transport.modeManual')], ['automated', t('transport.modeAutomated')]] as const).map(([m, label]) => {
              const active = (m === 'automated') === automated
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAutomated(m === 'automated')}
                  className={`flex-1 rounded-full py-[7px] text-[0.71875rem] font-semibold ${
                    active ? 'bg-m-act text-m-actfg' : 'text-m-muted'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-[2px]">
        {automated ? (
          /* ── Automated: public transit search ── */
          <>
            <div className="mt-2 flex items-center gap-[10px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[11px]">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)]">
                <TramFront size={17} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[0.8125rem] font-bold text-m-ink">{t('transit.title')}</div>
                <div className="truncate font-geist text-[0.65625rem] text-m-faint">{t('transit.searchHint')}</div>
              </div>
            </div>
            <div className="mt-3">
              <CustomSelect
                value={form.start_day_id}
                onChange={v => set('start_day_id', v)}
                placeholder={t('dayplan.dayN', { n: '?' })}
                options={dayOptions}
                size="sm"
              />
            </div>
            {(() => {
              const transitDay = days.find(d => d.id === Number(form.start_day_id))
              if (!transitDay) {
                return <div className="mt-3 font-geist text-[0.78125rem] text-m-faint">{t('transit.pickDay')}</div>
              }
              // Quick picks offer the chosen day's itinerary, not the whole trip.
              const dayPlaces = (assignments[String(transitDay.id)] || [])
                .slice().sort((a, b) => a.order_index - b.order_index)
                .map(a => places.find(p => p.id === a.place_id))
                .filter((p): p is Place => p != null)
              return (
                <div className="mt-4">
                  <TransitSearchPanel
                    day={transitDay}
                    days={days}
                    places={dayPlaces}
                    accommodations={tripAccommodations}
                    onAdd={(p) => saveTransport(p as Record<string, unknown> & { title: string })}
                    initialFrom={transitPrefill?.from ?? null}
                    initialTo={transitPrefill?.to ?? null}
                    initialTime={transitPrefill?.time ?? null}
                  />
                </div>
              )
            })()}
          </>
        ) : (
          /* ── Manual booking form ── */
          <>
            {/* BOOKING TYPE */}
            <Eyebrow className="mb-[6px] mt-2 uppercase">{t('reservations.bookingType')}</Eyebrow>
            <div className="flex flex-wrap gap-[6px]">
              {TYPE_OPTIONS.map(({ value, labelKey, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('type', value)}
                  aria-pressed={form.type === value}
                  className={`flex items-center gap-[5px] rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
                    form.type === value
                      ? 'bg-m-act text-m-actfg'
                      : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                  }`}
                >
                  <Icon size={12} strokeWidth={2} />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {/* TITLE */}
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.titleLabel')} *</Eyebrow>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('reservations.titlePlaceholder')}
              className={FIELD_CLS}
            />

            {/* ROUTE */}
            {form.type === 'flight' ? (
              <>
                <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.layover.route')}</Eyebrow>
                <div className="flex flex-col gap-[6px]">
                  {waypoints.map((wp, i) => {
                    const isFirst = i === 0
                    const isLast = i === waypoints.length - 1
                    const updateWp = (patch: Partial<WaypointForm>) => setWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
                    const roleLabel = isFirst ? t('reservations.meta.from') : isLast ? t('reservations.meta.to') : t('reservations.layover.stop')
                    return (
                      <div key={i} className="flex flex-col gap-[6px]">
                        <MRouteStopCard
                          t={t}
                          roleLabel={roleLabel}
                          picker={<AirportSelect value={wp.airport} onChange={a => updateWp({ airport: a || null })} />}
                          isFirst={isFirst}
                          isLast={isLast}
                          onRemove={() => setWaypoints(prev => prev.filter((_, j) => j !== i))}
                          times={wp}
                          onTimesChange={updateWp}
                          dayOptions={dayOptions}
                        >
                          <div className="mt-2 flex gap-2">
                            <div className="min-w-0 flex-[1.2]">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.airline')}</Eyebrow>
                              <input type="text" value={wp.airline} onChange={e => updateWp({ airline: e.target.value })} placeholder="Lufthansa" className={FIELD_CLS} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.flightNumber')}</Eyebrow>
                              <input type="text" value={wp.flight_number} onChange={e => updateWp({ flight_number: e.target.value })} placeholder="LH 123" className={FIELD_CLS} />
                            </div>
                            <div className="min-w-0 flex-[0.7]">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.seat')}</Eyebrow>
                              <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="12A" className={FIELD_CLS} />
                            </div>
                          </div>
                          {writesFlightLegs && (
                            <div className="mt-2">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.confirmationCode')}</Eyebrow>
                              <BookingCodeInput
                                value={wp.confirmation_number}
                                onChange={e => updateWp({ confirmation_number: e.target.value })}
                                placeholder={t('reservations.confirmationPlaceholder')}
                                className={FIELD_CLS}
                              />
                            </div>
                          )}
                        </MRouteStopCard>
                        {!isLast && (
                          <button
                            type="button"
                            onClick={() => setWaypoints(prev => [...prev.slice(0, i + 1), emptyWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}
                            className="flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
                          >
                            <Plus size={12} strokeWidth={2.2} /> {t('reservations.layover.addStop')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : stationRoute ? (
              <>
                <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.layover.route')}</Eyebrow>
                <div className="flex flex-col gap-[6px]">
                  {trainWaypoints.map((wp, i) => {
                    const isFirst = i === 0
                    const isLast = i === trainWaypoints.length - 1
                    const updateWp = (patch: Partial<StationWaypointForm>) => setTrainWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
                    const cruise = form.type === 'cruise'
                    const roleLabel = isFirst ? t(cruise ? 'reservations.cruise.embark' : 'reservations.meta.from')
                      : isLast ? t(cruise ? 'reservations.cruise.disembark' : 'reservations.meta.to')
                        : t(cruise ? 'reservations.cruise.port' : 'reservations.layover.stop')
                    return (
                      <div key={i} className="flex flex-col gap-[6px]">
                        <MRouteStopCard
                          t={t}
                          roleLabel={roleLabel}
                          picker={<LocationSelect value={wp.location} onChange={l => updateWp({ location: l || null })} places={locationPicks} />}
                          isFirst={isFirst}
                          isLast={isLast}
                          onRemove={() => setTrainWaypoints(prev => prev.filter((_, j) => j !== i))}
                          times={wp}
                          onTimesChange={updateWp}
                          dayOptions={dayOptions}
                        >
                          {!cruise && <div className="mt-2 flex gap-2">
                            <div className="min-w-0 flex-[1.2]">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.trainNumber')}</Eyebrow>
                              <input type="text" value={wp.train_number} onChange={e => updateWp({ train_number: e.target.value })} placeholder="ICE 123" className={FIELD_CLS} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.platform')}</Eyebrow>
                              <input type="text" value={wp.platform} onChange={e => updateWp({ platform: e.target.value })} placeholder="12" className={FIELD_CLS} />
                            </div>
                            <div className="min-w-0 flex-[0.7]">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.seat')}</Eyebrow>
                              <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="42A" className={FIELD_CLS} />
                            </div>
                          </div>}
                          {writesTrainLegs && !cruise && (
                            <div className="mt-2">
                              <Eyebrow className="mb-[5px] uppercase">{t('reservations.confirmationCode')}</Eyebrow>
                              <BookingCodeInput
                                value={wp.confirmation_number}
                                onChange={e => updateWp({ confirmation_number: e.target.value })}
                                placeholder={t('reservations.confirmationPlaceholder')}
                                className={FIELD_CLS}
                              />
                            </div>
                          )}
                        </MRouteStopCard>
                        {!isLast && (
                          <button
                            type="button"
                            onClick={() => setTrainWaypoints(prev => [...prev.slice(0, i + 1), emptyStationWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}
                            className="flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
                          >
                            <Plus size={12} strokeWidth={2.2} /> {t(cruise ? 'reservations.cruise.addPort' : 'reservations.layover.addStop')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {/* From / To endpoints (non-flight / non-train) */}
                <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.meta.from')}</Eyebrow>
                <LocationSelect value={fromPick.location || null} onChange={l => setFromPick({ location: l || undefined })} places={locationPicks} />
                <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.meta.to')}</Eyebrow>
                <LocationSelect value={toPick.location || null} onChange={l => setToPick({ location: l || undefined })} places={locationPicks} />

                {/* Stops along the drive — cars only (#1797). The rental frame above stays the
                    pick-up and return; these are the places in between, in order. */}
                {form.type === 'car' && (
                  <>
                    <Eyebrow className="mb-[5px] mt-3 uppercase">{t('roadtrip.stops.label')}</Eyebrow>
                    <div className="flex flex-col gap-2">
                      {carStops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {/* The order of these stops IS the route: `sequence` is the array
                              index at save time. Arrows rather than dragging, because the
                              row already carries a location picker and a time picker. */}
                          {carStops.length > 1 && (
                            <div className="flex shrink-0 flex-col">
                              <button
                                type="button"
                                onClick={() => moveCarStop(i, -1)}
                                disabled={i === 0}
                                aria-label={t('dayplan.moveUp')}
                                className="flex items-center px-1 py-[2px] text-m-muted disabled:opacity-30"
                              >
                                <ChevronUp size={14} strokeWidth={2.2} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveCarStop(i, 1)}
                                disabled={i === carStops.length - 1}
                                aria-label={t('dayplan.moveDown')}
                                className="flex items-center px-1 py-[2px] text-m-muted disabled:opacity-30"
                              >
                                <ChevronDown size={14} strokeWidth={2.2} />
                              </button>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <LocationSelect
                              value={stop.location}
                              onChange={l => setCarStops(prev => prev.map((s, j) => (j === i ? { ...s, location: l || null } : s)))}
                              places={locationPicks}
                            />
                          </div>
                          <div className="w-[92px] shrink-0">
                            <CustomTimePicker
                              value={stop.time}
                              onChange={v => setCarStops(prev => prev.map((s, j) => (j === i ? { ...s, time: v } : s)))}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setCarStops(prev => prev.filter((_, j) => j !== i))}
                            aria-label={t('roadtrip.stops.remove')}
                            className="flex shrink-0 items-center p-1 text-m-muted"
                          >
                            <X size={15} strokeWidth={2.2} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCarStops(prev => [...prev, emptyCarStop()])}
                        className="flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
                      >
                        <Plus size={12} strokeWidth={2.2} /> {t('reservations.layover.addStop')}
                      </button>
                    </div>
                  </>
                )}

                {/* Departure row */}
                <div className="mt-3 flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.pickupDate') : t('reservations.date')}</Eyebrow>
                    <CustomSelect value={form.start_day_id} onChange={v => set('start_day_id', v)} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.pickupTime') : t('reservations.startTime')}</Eyebrow>
                    <CustomTimePicker value={form.departure_time} onChange={v => set('departure_time', v)} />
                  </div>
                </div>

                {/* Arrival row */}
                <div className="mt-2 flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.returnDate') : t('reservations.endDate')}</Eyebrow>
                    <CustomSelect value={form.end_day_id} onChange={v => set('end_day_id', v)} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.returnTime') : t('reservations.endTime')}</Eyebrow>
                    <CustomTimePicker value={form.arrival_time} onChange={v => set('arrival_time', v)} />
                  </div>
                </div>
              </>
            )}

            {/* BOOKING CODE + STATUS */}
            <MBookingCodeStatus
              t={t}
              code={form.confirmation_number}
              onCodeChange={value => set('confirmation_number', value)}
              status={form.status}
              onStatusChange={value => set('status', value)}
            />

            {/* NOTES */}
            <MBookingNotes t={t} value={form.notes} onChange={value => set('notes', value)} />

            {/* TRAVELERS */}
            <MBookingTravelers t={t} tripMembers={tripMembers} selectedIds={travelerIds} onToggle={toggleTraveler} />

            {/* FILES + COSTS */}
            <MBookingFilesCosts
              planner={planner}
              reservationId={res?.id}
              pendingFiles={pendingFiles}
              setPendingFiles={setPendingFiles}
              canUploadFiles={canUploadFiles}
              showCosts={isBudgetEnabled}
              createDisabled={!form.title.trim() || isSaving}
              onCreate={expense.create}
              onEdit={item => onOpenExpense({ editItem: item })}
            />
          </>
        )}
      </div>

      {automated ? (
        <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="ms-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold text-m-ink"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <FormSheetFooter
          onDelete={res ? handleDelete : undefined}
          deleteLabel={t('common.delete')}
          deleteArmed={deleteArmed}
          onCancel={handleClose}
          cancelLabel={t('common.cancel')}
          onSubmit={handleSubmit}
          submitLabel={isSaving ? t('common.saving') : res ? t('common.update') : t('common.add')}
          submitDisabled={!form.title.trim() || isSaving}
        />
      )}
    </MSheet>
  )
}
