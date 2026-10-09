import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { X, Trash2, ChevronUp, ChevronDown, CalendarDays } from 'lucide-react'
import ConfirmDialog from '../shared/ConfirmDialog'
import CustomSelect from '../shared/CustomSelect'
import { BookingCodeInput } from '../shared/BookingCode'
import CustomTimePicker from '../shared/CustomTimePicker'
import { Tooltip } from '../shared/Tooltip'
import AirportSelect from './AirportSelect'
import LocationSelect from './LocationSelect'
import { toLocationPicks } from './locationPicks'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useTripStore } from '../../store/tripStore'
import { useAddonStore } from '../../store/addonStore'
import type { Day, Place, Accommodation, Reservation, TripFile, AssignmentsMap } from '../../types'
import { BookingNotesFilesCosts } from './BookingNotesFilesCosts'
import { TravelerPicker } from './TravelerPicker'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import type { BookingExpenseRequest } from './BookingCostsSection.types'
import type { BookingReviewDraft } from './parsedItemToDraft'
import TransitSearchPanel, { type PickedPlace } from './TransitSearchPanel'
import { BookingDialogHeader, StatusPill } from './bookings/BookingDialogShell'
import { DialogShell, DialogSection, DialogFooter, FooterSpacer, DialogButton, DeleteButton } from '../shared/DialogShell'
import { INPUT, READONLY_BOX, GRID_2, GRID_3, PANEL, SEARCH_ON_PANEL, EditorField, Segmented, PillSelect, AddRowButton } from '../shared/dialogParts'
import { fs, Eyebrow, type StatusTone } from './bookings/bookingParts'
import { typeInfo } from './bookings/bookingsModel'
import {
  EMPTY_TRANSPORT_FIELDS, TRANSPORT_TYPE_OPTIONS as TYPE_OPTIONS, emptyCarStop, emptyStationWaypoint, emptyWaypoint,
  transportDayOptions, type StationWaypointForm, type WaypointForm,
} from './transportEndpoints'
import { useTransportForm } from './useTransportForm'
import { expenseRequestAfterSave, pendingImportExpense, travelerIdsOf, travelersChanged, uploadBookingFiles } from './bookingFormModel'
import { useBookingExpenseIntent } from './useBookingExpenseIntent'
import { useBookingFileAttach } from './useBookingFileAttach'

const defaultForm = {
  ...EMPTY_TRANSPORT_FIELDS,
  url: '',
  meta_airline: '',
  meta_flight_number: '',
  meta_train_number: '',
  meta_platform: '',
  meta_seat: '',
}

interface TransportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, any> & { title: string }) => Promise<Reservation | undefined>
  reservation: Reservation | null
  days: Day[]
  selectedDayId: number | null
  files?: TripFile[]
  onFileUpload?: (fd: FormData) => Promise<unknown>
  onFileDelete?: (fileId: number) => Promise<void>
  /** Deletes the reservation being edited. Omit to hide the delete action (create mode, or no permission). */
  onDelete?: () => void | Promise<void>
  onOpenExpense?: (req: BookingExpenseRequest) => void
  // Pre-fill a brand-new transport booking from a parsed import item (review-
  // before-save); like `reservation` for the form but stays in create mode.
  prefill?: BookingReviewDraft | null
  /** Data for the Automated (public transit) mode's quick picks. */
  places?: Place[]
  /** Day→assignments map, used to scope the quick picks to the chosen day (#1460). */
  assignments?: AssignmentsMap
  accommodations?: Accommodation[]
  /** Open directly in the Automated public-transit mode (day-header tram button, "change route"). */
  initialAutomated?: boolean
  /** Transit search needs real dates to depart on, so the Automated mode is hidden on a dateless trip. */
  tripHasDates?: boolean
  /** Pre-seed the transit search — used by "change route" and by per-leg planning. */
  transitPrefill?: { from?: PickedPlace | null; to?: PickedPlace | null; time?: string | null } | null
  /** Trip members + guests, for the traveler picker (#1517). */
  tripMembers?: TripMember[]
}

