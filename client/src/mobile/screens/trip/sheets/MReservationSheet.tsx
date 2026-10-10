import { useEffect, useMemo, useState } from 'react'
import { Link2, Ticket } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { MBookingCodeStatus, MBookingNotes, MBookingTravelers } from './MBookingFields'
import { useAddonStore } from '../../../../store/addonStore'
import { useTranslation } from '../../../../i18n'
import CustomSelect from '../../../../components/shared/CustomSelect'
import CustomTimePicker from '../../../../components/shared/CustomTimePicker'
import { CustomDatePicker } from '../../../../components/shared/CustomDateTimePicker'
import { Eyebrow, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import MBookingFilesCosts from './MBookingFilesCosts'
import { expenseRequestAfterSave, travelerIdsOf, travelersChanged, uploadBookingFiles } from '../../../../components/Planner/bookingFormModel'
import { useBookingExpenseIntent } from '../../../../components/Planner/useBookingExpenseIntent'
import {
  RESERVATION_TYPE_OPTIONS as TYPE_OPTIONS, reservationFieldsFrom, reservationFieldsFromPrefill,
} from '../../../../components/Planner/reservationFormModel'
import { useReservationForm } from '../../../../components/Planner/useReservationForm'
import { buildAssignmentOptions } from '../../../../components/Planner/assignmentOptions'
import { useTripStore } from '../../../../store/tripStore'
import type { BookingExpenseRequest } from '../../../../components/Planner/BookingCostsSection.types'
import type { TripPlanner } from '../MTripShell'
import { stayPlaces } from '../../../../utils/stayPlaces'

export interface MReservationSheetProps {
  planner: TripPlanner
  onOpenExpense: (req: BookingExpenseRequest) => void
}

const EMPTY = {
  title: '', type: 'other', status: 'pending',
  reservation_time: '', reservation_end_time: '', end_date: '', location: '', confirmation_number: '',
  notes: '', url: '', place_id: '' as string | number, accommodation_id: '' as string | number,
  meta_check_in_time: '', meta_check_out_time: '',
  hotel_place_id: '' as string | number, hotel_start_day: '' as string | number, hotel_end_day: '' as string | number,
  hotel_address: '',
}

/**
 * Add/edit booking sheet — the mobile counterpart of the desktop ReservationModal,
 * driven by the planner's own editor flags (showReservationModal / editingReservation /
 * reservationPrefill / bookingForAssignmentId) so every entry point (bookings tab, day
 * sheet, timeline, import review) opens it unchanged. Saving reuses
 * planner.handleSaveReservation, which owns the accommodation split, file upload and undo.
 */
export default function MReservationSheet({ planner, onOpenExpense }: MReservationSheetProps) {
  const {
    t, toast, tripId, days, places, tripAccommodations, tripMembers, selectedDayId,
    showReservationModal, setShowReservationModal,
    editingReservation, setEditingReservation, reservationPrefill,
    bookingForAssignmentId, setBookingForAssignmentId,
    assignments,
    importReviewActive, advanceImportReview,
    handleSaveReservation, canUploadFiles,
  } = planner
  const { locale } = useTranslation()
  const setReservationTravelers = useTripStore(s => s.setReservationTravelers)

  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))

  const {
    form, setForm, set, isSaving, setIsSaving, pendingFiles, setPendingFiles, travelerIds, setTravelerIds, toggleTraveler,
    isEndBeforeStart, dateBounds, startDate, startTime, setStartDate, setStartTime, takeStopDay,
    pickPlace, pickHotelPlace, pickHotelStart, pickHotelEnd, saveData: buildSaveData,
  } = useReservationForm(EMPTY, days, places)
  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(days, assignments, t, locale),
    [days, assignments, t, locale],
  )

  // Ref (not state) so handleSubmit reads the intent set by the same click.
  const expense = useBookingExpenseIntent(() => handleSubmit())
  // Open-time snapshot so the sheet content survives the exit animation.
  const [snap, setSnap] = useState<{ res: typeof editingReservation; assignmentId: number | null }>(
    { res: null, assignmentId: null },
  )
  // The stop this booking hangs on. Seeded from the booking being edited, not
  // only from the create-for-a-stop flag, because saving used to write the flag
  // straight back and an edit therefore erased the link (#2216).
  const [assignmentId, setAssignmentId] = useState<number | ''>('')

  useEffect(() => {
    if (!showReservationModal) return
    setSnap({ res: editingReservation, assignmentId: bookingForAssignmentId ?? null })
    setAssignmentId(bookingForAssignmentId ?? editingReservation?.assignment_id ?? '')
    expense.reset()
    setPendingFiles([])
    setTravelerIds(travelerIdsOf(editingReservation))

    const res = editingReservation
    if (res) {
      setForm({ ...EMPTY, ...reservationFieldsFrom(res, tripAccommodations, places, false) })
    } else if (reservationPrefill) {
      const pf = reservationPrefill
      setForm({ ...EMPTY, ...reservationFieldsFromPrefill(pf, days, false) })
      setPendingFiles(pf._sourceFiles ?? [])
    } else {
      // Opened from a day's toolbar: start on that day rather than on a blank
      // date the user has to look up again (#1998). A hotel spans to the next
      // day, which is what checking in on this day actually means.
      const ctxDay = planner.reservationModalDayId != null
        ? days.find(d => d.id === planner.reservationModalDayId)
        : undefined
      const ctxDate = ctxDay?.date ? ctxDay.date.slice(0, 10) : ''
      const nextDay = ctxDay ? days[days.indexOf(ctxDay) + 1] : undefined
      setForm(ctxDate
        ? {
            ...EMPTY,
            reservation_time: ctxDate,
            hotel_start_day: ctxDay!.id,
            hotel_end_day: nextDay?.id ?? ctxDay!.id,
          }
        : EMPTY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReservationModal])

  const res = snap.res
  const isHotel = form.type === 'hotel'

  const fmtDate = (d?: string | null) =>
    d ? new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }) : undefined

  const placeOptions = [{ value: '', label: '—' }, ...places.map(p => ({ value: p.id, label: p.name }))]
  const hotelPlaceOptions = [{ value: '', label: '—' }, ...stayPlaces(places, form.hotel_place_id).map(p => ({ value: p.id, label: p.name }))]
  const dayOptions = days.map(d => ({
    value: d.id,
    label: d.title || t('dayplan.dayN', { n: d.day_number }),
    badge: fmtDate(d.date),
  }))

  // Restrict non-hotel booking dates to the trip's span (#1662); hotels already
  // constrain to trip days via their day dropdowns.
  const tripMinDate = dateBounds.min
  const tripMaxDate = dateBounds.max

  const handleClose = () => {
    if (importReviewActive) { advanceImportReview(); return }
    planner.setReservationModalDayId(null)
    setShowReservationModal(false)
    setEditingReservation(null)
    setBookingForAssignmentId(null)
  }

  const handleSubmit = async () => {
    // Only the costs button reaches this without the footer's date check.
    if (isEndBeforeStart) { toast.error(t('reservations.validation.endBeforeStart')); return }
    const withExpense = expense.take()
    setIsSaving(true)
    try {
      const saveData = buildSaveData({ assignmentId, isEdit: !!snap.res?.id, withCheckInEnd: false })
      const saved = await handleSaveReservation(saveData as never)
      // Persist the traveler assignment once we have the reservation id (from the
      // save result on create, or the edited reservation) — only when it changed.
      const savedId = saved?.id ?? res?.id
      if (savedId) {
        const { changed, nextIds } = travelersChanged(res, travelerIds)
        if (changed) await setReservationTravelers(tripId, savedId, nextIds)
      }
      if (saved?.id && canUploadFiles) {
        await uploadBookingFiles(fd => planner.tripActions.addFile(tripId, fd), saved.id, pendingFiles, form.title)
      }
      const expenseRequest = expenseRequestAfterSave(withExpense, saved?.id, form)
      if (expenseRequest) onOpenExpense(expenseRequest)
      if (importReviewActive && saved) advanceImportReview()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <MSheet
      open={showReservationModal}
      onClose={handleClose}
      material="opaque"
      ariaLabel={res ? t('reservations.editTitle') : t('reservations.newTitle')}
      discardGuard={showReservationModal ? { form, files: pendingFiles.length, travelers: [...travelerIds] } : undefined}
    >
      <FormSheetHeader
        icon={Ticket}
        title={res ? t('reservations.editTitle') : t('reservations.newTitle')}
        onClose={handleClose}
        closeLabel={t('common.close')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-[2px]">
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

        {!isHotel && (
          <>
            <div className="mt-3 flex gap-2">
              <div className="min-w-0 flex-[1.2]">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.date')}</Eyebrow>
                <CustomDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  min={tripMinDate}
                  max={tripMaxDate}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.startTime')}</Eyebrow>
                <CustomTimePicker
                  value={startTime}
                  onChange={tm => setStartTime(tm, days.find(dy => dy.id === selectedDayId)?.date || '')}
                />
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <div className="min-w-0 flex-[1.2]">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.endDate')}</Eyebrow>
                <CustomDatePicker value={form.end_date} onChange={d => set('end_date', d || '')} min={tripMinDate} max={tripMaxDate} />
              </div>
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.endTime')}</Eyebrow>
                <CustomTimePicker value={form.reservation_end_time} onChange={v => set('reservation_end_time', v)} />
              </div>
            </div>
            {isEndBeforeStart && (
              <div className="mt-[6px] text-[0.6875rem] text-[color:var(--m-st-danger)]">
                {t('reservations.validation.endBeforeStart')}
              </div>
            )}

            {/* PLACE / ACTIVITY */}
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.meta.linkPlace')}</Eyebrow>
            <CustomSelect
              value={form.place_id}
              onChange={pickPlace}
              options={placeOptions}
              placeholder={t('reservations.meta.pickPlace')}
              searchable
              size="sm"
            />

            {/* LOCATION / ADDRESS */}
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.locationAddress')}</Eyebrow>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder={t('reservations.locationPlaceholder')}
              className={FIELD_CLS}
            />
          </>
        )}

        {isHotel && (
          <>
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.meta.hotelPlace')}</Eyebrow>
            <CustomSelect
              value={form.hotel_place_id}
              onChange={pickHotelPlace}
              options={hotelPlaceOptions}
              placeholder={t('reservations.meta.pickHotel')}
              searchable
              size="sm"
            />

            <div className="mt-3 flex gap-2">
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.fromDay')}</Eyebrow>
                <CustomSelect
                  value={form.hotel_start_day}
                  onChange={pickHotelStart}
                  options={dayOptions}
                  placeholder={t('reservations.meta.selectDay')}
                  size="sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.toDay')}</Eyebrow>
                <CustomSelect
                  value={form.hotel_end_day}
                  onChange={pickHotelEnd}
                  options={dayOptions}
                  placeholder={t('reservations.meta.selectDay')}
                  size="sm"
                />
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.checkIn')}</Eyebrow>
                <CustomTimePicker value={form.meta_check_in_time} onChange={v => set('meta_check_in_time', v)} placeholder="15:00" />
              </div>
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.checkOut')}</Eyebrow>
                <CustomTimePicker value={form.meta_check_out_time} onChange={v => set('meta_check_out_time', v)} placeholder="11:00" />
              </div>
            </div>

            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.locationAddress')}</Eyebrow>
            <input
              type="text"
              value={form.hotel_address}
              onChange={e => set('hotel_address', e.target.value)}
              placeholder={t('reservations.locationPlaceholder')}
              className={FIELD_CLS}
            />
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

        {/* LINK */}
        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.urlLabel')}</Eyebrow>
        <div className="relative">
          <Link2 size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-m-faint" />
          <input
            type="url"
            value={form.url}
            onChange={e => set('url', e.target.value)}
            placeholder={t('reservations.urlPlaceholder')}
            className={`${FIELD_CLS} ps-[34px]`}
          />
        </div>

        {/* NOTES */}
        <MBookingNotes t={t} value={form.notes} onChange={value => set('notes', value)} />

        {/* TRAVELERS */}
        <MBookingTravelers t={t} tripMembers={tripMembers} selectedIds={travelerIds} onToggle={toggleTraveler} />

        {/* LINK TO A STOP IN THE PLAN (#2216) */}
        {!isHotel && assignmentOptions.length > 0 && (
          <>
            <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.linkAssignment')}</Eyebrow>
            <CustomSelect
              value={assignmentId}
              onChange={value => {
                setAssignmentId(value === '' ? '' : Number(value))
                const opt = assignmentOptions.find(o => o.value === value)
                // Same courtesy as the desktop dialog: an undated booking takes
                // the day of the stop it was just linked to.
                if (opt?.dayDate) takeStopDay(opt.dayDate)
              }}
              placeholder={t('reservations.pickAssignment')}
              options={[{ value: '', label: t('reservations.noAssignment') }, ...assignmentOptions]}
              searchable
              size="sm"
            />
          </>
        )}

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
      </div>

      <FormSheetFooter
        onCancel={handleClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSubmit}
        submitLabel={isSaving ? t('common.saving') : res ? t('common.update') : t('common.add')}
        submitDisabled={!form.title.trim() || isSaving || isEndBeforeStart}
      />
    </MSheet>
  )
}