export function TransportModal({ isOpen, onClose, onSave, reservation, days, selectedDayId, files = [], onFileUpload, onFileDelete, onDelete, onOpenExpense, prefill = null, places = [], assignments = {}, accommodations = [], initialAutomated = false, transitPrefill = null, tripHasDates = true, tripMembers = [] }: TransportModalProps) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  // The trip's places, offered by every location field of the manual tab (#2468).
  const locationPicks = useMemo(() => toLocationPicks(places), [places])
  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))
  const budgetItems = useTripStore(s => s.budgetItems)
  const deleteBudgetItem = useTripStore(s => s.deleteBudgetItem)
  const setReservationTravelers = useTripStore(s => s.setReservationTravelers)
  const { id: tripId } = useParams<{ id: string }>()
  // Set right before submitting when the user clicked "create/edit expense", so
  // the post-save handler knows to open the Costs editor for the saved booking.
  const expense = useBookingExpenseIntent(() => handleSubmit(), {
    remove: item => deleteBudgetItem(Number(tripId), item.id),
    onError: () => toast.error(t('common.unknownError')),
  })
  const {
    form, set, stationRoute, automated, setAutomated, fromPick, setFromPick, toPick, setToPick,
    waypoints, setWaypoints, trainWaypoints, setTrainWaypoints, carStops, setCarStops, moveCarStop,
    pendingFiles, setPendingFiles, travelerIds, setTravelerIds, toggleTraveler, isSaving, setIsSaving,
    seed, payload, writesFlightLegs, writesTrainLegs,
  } = useTransportForm(defaultForm)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const attach = useBookingFileAttach({ reservation, files, onFileUpload, setPendingFiles, toast, t })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTravelerIds(travelerIdsOf(reservation))
    // Edit uses the saved `reservation`; a review-import populates from `prefill`.
    // Either way the init reads the same fields — `reservation` still decides
    // edit-vs-create at submit time.
    const src = (reservation ?? prefill) as Reservation | null
    setAutomated(initialAutomated)
    // On a review-import, seed the booking's Files with the parsed source document.
    setPendingFiles(!reservation && prefill?._sourceFiles ? prefill._sourceFiles : [])
    // An import whose type could not be read opens as 'transport_other', not
    // 'flight': it has to arrive as something the user corrects, and a wrong flight
    // looks right enough to be saved unnoticed (#2076).
    seed(src, days, {
      isEdit: !!reservation,
      fallbackType: 'transport_other',
      dayId: selectedDayId ?? '',
      stopDaysFromEndpoints: false,
      resetHiddenRoutes: false,
      extraFields: (s, meta) => ({
        url: s.url || '',
        meta_airline: meta.airline || '',
        meta_flight_number: meta.flight_number || '',
        meta_train_number: meta.train_number || '',
        meta_platform: meta.platform || '',
        meta_seat: meta.seat || '',
      }),
    })
  }, [isOpen, reservation, prefill, selectedDayId, budgetItems])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!form.title.trim()) return
    setIsSaving(true)
    try {
      const saved = await onSave(payload(days, {
        reservation, prefill, budgetEnabled: isBudgetEnabled, anchorOnStations: false, url: form.url,
      }))
      // Persist the traveler assignment once we have the reservation id (create → save
      // result, edit → existing reservation), and only when it actually changed (#1517).
      const savedId = saved?.id ?? reservation?.id
      if (savedId && tripId) {
        const { changed, nextIds } = travelersChanged(reservation, travelerIds)
        if (changed) {
          try { await setReservationTravelers(tripId, savedId, nextIds) } catch { toast.error(t('common.unknownError')) }
        }
      }
      if (!reservation?.id && saved?.id && pendingFiles.length > 0 && onFileUpload) {
        await uploadBookingFiles(onFileUpload, saved.id, pendingFiles, form.title)
      }
      // The user asked to create/edit the linked expense — open the Costs editor
      // for the now-saved booking. Gated on saved?.id so a failed save doesn't.
      const expenseRequest = expenseRequestAfterSave(expense.take(), saved?.id, form)
      if (expenseRequest && onOpenExpense) onOpenExpense(expenseRequest)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setIsSaving(false)
    }
  }

  // On an import review (not yet saved), preview the parsed price as the cost that will be
  // linked: the same entry the save sends, so the two cannot name different currencies.
  const pendingExpense = pendingImportExpense(reservation, prefill, form.type)

  const dayOptions = transportDayOptions(days, t, locale)

  const titleId = 'transport-editor-title'
  // The head band takes the colour of the card the booking will sit on.
  const tone: StatusTone = automated || form.type === 'transit' ? 'transit' : form.status
  const isCar = form.type === 'car'
  const routeNames = (form.type === 'flight'
    ? waypoints.map(w => w.airport?.iata)
    : stationRoute
      ? trainWaypoints.map(w => w.location?.name)
      : [fromPick.location?.name, ...(isCar ? carStops.map(s => s.location?.name) : []), toPick.location?.name]
  ).filter(Boolean)
  const shownType = typeInfo(form.type)

  const dayField = (label: string, value: string | number, onChange: (value: string | number) => void) => (
    <EditorField label={label}>
      <CustomSelect value={value} onChange={onChange} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
    </EditorField>
  )
  const timeField = (label: string, value: string, onChange: (value: string) => void) => (
    <EditorField label={label}>
      <CustomTimePicker value={value} onChange={onChange} />
    </EditorField>
  )
  const zoneField = (label: string, tz: string) => (
    <EditorField label={label}>
      <Tooltip label={tz}>
        <div className={READONLY_BOX}>{tz || ' '}</div>
      </Tooltip>
    </EditorField>
  )

  // Manual vs Automated creation (#1065), only while creating: a journey is
  // edited again through "change route" with the switch hidden. A trip without
  // dates has no day to depart on, so it gets the manual form alone. The switch
  // sits in the head band, which stays put while the body swaps modes.
  const modeSwitch = !reservation && tripHasDates && (
    <span className="ms-auto">
      <Segmented
        label={`${t('transport.modeManual')} / ${t('transport.modeAutomated')}`}
        value={automated ? 'automated' : 'manual'}
        onChange={mode => setAutomated(mode === 'automated')}
        options={[
          { value: 'manual', label: t('transport.modeManual') },
          { value: 'automated', label: t('transport.modeAutomated') },
        ]}
      />
    </span>
  )

  // Until there is a title, the line under it says the field is required:
  // Add stays greyed out without one, and a disabled button cannot say why.
  let headerSub: string | undefined
  if (automated) headerSub = t('transit.searchHint')
  else if (!form.title.trim()) headerSub = `${t('reservations.titleLabel')} *`
  else if (routeNames.length >= 2) headerSub = routeNames.join(' → ')

  const header = (
    <BookingDialogHeader
      tone={tone}
      type={automated ? 'transit' : form.type}
      labelId={titleId}
      onClose={onClose}
      eyebrow={automated ? undefined : reservation ? t('transport.modalTitle.edit') : t('transport.modalTitle.create')}
      title={automated ? t('transit.title') : undefined}
      titleInput={automated ? undefined : {
        value: form.title,
        onChange: value => set('title', value),
        label: t('reservations.titleLabel'),
        placeholder: t('reservations.titlePlaceholder'),
        required: true,
      }}
      sub={headerSub}
      subWraps={automated}
      pills={(
        <>
          {/* The search runs against one day; it heads the band next to the mode switch. */}
          {automated && (
            <PillSelect
              label={t('reservations.date')}
              value={String(form.start_day_id)}
              onChange={value => set('start_day_id', value === '' ? '' : Number(value))}
              options={dayOptions.map(o => ({ value: String(o.value), label: o.label, hint: 'badge' in o ? o.badge : undefined, icon: <CalendarDays size={13} strokeWidth={2.2} className="text-content-faint" /> }))}
            />
          )}
          {!automated && (
            <StatusPill status={form.status} onToggle={() => set('status', form.status === 'confirmed' ? 'pending' : 'confirmed')} />
          )}
          {!automated && (
            <PillSelect
              label={t('reservations.bookingType')}
              value={form.type}
              onChange={value => set('type', value)}
              options={TYPE_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey), icon: <o.Icon size={14} style={{ color: typeInfo(o.value).color }} /> }))}
              fallback={{ label: t(shownType.chipKey), icon: <shownType.Icon size={14} style={{ color: shownType.color }} /> }}
            />
          )}
          {modeSwitch}
        </>
      )}
    />
  )

  const footer = (
    <DialogFooter>
      {!automated && reservation?.id && onDelete && <DeleteButton onClick={() => setShowDeleteConfirm(true)} />}
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      {!automated && (
        <DialogButton variant="primary" onClick={() => handleSubmit()} disabled={isSaving || !form.title.trim()}>
          {isSaving ? t('common.saving') : reservation ? t('common.update') : t('common.add')}
        </DialogButton>
      )}
    </DialogFooter>
  )

  const transitSearch = () => {
    const transitDay = days.find(d => d.id === Number(form.start_day_id))
    if (!transitDay) return <p className="m-0 text-content-faint" style={fs(13, 'body')}>{t('transit.pickDay')}</p>
    // Quick picks offer the chosen day's itinerary, not the whole trip (#1460).
    const dayPlaces = (assignments[String(transitDay.id)] || [])
      .slice().sort((a, b) => a.order_index - b.order_index)
      .map(a => places.find(p => p.id === a.place_id))
      .filter((p): p is Place => p != null)
    return (
      <TransitSearchPanel
        day={transitDay}
        days={days}
        places={dayPlaces}
        accommodations={accommodations}
        onAdd={(payload) => onSave(payload as Record<string, any> & { title: string })}
        initialFrom={transitPrefill?.from ?? null}
        initialTo={transitPrefill?.to ?? null}
        initialTime={transitPrefill?.time ?? null}
      />
    )
  }

  const roleLabel = (i: number, count: number) =>
    i === 0 ? t(form.type === 'cruise' ? 'reservations.cruise.embark' : 'reservations.meta.from')
      : i === count - 1 ? t(form.type === 'cruise' ? 'reservations.cruise.disembark' : 'reservations.meta.to')
        : t(form.type === 'cruise' ? 'reservations.cruise.port' : 'reservations.layover.stop')

  // Flight route: ordered airports (origin, stops, destination) on one rail.
  const flightRoute = () => (
    <DialogSection key="flight" label={t('reservations.layover.route')}>
      <ol>
        {waypoints.map((wp, i) => {
          const isFirst = i === 0
          const isLast = i === waypoints.length - 1
          const updateWp = (patch: Partial<WaypointForm>) => setWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
          return (
            <RailStop key={i} first={isFirst} last={isLast}>
              <div className={PANEL}>
                <StopHead label={roleLabel(i, waypoints.length)} onRemove={!isFirst && !isLast ? () => setWaypoints(prev => prev.filter((_, j) => j !== i)) : undefined}>
                  <div className={SEARCH_ON_PANEL}>
                    <AirportSelect value={wp.airport} onChange={a => updateWp({ airport: a || null })} />
                  </div>
                </StopHead>
                {!isFirst && (
                  <div className={wp.airport ? GRID_3 : GRID_2}>
                    {dayField(t('reservations.arrivalDate'), wp.arrDayId, v => updateWp({ arrDayId: v }))}
                    {timeField(t('reservations.arrivalTime'), wp.arrTime, v => updateWp({ arrTime: v }))}
                    {wp.airport && zoneField(t('reservations.meta.arrivalTimezone'), wp.airport.tz)}
                  </div>
                )}
                {!isLast && (
                  <>
                    <div className={wp.airport ? GRID_3 : GRID_2}>
                      {dayField(t('reservations.departureDate'), wp.depDayId, v => updateWp({ depDayId: v }))}
                      {timeField(t('reservations.departureTime'), wp.depTime, v => updateWp({ depTime: v }))}
                      {wp.airport && zoneField(t('reservations.meta.departureTimezone'), wp.airport.tz)}
                    </div>
                    <div className={writesFlightLegs ? GRID_4 : GRID_3}>
                      <EditorField label={t('reservations.meta.airline')}>
                        <input type="text" value={wp.airline} onChange={e => updateWp({ airline: e.target.value })} placeholder="Lufthansa" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.flightNumber')}>
                        <input type="text" value={wp.flight_number} onChange={e => updateWp({ flight_number: e.target.value })} placeholder="LH 123" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.seat')}>
                        <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="12A" className={INPUT} />
                      </EditorField>
                      {writesFlightLegs && (
                        <EditorField label={t('reservations.confirmationCode')}>
                          <BookingCodeInput value={wp.confirmation_number} onChange={e => updateWp({ confirmation_number: e.target.value })}
                            placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
                        </EditorField>
                      )}
                    </div>
                  </>
                )}
              </div>
              {!isLast && (
                <div className="py-2.5">
                  <AddRowButton onClick={() => setWaypoints(prev => [...prev.slice(0, i + 1), emptyWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}>
                    {t('reservations.layover.addStop')}
                  </AddRowButton>
                </div>
              )}
            </RailStop>
          )
        })}
      </ol>
    </DialogSection>
  )

  // Train route: ordered stations on the same rail, per-leg train fields.
  const trainRoute = () => (
    <DialogSection key="train" label={t('reservations.layover.route')}>
      <ol>
        {trainWaypoints.map((wp, i) => {
          const isFirst = i === 0
          const isLast = i === trainWaypoints.length - 1
          const updateWp = (patch: Partial<StationWaypointForm>) => setTrainWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
          return (
            <RailStop key={i} first={isFirst} last={isLast}>
              <div className={PANEL}>
                <StopHead label={roleLabel(i, trainWaypoints.length)} onRemove={!isFirst && !isLast ? () => setTrainWaypoints(prev => prev.filter((_, j) => j !== i)) : undefined}>
                  <div className={SEARCH_ON_PANEL}>
                    <LocationSelect value={wp.location} onChange={l => updateWp({ location: l || null })} places={locationPicks} />
                  </div>
                </StopHead>
                {!isFirst && (
                  <div className={GRID_2}>
                    {dayField(t('reservations.arrivalDate'), wp.arrDayId, v => updateWp({ arrDayId: v }))}
                    {timeField(t('reservations.arrivalTime'), wp.arrTime, v => updateWp({ arrTime: v }))}
                  </div>
                )}
                {!isLast && (
                  <>
                    <div className={GRID_2}>
                      {dayField(t('reservations.departureDate'), wp.depDayId, v => updateWp({ depDayId: v }))}
                      {timeField(t('reservations.departureTime'), wp.depTime, v => updateWp({ depTime: v }))}
                    </div>
                    {/* A cruise's ports carry only their times: number, platform and seat are a train's. */}
                    {form.type === 'train' && <div className={writesTrainLegs ? GRID_4 : GRID_3}>
                      <EditorField label={t('reservations.meta.trainNumber')}>
                        <input type="text" value={wp.train_number} onChange={e => updateWp({ train_number: e.target.value })} placeholder="ICE 123" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.platform')}>
                        <input type="text" value={wp.platform} onChange={e => updateWp({ platform: e.target.value })} placeholder="12" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.seat')}>
                        <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="42A" className={INPUT} />
                      </EditorField>
                      {writesTrainLegs && (
                        <EditorField label={t('reservations.confirmationCode')}>
                          <BookingCodeInput value={wp.confirmation_number} onChange={e => updateWp({ confirmation_number: e.target.value })}
                            placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
                        </EditorField>
                      )}
                    </div>}
                  </>
                )}
              </div>
              {!isLast && (
                <div className="py-2.5">
                  <AddRowButton onClick={() => setTrainWaypoints(prev => [...prev.slice(0, i + 1), emptyStationWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}>
                    {t(form.type === 'cruise' ? 'reservations.cruise.addPort' : 'reservations.layover.addStop')}
                  </AddRowButton>
                </div>
              )}
            </RailStop>
          )
        })}
      </ol>
    </DialogSection>
  )

  // Every other type: one From and one To, the day and time rows under them.
  const plainRoute = () => (
    <DialogSection key="plain" label={t('reservations.layover.route')}>
      <div className={PANEL}>
        <div className={GRID_2}>
          <EditorField label={t('reservations.meta.from')}>
            <div className={SEARCH_ON_PANEL}>
              <LocationSelect value={fromPick.location || null} onChange={l => setFromPick({ location: l || undefined })} places={locationPicks} />
            </div>
          </EditorField>
          <EditorField label={t('reservations.meta.to')}>
            <div className={SEARCH_ON_PANEL}>
              <LocationSelect value={toPick.location || null} onChange={l => setToPick({ location: l || undefined })} places={locationPicks} />
            </div>
          </EditorField>
        </div>

        {/* Stops along the drive, cars only (#1797). The rental frame above stays the
            pick-up and return; these are the places in between, in order. */}
        {isCar && (
          <div>
            <Eyebrow className="mb-[5px]">{t('roadtrip.stops.label')}</Eyebrow>
            <div className="flex flex-col gap-2">
              {carStops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* The order of the stops IS the route (sequence is the index at save
                      time), and the row has no room left to drag by, hence buttons. */}
                  {carStops.length > 1 && (
                    <div className="flex flex-none flex-col">
                      <IconAction label={t('dayplan.moveUp')} onClick={() => moveCarStop(i, -1)} disabled={i === 0} shape="h-[18px] w-6 rounded-md">
                        <ChevronUp size={13} />
                      </IconAction>
                      <IconAction label={t('dayplan.moveDown')} onClick={() => moveCarStop(i, 1)} disabled={i === carStops.length - 1} shape="h-[18px] w-6 rounded-md">
                        <ChevronDown size={13} />
                      </IconAction>
                    </div>
                  )}
                  <div className={`${SEARCH_ON_PANEL} flex-1`}>
                    <LocationSelect
                      value={stop.location}
                      onChange={l => setCarStops(prev => prev.map((s, j) => (j === i ? { ...s, location: l || null } : s)))}
                      places={locationPicks}
                    />
                  </div>
                  <div className="w-[110px] flex-none">
                    <CustomTimePicker
                      value={stop.time}
                      onChange={v => setCarStops(prev => prev.map((s, j) => (j === i ? { ...s, time: v } : s)))}
                    />
                  </div>
                  <IconAction label={t('roadtrip.stops.remove')} onClick={() => setCarStops(prev => prev.filter((_, j) => j !== i))} danger>
                    <X size={14} />
                  </IconAction>
                </div>
              ))}
              <AddRowButton onClick={() => setCarStops(prev => [...prev, emptyCarStop()])}>{t('reservations.layover.addStop')}</AddRowButton>
            </div>
          </div>
        )}

        <div className={GRID_2}>
          {dayField(isCar ? t('reservations.pickupDate') : t('reservations.date'), form.start_day_id, value => set('start_day_id', value))}
          {timeField(isCar ? t('reservations.pickupTime') : t('reservations.startTime'), form.departure_time, v => set('departure_time', v))}
        </div>
        <div className={GRID_2}>
          {dayField(isCar ? t('reservations.returnDate') : t('reservations.endDate'), form.end_day_id, value => set('end_day_id', value))}
          {timeField(isCar ? t('reservations.returnTime') : t('reservations.endTime'), form.arrival_time, v => set('arrival_time', v))}
        </div>
      </div>
    </DialogSection>
  )

  return (
    <DialogShell
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      width="editor"
      align="top"
      blocked={showDeleteConfirm}
      // A stray click beside the editor asks before the typing is lost (#2253).
      discardGuard={{ form, waypoints, trainWaypoints, carStops, files: pendingFiles.length, travelers: [...travelerIds] }}
      onSubmit={automated ? undefined : handleSubmit}
      header={header}
      footer={footer}
    >
      {automated ? (
        /* Automated: public transit search (#1065) for the day picked in the head band. */
        transitSearch()
      ) : (
        <>
          {/* Travelers: trip members and guests on this booking (#1517) */}
          <DialogSection label={t('reservations.travelers.label')}>
            <TravelerPicker tripMembers={tripMembers} selectedIds={travelerIds} onToggle={toggleTraveler} />
          </DialogSection>

          {form.type === 'flight' ? flightRoute() : stationRoute ? trainRoute() : plainRoute()}

          <EditorField label={t('reservations.confirmationCode')}>
            <BookingCodeInput value={form.confirmation_number} onChange={e => set('confirmation_number', e.target.value)}
              placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
          </EditorField>

          <BookingNotesFilesCosts
            notes={form.notes}
            onNotesChange={value => set('notes', value)}
            url={form.url}
            onUrlChange={value => set('url', value)}
            reservationId={reservation?.id}
            tripFiles={files}
            pendingFiles={pendingFiles}
            fileInputRef={fileInputRef}
            attach={attach}
            canAttach={!!onFileUpload}
            showCosts={isBudgetEnabled}
            pendingExpense={pendingExpense}
            expense={expense}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('reservations.confirm.deleteTitle')}
        message={t('reservations.confirm.deleteBody', { name: reservation?.title ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={async () => {
          setShowDeleteConfirm(false)
          await onDelete?.()
          onClose()
        }}
      />
    </DialogShell>
  )
}

const GRID_4 = 'grid grid-cols-4 items-start gap-3 max-sm:grid-cols-1'

/** One stop on the route: a dot on the line from origin to destination, its fields beside it. */
function RailStop({ first, last, children }: { first: boolean; last: boolean; children: ReactNode }) {
  return (
    <li className="relative ps-7">
      {!first && <span aria-hidden="true" className="absolute start-[7px] top-0 h-6 w-0.5 bg-edge" />}
      {!last && <span aria-hidden="true" className="absolute bottom-0 start-[7px] top-6 w-0.5 bg-edge" />}
      <span
        aria-hidden="true"
        className={`absolute start-[3px] top-[19px] h-2.5 w-2.5 rounded-full border-2 bg-surface-card ${first || last ? 'border-content-muted' : 'border-content-faint'}`}
      />
      {children}
    </li>
  )
}

/** The role of a stop over its place field, and the remove action an intermediate stop has. */
function StopHead({ label, onRemove, children }: { label: string; onRemove?: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-[24px] items-center gap-2">
        <Eyebrow className="min-w-0 flex-1 truncate">{label}</Eyebrow>
        {onRemove && (
          <IconAction label={t('common.delete')} onClick={onRemove} danger>
            <Trash2 size={13} />
          </IconAction>
        )}
      </div>
      {children}
    </div>
  )
}

/** A small icon button inside a route, named by its tooltip. */
function IconAction({ label, onClick, disabled, danger = false, shape = 'h-6 w-6 rounded-full', children }: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  shape?: string
  children: ReactNode
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`grid flex-none place-items-center text-content-faint enabled:hover:bg-surface-hover disabled:cursor-default disabled:opacity-30 ${danger ? 'enabled:hover:text-danger' : 'enabled:hover:text-content'} ${shape}`}
      >
        {children}
      </button>
    </Tooltip>
  )
}
